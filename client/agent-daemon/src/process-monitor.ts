import { exec } from 'child_process';
import axios from 'axios';
import dotenv from 'dotenv';
import util from 'util';

dotenv.config();
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000/api/telemetry';
const execPromise = util.promisify(exec);

export interface OSProcess {
    Name: string;
    ProcessId: number;
    ParentProcessId: number;
    CommandLine: string | null;
}

import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

// Keep track of processes we already reported to avoid spamming the SOC
const reportedPIDs = new Set<number>();

export const startProcessMonitor = () => {
    console.log(`[OS Monitor] Native Process hooks engaged. Monitoring process trees...`);
    
    const sensorPath = path.resolve(__dirname, '../../../packages/windows-sensor/target/release/windows-sensor.exe');
    
    if (fs.existsSync(sensorPath)) {
        console.log(`[OS Sensor] Found native Rust Windows sensor at ${sensorPath}`);
        startNativeSensor(sensorPath);
    } else {
        console.warn(`[OS Sensor] Native Rust sensor not found. Falling back to PowerShell WMI polling...`);
        console.warn(`[OS Sensor] (To enable real-time tracking, compile 'packages/windows-sensor' with cargo)`);
        setInterval(scanProcessesFallback, 5000);
    }
};

const startNativeSensor = (sensorPath: string) => {
    const sensorProcess = spawn(sensorPath, [], { stdio: ['ignore', 'pipe', 'pipe'] });

    sensorProcess.stdout.on('data', (data) => {
        const output = data.toString();
        const lines = output.split('\n');
        
        for (const line of lines) {
            if (!line.trim() || !line.startsWith('{')) continue;
            try {
                const proc: OSProcess = JSON.parse(line.trim());
                evaluateThreat(proc, undefined);
            } catch (err) {
                // Not JSON or parse error block
            }
        }
    });

    sensorProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (output) {
             console.log(output);
        }
    });

    sensorProcess.on('close', (code) => {
        console.log(`[OS Sensor] Native sensor exited with code ${code}. Restarting in 5s...`);
        setTimeout(() => startNativeSensor(sensorPath), 5000);
    });
};

const evaluateThreat = (proc: OSProcess, cachedParent?: OSProcess) => {
    // Check Rule: Suspicious Child Process (Powershell/CMD) spawned by standard apps
    if ((proc.Name.toLowerCase() === 'powershell.exe' || proc.Name.toLowerCase() === 'cmd.exe')) {
         // In real-time mode we might not have parent context instantaneously without caching
         // For demo purposes, we will flag obfsucated command lines immediately
         const isObfuscated = proc.CommandLine?.toLowerCase().includes('-enc') || proc.CommandLine?.toLowerCase().includes('-windowstyle hidden');

         if (isObfuscated && !reportedPIDs.has(proc.ProcessId)) {
             reportedPIDs.add(proc.ProcessId);
             // Create mock parent if not provided (native sensor outputs individual events)
             const parent = cachedParent || { Name: "Unknown_Parent", ProcessId: proc.ParentProcessId, ParentProcessId: 0, CommandLine: "Unknown" };
             reportThreat(proc, parent);
         }
    }
};

const scanProcessesFallback = async () => {
    try {
        // Fetch raw process data using WMI/CIM in PowerShell
        // We select Name, ProcessId, ParentProcessId, and CommandLine
        const psCommand = `Get-WmiObject Win32_Process | Select-Object Name, ProcessId, ParentProcessId, CommandLine | ConvertTo-Json -Compress`;
        
        const { stdout } = await execPromise(`powershell.exe -NoProfile -Command "${psCommand}"`, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
        if (!stdout) return;

        // Split by lines in case JSON objects are returned staggered, but -Compress usually outputs an array
        let processes: OSProcess[] = [];
        try {
            processes = JSON.parse(stdout);
        } catch (e) {
            // Sometime powershell json parsing gets weird with large outputs, fallback logic here
            return; 
        }

        if (!Array.isArray(processes)) {
            processes = [processes];
        }

        // Map for fast parent lookups
        const procMap = new Map<number, OSProcess>();
        processes.forEach(p => procMap.set(p.ProcessId, p));

        // Evaluate rules
        for (const proc of processes) {
             const parent = procMap.get(proc.ParentProcessId);
             
             if (parent) {
                 // Check Rule: Suspicious Child Process (Powershell/CMD) spawned by standard apps
                 if ((proc.Name.toLowerCase() === 'powershell.exe' || proc.Name.toLowerCase() === 'cmd.exe')) {
                     
                     const suspiciousParents = ['winword.exe', 'excel.exe', 'powerpnt.exe', 'acrobat.exe', 'chrome.exe', 'msedge.exe'];
                     const isSuspiciousParent = suspiciousParents.includes(parent.Name.toLowerCase());
                     
                     // Check if it has a sketchy command line like "-enc" or "-hidden"
                     const isObfuscated = proc.CommandLine?.toLowerCase().includes('-enc') || proc.CommandLine?.toLowerCase().includes('-windowstyle hidden');

                     if ((isSuspiciousParent || isObfuscated) && !reportedPIDs.has(proc.ProcessId)) {
                         reportedPIDs.add(proc.ProcessId);
                         reportThreat(proc, parent);
                     }
                 }
             }
        }

    } catch (error) {
        // Ignore generic WMI timeout errors
    }
};

const reportThreat = async (proc: OSProcess, parent: OSProcess) => {
    console.log(`[Alert] Suspicious Process Hierarchy Detected!`);
    console.log(` -> Parent: ${parent.Name} (PID: ${parent.ProcessId})`);
    console.log(` -> Child:  ${proc.Name} (PID: ${proc.ProcessId})`);
    
    // Construct attack graph telemetry
    const contentSnapshot = `
# OS-Level Execution Alert
Parent Process: ${parent.Name} (PID: ${parent.ProcessId})
Parent Command: ${parent.CommandLine}

Spawned Child Process: ${proc.Name} (PID: ${proc.ProcessId})
Child Command executed: ${proc.CommandLine}

This indicates possible Macro-level attack, Living-off-the-land (LOLBin) abuse, or process injection.
`;

    // Send telemetry to Cloud Gateway for Gemini Verification
    try {
        const res = await axios.post(GATEWAY_URL, {
            type: 'PROCESS_SPAWN',
            filename: `${parent.Name} -> ${proc.Name}`,
            fileHash: "IN-MEMORY-EXECUTION",
            entropy: 8.0, // High entropy forced for process injections
            contentSnapshot: contentSnapshot,
            timestamp: new Date().toISOString()
        });
        
        console.log(`[Telemetry] Process tree reported. Cloud Verdict: ${res.data.verdict?.decision}`);
        
        if (res.data.verdict?.decision === 'BLOCK') {
            console.log(`[ACTION] Terminating malicious process PID: ${proc.ProcessId}`);
            await execPromise(`taskkill /F /PID ${proc.ProcessId}`);
        }
        
    } catch (error: any) {
        console.error(`[Error] Failed to report process telemetry: ${error.message}`);
    }
};
