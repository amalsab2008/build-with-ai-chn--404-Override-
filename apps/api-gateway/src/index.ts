import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { analyzeThreat, TelemetryEvent } from './ai';

import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // src -> api-gateway -> apps -> root
const app = express();
const port = process.env.PORT || 4000;

// Create HTTP Server & attach Socket.io
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Entrypoint for Gateway
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SentinelAI Gateway' });
});

app.post('/api/telemetry', async (req, res) => {
  const telemetryData: TelemetryEvent = req.body;
  const agentId = req.body.agentId || 'Agent_LCL_01'; // Defaulting for MVP
  console.log(`[REST] Intercepted Telemetry payload for: ${telemetryData.filename}`);
  
  try {
    // 1. FAST PATH: Check Cloud Threat Intel Engine (Zero-Day lookup)
    let aiDecision: any = null;
    let sandboxReport: any = null;

    try {
        const intelRes = await fetch('http://localhost:4002/api/intel/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash: telemetryData.fileHash, url: telemetryData.filename })
        });
        const intelData = await intelRes.json();
        
        if (intelData.found) {
            console.log(`[Intel Match] Global Threat Known: ${intelData.threat.type}`);
            aiDecision = {
                decision: intelData.threat.severity >= 80 ? 'BLOCK' : 'WARN',
                riskScore: intelData.threat.severity,
                reasoning: `Matched Global Threat Intel: ${intelData.threat.reason}`,
                classification: intelData.threat.type
            };
        }
    } catch (e) {
        console.warn("[Intel Error] Threat Intel Engine unreachable.");
    }

    // 2. DEEP PATH: If not in Threat Intel DB, use Gemini AI
    if (!aiDecision) {
        aiDecision = await analyzeThreat(telemetryData);
        console.log(`[AI Verdict] ${aiDecision.decision} | Score: ${aiDecision.riskScore}`);

        // If it's a NEW threat (BLOCK), report it back to the Intel Engine to protect others!
        if (aiDecision.decision === 'BLOCK') {
             fetch('http://localhost:4002/api/intel/report', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     hash: telemetryData.fileHash,
                     classification: aiDecision.classification,
                     severity: aiDecision.riskScore,
                     reason: aiDecision.reasoning
                 })
             }).catch(() => {}); // silent fail
        }
    }
    
    // Feature: Advanced Sandbox Engine Integration
    if (aiDecision.decision === 'SANDBOX') {
        console.log(`[Integration] Routing telemetry to Advanced Sandbox Engine for static/dynamic detonation...`);
        try {
            const sandboxRes = await fetch('http://localhost:4001/api/sandbox/detonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: telemetryData.filename,
                    command: `echo "Dynamic analysis of ${telemetryData.filename}"` // Simulated payload
                })
            });
            
            if (sandboxRes.ok) {
                 const data = await sandboxRes.json();
                 sandboxReport = data.report;
                 console.log(`[Sandbox] Execution resolved. Status: ${sandboxReport.status}`);
                 
                 if (sandboxReport.status === 'timeout' || sandboxReport.outputLogs?.includes('malicious')) {
                      aiDecision.decision = 'BLOCK';
                      aiDecision.reasoning += ' (Verified by Sandbox Detonation)';
                 }
            } else {
                 console.warn(`[Sandbox] Engine unreachable or failed execution.`);
            }
        } catch (err) {
             console.warn(`[Sandbox Error] Could not connect to container isolation service.`);
        }
    }

    // 3. ZERO TRUST: Enforce Identity Engine Penalties
    let isolateCommandTriggered = false;
    let newScore = 100;
    if (aiDecision.decision !== 'ALLOW') {
         try {
             const identityRes = await fetch('http://localhost:4003/api/identity/deduct', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                     agentId: agentId,
                     violationType: aiDecision.decision,
                     severity: aiDecision.riskScore
                 })
             });
             const idData = await identityRes.json();
             newScore = idData.newScore;
             if (idData.action === 'isolate_host') {
                 isolateCommandTriggered = true;
                 console.log(`[ZERO TRUST] Host ${agentId} isolated from network!`);
             }
         } catch (e) {
             console.warn("[Zero Trust] Identity engine unreachable.");
         }
    }
    
    // Broadcast the event to the Enterprise Socket Dashboards
    io.emit('new_threat_event', {
      telemetry: telemetryData,
      verdict: aiDecision,
      sandbox: sandboxReport,
      agentId: agentId,
      trustScore: newScore,
      isolated: isolateCommandTriggered
    });

    if (isolateCommandTriggered) {
        // Broadcast a global socket event that endpoints listen to
        io.emit('network_isolate', { agentId });
    }
    
    // Return action to the Endpoint Agent
    res.status(200).json({ 
      status: 'analyzed',
      verdict: aiDecision,
      sandboxReport,
      isolateCommandTriggered
    });
  } catch(e) {
    res.status(500).json({ error: 'AI Processing Failed' });
  }
});

