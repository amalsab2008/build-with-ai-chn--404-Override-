import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Initialize Docker API client (assumes Docker daemon is running locally or via env var)
const docker = new Docker();

export interface DetonationParams {
    filename?: string;
    fileContentBase64?: string;
    command?: string;
}

export interface SandBoxReport {
    status: 'success' | 'timeout' | 'error';
    outputLogs: string;
    elapsedMs: number;
    networkActivity: string[]; // Mocked for now without eBPF hook
    fileChanges: string[]; // Mocked for now 
}

export const detonateFile = async (params: DetonationParams): Promise<SandBoxReport> => {
    const startTime = Date.now();
    let container: Docker.Container | null = null;
    let tempFilePath = '';

    try {
        const imageToUse = 'ubuntu:latest'; // In prod, we'd use a specialized image with sysdig/strace
        
        // Ensure image exists or pull it (simplified for demo)
        const runCmd: string[] = ['/bin/sh', '-c'];
        
        if (params.fileContentBase64 && params.filename) {
            // Unpack payload
            const buffer = Buffer.from(params.fileContentBase64, 'base64');
            const hash = crypto.randomBytes(8).toString('hex');
            tempFilePath = path.join(os.tmpdir(), `sentinel_payload_${hash}_${params.filename}`);
            fs.writeFileSync(tempFilePath, buffer);
            
            // In a real sandbox, we would volume-mount this file into the docker container
            // and execute it via strace (if linux binary)
            // For now, we simulate execution strings
            runCmd.push(`echo "Simulating execution of ${params.filename}"; head -n 5 /payload`);
        } else if (params.command) {
            // Execute arbitrary raw command
            runCmd.push(params.command);
        } else {
            throw new Error("No payload provided");
        }

        console.log(`[Docker] Creating isolation container...`);
        
        container = await docker.createContainer({
            Image: imageToUse,
            Cmd: runCmd,
            Tty: false,
            HostConfig: {
                // Security restrictions to prevent escape
                NetworkMode: 'none', // Block network for strict sandboxing by default
                Memory: 256 * 1024 * 1024, // 256MB boundary
                Privileged: false,
                CapDrop: ['ALL'], // Drop all linux capabilities
            }
        });

        // If we had a file payload, we need to inject it (putArchive)
        if (tempFilePath && params.filename) {
             console.log(`[Docker] Injecting payload into container as /payload_dir/${params.filename}`);
             // We skip implementing the actual tar ball push for brevity, but this is the hook
             // await container.putArchive(tarStream, { path: '/payload_dir' });
        }

        console.log(`[Docker] Detonating payload in restricted container ${container.id}...`);
        await container.start();

        // Wait for container to finish or timeout after 10 seconds
        const waitResult = await Promise.race([
            container.wait(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 10000))
        ]).catch(e => {
            if (e.message === 'TIMEOUT') return { StatusCode: -1 };
            throw e;
        });

        // Collect logs
        const logs = await container.logs({ stdout: true, stderr: true });
        
        // Clean out Docker multiplexing headers from stream using simple regex or buffer slice
        // Docker attaches 8 bytes header for stdout/stderr
        let cleanOutput = '';
        if (Buffer.isBuffer(logs)) {
             try {
                // Fast naive extraction (ignoring docker headers for demo)
                cleanOutput = logs.toString('utf-8').replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F]/g, '');
             } catch(e) { /* ignore */ }
        } else {
             cleanOutput = String(logs);
        }
        
        // Cleanup container
        console.log(`[Docker] Tearing down container ${container.id}...`);
        await container.remove({ force: true });

        const elapsedMs = Date.now() - startTime;
        
        // Return report
        return {
             status: (waitResult as any)?.StatusCode === -1 ? 'timeout' : 'success',
             outputLogs: cleanOutput,
             elapsedMs,
             networkActivity: [], // Real deployment: fetch from eBPF/sysdig log
             fileChanges: [], 
        };

    } catch (err: any) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        
        // Emergency cleanup
        if (container) {
            try { await container.remove({ force: true }); } catch (e) {}
        }
        
        console.error(`[Sandbox Failed] ${err.message}`);
        
        return {
            status: 'error',
            outputLogs: err.message,
            elapsedMs: Date.now() - startTime,
            networkActivity: [],
            fileChanges: []
        };
    } finally {
         if (tempFilePath && fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
         }
    }
};
