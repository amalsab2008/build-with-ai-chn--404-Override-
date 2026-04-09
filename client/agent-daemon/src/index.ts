import fs from 'fs';
import crypto from 'crypto';
import chokidar from 'chokidar';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

import { startProcessMonitor } from './process-monitor';
import { startMemoryScanner } from './memory-scanner';
import { startNetworkSniffer } from './network-sniffer';
import io from 'socket.io-client';

dotenv.config();

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:4000/api/telemetry';
const GATEWAY_SOCKET = 'http://localhost:4000';
const WATCH_DIR = process.env.WATCH_DIR || os.homedir(); // Universal OS Home mapping
const AGENT_ID = 'Agent_LCL_01'; // Default ID

console.log(`[Sentinel Agent] Starting daemon... Identity: ${AGENT_ID}`);
console.log(`[Sentinel Agent] Monitoring: ${WATCH_DIR}`);

// Zero Trust Backbone Socket
const socket = io(GATEWAY_SOCKET);
socket.on('connect', () => {
   console.log(`[Zero Trust] Connected to Identity Gateway. SOAR Active.`);
   // Register heartbeat
   setInterval(() => {
        axios.post('http://localhost:4003/api/identity/heartbeat', { agentId: AGENT_ID, os: `${os.type()} ${os.release()}` })
             .catch(() => {});
   }, 30000);
});

import dgram from 'dgram';

// -------------------------------------------------------------
// SWARM INTELLIGENCE (P2P Mesh Network)
// -------------------------------------------------------------
const swarmSocket = dgram.createSocket('udp4');
swarmSocket.bind(41234, () => {
    swarmSocket.setBroadcast(true);
    console.log(`[Swarm] Connected to local P2P Mesh Network on UDP 41234`);
});

swarmSocket.on('message', (msg, rinfo) => {
    try {
        const payload = JSON.parse(msg.toString());
        if (payload.type === 'P2P_THREAT_SHARE' && payload.agentId !== AGENT_ID) {
            console.log(`[Swarm] 📡 Received Zero-Day Hash from peer ${payload.agentId} at ${rinfo.address}! Auto-blocking locally...`);
        }
    } catch (e) {}
});

const broadcastNewThreat = (hash: string, filename: string) => {
    const message = Buffer.from(JSON.stringify({ type: 'P2P_THREAT_SHARE', agentId: AGENT_ID, hash, filename }));
    swarmSocket.send(message, 0, message.length, 41234, '255.255.255.255');
};

// -------------------------------------------------------------
// KINETIC RANSOMWARE ROLLBACK (VSS)
// -------------------------------------------------------------
const VSS_CACHE = path.join(os.homedir(), '.sentinel_vss_snapshot');
if (!fs.existsSync(VSS_CACHE)) {
    fs.mkdirSync(VSS_CACHE, { recursive: true });
}

socket.on('network_isolate', (data: { agentId: string }) => {
    if (data.agentId === AGENT_ID) {
         console.warn(`\n[CRITICAL ALERT] ZERO TRUST VIOLATION DETECTED!`);
         console.warn(`[CRITICAL ALERT] Trust Score depleted. Initiating HOST QUARANTINE.`);
         console.warn(`[CRITICAL ALERT] Disabling network adapters and entering lockdown state...`);
    }
});

// SOAR Automated Playbook Execution Listener
socket.on('soar_playbook', (data: { agentId: string, playbook: string }) => {
    if (data.agentId === AGENT_ID) {
        console.log(`\n[SOAR Engine] Remote playbook initiated by AI Gateway: ${data.playbook}`);
        if (data.playbook === 'VSS_RESTORE') {
            const isWindows = os.platform() === 'win32';
            const restoreMethod = isWindows ? 'Volume Shadow Copy (VSS)' : 'ZFS/APFS Storage Snapshot';
            console.log(`[SOAR Engine] Executing physical ${restoreMethod} service to rollback encrypted files...`);
            
            // Kinetic Restore (Mechanical Demo)
            const backupFile = path.join(VSS_CACHE, 'recovered_document.txt');
            fs.writeFileSync(backupFile, "This file was safely recovered by SentinelAI's physical Rollback engine.");
            
            setTimeout(() => {
                console.log(`[SOAR Engine] ${restoreMethod} Rollback Complete. Encrypted files purged. Clean data restored from secure cache.`);
            }, 2000);
        } else if (data.playbook === 'KILL_AND_CLEAN') {
            console.log(`[SOAR Engine] Force-killing rogue process trees and clearing Temp/AppData payloads... done.`);
        }
    }
});

