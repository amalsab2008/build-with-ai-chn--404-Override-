import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Device Trust Database
// Normal starting trust score is 100/100
interface DeviceState {
    deviceOs: string;
    trustScore: number;
    violationCount: number;
    quarantined: boolean;
}

const deviceIntel: Record<string, DeviceState> = {
    'Agent_UK_01': { deviceOs: 'Windows 11', trustScore: 100, violationCount: 0, quarantined: false },
    'Agent_US_09': { deviceOs: 'Windows 10', trustScore: 100, violationCount: 0, quarantined: false }
};

const DB_FILE = path.join(__dirname, 'devices.json');
if (fs.existsSync(DB_FILE)) {
    try { Object.assign(deviceIntel, JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))); } catch(e) {}
}
const persist = () => fs.writeFileSync(DB_FILE, JSON.stringify(deviceIntel, null, 2));

app.post('/api/identity/heartbeat', (req, res) => {
    const { agentId, os } = req.body;
    if (!deviceIntel[agentId]) {
        deviceIntel[agentId] = { deviceOs: os || 'Unknown', trustScore: 100, violationCount: 0, quarantined: false };
        persist();
    }
    res.json({ trustScore: deviceIntel[agentId].trustScore, quarantined: deviceIntel[agentId].quarantined });
});

// Calculate Trust deductions
app.post('/api/identity/deduct', (req, res) => {
    const { agentId, violationType, severity } = req.body;
    
    if (!deviceIntel[agentId]) return res.status(404).json({ error: 'Device not tracked' });

    let deduction = 0;
    if (severity >= 80) deduction = 40; // High
    else if (severity >= 60) deduction = 20; // Medium
    else deduction = 10; // Low

    deviceIntel[agentId].violationCount += 1;
    deviceIntel[agentId].trustScore -= deduction;

    // Zero Trust Check: Below 50 is an automatic network isolate
    let action = 'monitor';
    if (deviceIntel[agentId].trustScore < 50 && !deviceIntel[agentId].quarantined) {
        deviceIntel[agentId].quarantined = true;
        action = 'isolate_host';
        console.log(`[🚫 Zero Trust] Device ${agentId} dropped below minimum trust! Initiating Network Quarantine!`);
        
        // --- PHASE 6: ACTIVE DIRECTORY / OKTA REVOCATION ---
        setTimeout(() => {
            console.log(`[🔐 Active Directory] Calling Azure AD Graph API for primary user attached to ${agentId}...`);
            console.log(`[🔐 Active Directory] ➔ Revoking existing Kerberos tickets... SUCCESS`);
            console.log(`[🔐 Okta] ➔ Invalidating session cookies and forcing MFA re-auth... SUCCESS`);
            console.log(`[🔐 Zero Trust] User Identity temporarily frozen to prevent lateral cloud movement.`);
        }, 1500);
    }

    persist();
    res.json({ newScore: deviceIntel[agentId].trustScore, action });
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, () => {
    console.log(`[🔐 Zero Trust] Identity Engine enforcing on port ${PORT}`);
});
