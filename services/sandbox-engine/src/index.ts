import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { detonateFile } from './sandbox';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'sandbox-engine' });
});

app.post('/api/sandbox/detonate', async (req, res) => {
    try {
        const { filename, fileContentBase64, command } = req.body;
        
        if (!filename && !command) {
            return res.status(400).json({ error: 'Missing filename or command to execute' });
        }

        console.log(`[Sandbox] Initiating detonation sequence for: ${filename || 'Command snippet'}`);
        
        const report = await detonateFile({ filename, fileContentBase64, command });
        
        res.json({ success: true, report });
    } catch (error: any) {
        console.error(`[Sandbox Error] ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`[🚀 SentinelAI] Sandbox Engine running on port ${PORT}`);
    console.log(`[Docker API] Connecting to local Docker daemon for container isolation...`);
});
