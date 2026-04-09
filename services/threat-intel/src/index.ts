import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Global Threat Graph
// In production, this syncs with Firestore or Elasticsearch
const globalThreatData: Record<string, any> = {
   // Pre-seed with mock known malware hashes
   'e1112134b6dcc8be25d808e03e4d9426': { type: 'Ransomware', severity: 99, reason: 'Known LockBit Hash' },
   '5e884898da28047151d0e56f8dc62927': { type: 'Trojan', severity: 95, reason: 'Emotet Payload' }
};

const DB_FILE = path.join(__dirname, 'threats.json');

// Attempt to load historic data
if (fs.existsSync(DB_FILE)) {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf-8');
        Object.assign(globalThreatData, JSON.parse(data));
    } catch(e) {}
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', size: Object.keys(globalThreatData).length });
});

// Lookup endpoint: Agents hit this FIRST before invoking Gemini AI
app.post('/api/intel/lookup', (req, res) => {
    const { hash, url } = req.body;
    
    // Hash based lookup
    if (hash && globalThreatData[hash]) {
        return res.json({ found: true, threat: globalThreatData[hash] });
    }
    
    // Exact URL based lookup
    if (url && globalThreatData[url]) {
        return res.json({ found: true, threat: globalThreatData[url] });
    }

    res.json({ found: false });
});

// Reporting endpoint: API Gateway pushes new verified threats here
app.post('/api/intel/report', (req, res) => {
    const { hash, url, classification, severity, reason } = req.body;
    
    if (!hash && !url) {
        return res.status(400).json({ error: 'Must provide hash or url' });
    }
    
    const key = hash || url;
    
    // If it's new, we append to the global graph
    if (!globalThreatData[key] && severity >= 60) {
        console.log(`[Intel Graph] New threat synchronized globally: ${key}`);
        globalThreatData[key] = { type: classification, severity, reason };
        
        // Persist to disk (Simulated DB)
        fs.writeFileSync(DB_FILE, JSON.stringify(globalThreatData, null, 2));
    }
    
    res.json({ success: true, totalIntel: Object.keys(globalThreatData).length });
});

const PORT = process.env.PORT || 4002;
app.listen(PORT, () => {
    console.log(`[☁️ SentinelAI] Intel Graph serving on port ${PORT}`);
});