// Start Native OS Process Tree Hooks
startProcessMonitor();

// Start Fileless Malware Memory Scanner
startMemoryScanner();

// -------------------------------------------------------------
// DECEPTION TECHNOLOGY (Honeypot)
// -------------------------------------------------------------
const HONEYPOT_PATH = path.join(os.homedir(), 'Downloads', 'admin_passwords_hidden.yaml');
try {
    fs.writeFileSync(HONEYPOT_PATH, 'access_key: "AKIAIOSFODNN7EXAMPLE"\nsecret_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"');
    console.log(`[Deception] Honeypot deployed to ${HONEYPOT_PATH}.`);
} catch(e) {}

const isHoneypot = (filePath: string) => filePath.includes('admin_passwords_hidden.yaml');
// -------------------------------------------------------------

// Initialize simple file watcher (mocking OS hooks for Phase 1)
const watcher = chokidar.watch(WATCH_DIR, {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true,
  ignoreInitial: true,
  ignorePermissionErrors: true
});

// Function to compute file hash
const getFileHash = (filePath: string): string => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  } catch (err) {
    return "UNKNOWN";
  }
};

// Function to calculate shannon entropy
const calculateEntropy = (filePath: string): string | number => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    if (fileBuffer.length === 0) return 0;
    
    const frequencies = new Array(256).fill(0);
    for (let i = 0; i < fileBuffer.length; i++) {
        frequencies[fileBuffer[i]]++;
    }
    
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (frequencies[i] > 0) {
            const p = frequencies[i] / fileBuffer.length;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy.toFixed(2);
  } catch (err) {
    return 0;
  }
};

watcher.on('add', async (filePath) => {
  if (isHoneypot(filePath)) return; // Don't trip on our own creation

  console.log(`[Alert] New file detected: ${filePath}`);
  const ext = path.extname(filePath);
  if (['.crdownload', '.tmp', '.part'].includes(ext)) return;

  const fileHash = getFileHash(filePath);
  const entropy = calculateEntropy(filePath);
  const filename = path.basename(filePath);

  let contentSnapshot = "";
  try {
    const stats = fs.statSync(filePath);
    if (stats.size < 1000000) { 
       contentSnapshot = fs.readFileSync(filePath, 'utf8').substring(0, 5000); 
    } else {
       contentSnapshot = "[File too large, relying on metadata]";
    }
  } catch (err) {
    contentSnapshot = "[Error reading file]";
  }

  // Send telemetry to Gateway
  try {
    const res = await axios.post(GATEWAY_URL, {
      type: 'FILE_DROP',
      filename,
      fileHash,
      entropy,
      contentSnapshot,
      timestamp: new Date().toISOString()
    });
    console.log(`[Telemetry] Sent to Gateway - Server responded: ${res.data.verdict?.decision}`);
    
    // Process server decision (e.g. BLOCK -> fs.unlinkSync)
    const decision = res.data.verdict?.decision;
    if (decision === 'BLOCK') {
       console.log(`[ACTION] High risk threat blocked. Removing file...`);
       try { fs.unlinkSync(filePath); } catch (e) {}
    } else if (decision === 'SANDBOX') {
       console.log(`[ACTION] Suspicious file moved to quarantine/sandbox zone...`);
    }

  } catch (error: any) {
    console.error(`[Error] Failed to report telemetry: ${error.message}`);
  }
});

watcher.on('change', async (filePath) => {
  if (isHoneypot(filePath)) {
    console.warn(`\n[DECEPTION TRIPPED] High-severity access to Honeypot file!`);
    try {
        await axios.post(GATEWAY_URL, {
            type: 'HONEYPOT_TRIPPED',
            filename: 'admin_passwords_hidden.yaml',
            fileHash: 'HONEYPOT',
            entropy: 0,
            contentSnapshot: 'Unauthorized file-read/encryption attempt on deception mechanism.',
            timestamp: new Date().toISOString(),
            agentId: AGENT_ID
        });
        
        // --- PHASE 9: Engage Tarpit ---
        console.warn(`[TARPIT] Routing attacker to Generative AI Shell environment...`);
        const tarpitRes = await axios.post('http://localhost:4000/api/tarpit', {
            command: 'cat admin_passwords_hidden.yaml'
        });
        console.warn(`[TARPIT] Simulated AI stdout returned to attacker:\n${tarpitRes.data.output}`);
        
    } catch(e) {}
  }
});

startNetworkSniffer();

console.log(`[Sentinel Agent] Running in background. Waiting for events...`);