// --- PHASE 9: DATA EXFILTRATION & TARPIT -------------------
app.post('/api/canary-ping', (req, res) => {
    const { token, sourceIp } = req.body;
    console.log(`\n[🚨 DATA EXFILTRATION] CANARY TOKEN COMPROMISED!`);
    console.log(`[🚨 DATA EXFILTRATION] Threat Actor at IP ${sourceIp || 'Unknown'} attempted to authenticate via fake AWS token: ${token}`);
    
    // Broadcast immediate critical alarm to Dashboard
    io.emit('new_threat_event', {
       telemetry: { filename: `AWS Token Steal [${sourceIp}]`, fileHash: token, entropy: 0, timestamp: new Date().toISOString() },
       verdict: { decision: 'BLOCK', riskScore: 100, reasoning: "CRITICAL: Honeypot AWS Credential Used on Public Internet. Data Exfiltration Confirmed." },
       sandbox: null,
       agentId: 'CLOUD_SENSOR_01',
       yaraSignature: "rule Exfil_Token_Detect { strings: $aws = \"AKIAIOSFODNN7EXAMPLE\" condition: $aws }"
    });
    
    res.json({ success: false, error: 'InvalidAccessKeyId' }); // Fake response back to the hacker
});

app.post('/api/tarpit', async (req, res) => {
    const { command } = req.body;
    console.log(`[🕷️ TARPIT ENGAGED] Hacker executed: ${command}`);
    
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        
        const prompt = `You are an AI Tarpit simulating a vulnerable Linux server. The human hacker just typed this bash command into the SSH shell: "${command}". 
        Generate a fake, plausible terminal output to trick them into thinking they are exploring a real system. Provide 2-5 lines of text output. Do NOT break character.`;
        
        const result = await model.generateContent(prompt);
        res.json({ output: result.response.text() });
    } catch(e) {
        res.json({ output: "command not found: " + command });
    }
});
// -------------------------------------------------------------

app.post('/api/chat', async (req, res) => {
  const { message, incidentContext } = req.body;
  try {
     const { GoogleGenerativeAI } = require('@google/generative-ai');
     const apiKey = process.env.GEMINI_API_KEY || '';
     const genAI = new GoogleGenerativeAI(apiKey);
     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
     
     const prompt = `You are the SentinelAI SOC Assistant. You are embedded in an Enterprise Dashboard.
The user just sent this message: "${message}"

Recent Incident Context:
${incidentContext ? JSON.stringify(incidentContext) : 'No recent incidents.'}

Provide a concise, helpful, and professional response helping the SOC analyst investigate or understand the threats from the perspective of an elite AI agent. Limit response to 3 sentences maximum.

CRITICAL INSTRUCTION FOR TOOL CALLING:
If the user asks you to "isolate the host", "kill the threat", "initiate a lockdown", "trigger soar", "recover files" or take some mechanical kinetic action against the machine referenced in the incident context, you MUST invoke a tool call.
Instead of answering normally, return a valid JSON object matching this schema:
{
  "reply": "I have initiated the SOAR playbook to [isolate the host/clean the threat]...",
  "action": "SOAR",
  "command": "[KILL_AND_CLEAN OR VSS_RESTORE]",
  "targetAgent": "[Extract from Context]"
}

If no action is required, just return a JSON object with your text:
{
  "reply": "Your message here..."
}
`;

     const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
     });
     
     const responseObj = JSON.parse(result.response.text());
     
     if (responseObj.action === "SOAR" && responseObj.targetAgent) {
         console.log(`[🤖 AI MASTER CONTROL] Autonomously dispatching SOAR: ${responseObj.command} to ${responseObj.targetAgent}`);
         io.emit('soar_playbook', { agentId: responseObj.targetAgent, playbook: responseObj.command });
     }
     
     res.json({ reply: responseObj.reply });
  } catch (err: any) {
     console.error("[SOC Chat Error]", err.message);
     res.status(500).json({ reply: "I am currently offline or disconnected from the AI core." });
  }
});

app.post('/api/web-threat', async (req, res) => {
  const telemetryData = req.body; // e.g. { url, domain, type: 'WEB_NAVIGATION', ... }
  console.log(`[REST] Intercepted Web Telemetry payload: ${telemetryData.url}`);
  
  try {
     const { GoogleGenerativeAI } = require('@google/generative-ai');
     const apiKey = process.env.GEMINI_API_KEY || '';
     const genAI = new GoogleGenerativeAI(apiKey);
     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
     
     const prompt = `You are SentinelAI, an elite SOC analyst evaluating web requests for a Zero Trust network.
A web request was just intercepted by our browser extension:
URL: ${telemetryData.url}
Domain: ${telemetryData.domain || telemetryData.filename || 'Unknown'}
Type: ${telemetryData.type}

Analyze this. Is it a known phishing pattern, suspicious TLD, potentially dangerous download (like .scr, .iso, .vbs), or generally safe?
Return ONLY a valid JSON object matching this schema:
{
  "decision": String, // ALLOW, WARN, or BLOCK
  "riskScore": Number, // 0 to 100
  "reasoning": String // 1 sentence explanation
}`;

     const result = await model.generateContent({
       contents: [{ role: 'user', parts: [{ text: prompt }] }],
       generationConfig: { responseMimeType: "application/json" }
     });

     const aiDecision = JSON.parse(result.response.text());
     console.log(`[AI Web Verdict] ${aiDecision.decision} | Score: ${aiDecision.riskScore}`);

     // Broadcast threat event to SOC Dashboard if it's a block or warn
     if (aiDecision.decision !== 'ALLOW') {
         io.emit('new_threat_event', {
           telemetry: {
              filename: telemetryData.url, 
              fileHash: 'WEB-INTERCEPT', 
              entropy: 0, 
              timestamp: telemetryData.timestamp
           },
           verdict: aiDecision,
           sandbox: null,
           agentId: telemetryData.agentId || 'Browser_Ext'
         });
     }

     res.status(200).json({ verdict: aiDecision });
  } catch (err: any) {
     console.error("[Web Threat Evaluator Error]", err.message);
     // Fail open for standard browsing if AI fails to respond
     res.status(200).json({ verdict: { decision: 'ALLOW', riskScore: 0, reasoning: 'AI Offline Fallback to Allow' }});
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Dashboard client connected: ${socket.id}`);
  
  socket.on('dispatch_soar', (data) => {
      console.log(`[SOAR Dashboard] Analyst initiated manual playbook: ${data.playbook} on Agent: ${data.agentId}`);
      io.emit('soar_playbook', { agentId: data.agentId, playbook: data.playbook });
  });

  socket.on('simulate_attack', (data) => {
      console.log(`[RED TEAM] Dispensing payload simulation: ${data.file}`);
      io.emit('new_threat_event', {
          telemetry: {
              filename: data.file,
              fileHash: data.hash,
              entropy: Math.random() * 8,
              timestamp: new Date().toISOString()
          },
          verdict: {
              decision: 'BLOCK',
              riskScore: Math.floor(Math.random() * 20) + 80,
              reasoning: 'Red Team AI Autonomous Emulation Protocol Triggered',
              yaraSignature: 'rule RedTeam_Test { condition: true }',
              mitreForecast: ['T1059: Command and Scripting Interpreter', 'T1055: Process Injection', 'T1071: Standard Application Layer Protocol']
          },
          sandbox: null,
          agentId: ['Agent_LCL_01', 'UK-04', 'K8S-01'][Math.floor(Math.random() * 3)]
      });
  });

  socket.on('disconnect', () => {
     console.log(`[Socket] Dashboard client disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`[Cloud Gateway] HTTP & WebSocket Servers Listening on port ${port}`);
});
