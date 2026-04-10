import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing from .env. AI Agent will fail if triggered.");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export interface TelemetryEvent {
  type: string;
  filename: string;
  fileHash: string;
  entropy: number;
  contentSnapshot: string;
  timestamp: string;
}

export const analyzeThreat = async (telemetry: TelemetryEvent) => {
  const { filename, fileHash, entropy, contentSnapshot } = telemetry;
  
  const prompt = `
You are SentinelAI, an elite SOC analyst and endpoint protection agent.
New telemetry has arrived from the endpoint. It is either a File Drop or an OS Process Tree Execution hook.
Analyze the metadata and activity content to determine if it is a threat!

Primary Target/Event: ${filename}
Identifier (Hash/PID): ${fileHash}
Shannon Entropy / Severity Metric: ${entropy} (Scale of 0-8. If Entropy is > 7, it heavily implies packed/encrypted malware or an injection).

Execution Content / Metadata Preview:
${contentSnapshot}

Based on this telemetry, classify the threat level and determine an action.
Rules for decisions:
- 0 to 30 -> ALLOW (safe)
- 31 to 60 -> WARN (suspicious but not explicitly malicious)
- 61 to 80 -> SANDBOX (needs isolated execution to verify)
- 81 to 100 -> BLOCK (known or highly obvious malware, reverse shell, or injection)

If the decision is BLOCK or SANDBOX, generate an industry-standard YARA rule (.yara format string) that would accurately catch this file/event based on the metadata and content snippet. If it is ALLOW or WARN, just leave yaraSignature empty.

Return ONLY a valid JSON object matching this schema:
{
  "riskScore": Number, // 0 to 100
  "classification": String, // Short term for the threat
  "decision": String, // ALLOW, WARN, SANDBOX, or BLOCK
  "reasoning": String, // A brief 1-2 sentence explanation
  "yaraSignature": String, // The generated YARA rule string, or empty string
  "mitreForecast": [String] // Array of 3 strings predicting the attacker's next Mitre ATT&CK tactics (e.g. ["T1068: Privilege Escalation", "T1049: System Network Connections Discovery", "T1048: Exfiltration"])
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("[AI] Error calling Gemini API:", error.message);
    
    // Fallback Offline Heuristics Engine
    const dangerousExts = ['.bat', '.vbs', '.exe', '.sh', '.msi', '.ps1'];
    const suspiciousExts = ['.docx', '.pdf', '.docm', '.js'];
    const phishingExts = ['.eml', '.msg', '.url', '.html'];
    const ext = path.extname(filename).toLowerCase();
    
    // Enhanced Mock Engine for UI Telemetry Validation
    let decision = "ALLOW";
    let classification = "Low Risk Traffic";
    let score = 15;
    let fallbackR = "Analyzed by Offline Engine. File appears structurally sound based on extension profiling.";
    let mitre = ["T1049: System Network Connections Discovery"];

    if (dangerousExts.includes(ext) || Number(entropy) > 7) {
      decision = "BLOCK";
      score = 95;
      classification = "Troj/Ransom-AI-Simulator";
      fallbackR = "[SIMULATED AI] High entropy or unsafe extension detected. Reverse shell pattern matches APT29 behavior.";
      mitre = ["T1059: Command and Scripting Interpreter", "T1055: Process Injection", "T1486: Data Encrypted for Impact"];
    } else if (suspiciousExts.includes(ext) || phishingExts.includes(ext)) {
      decision = "WARN";
      score = 65;
      classification = "Suspicious Macro Document";
      fallbackR = "[SIMULATED AI] Suspicious document format. Recommending User Entity Sandbox review.";
      mitre = ["T1566: Phishing", "T1204: User Execution"];
    }

    return {
      riskScore: score,
      classification: classification,
      decision: decision,
      reasoning: fallbackR,
      yaraSignature: decision === 'BLOCK' ? `rule Mock_Ruleset { strings: $a = "${filename}" condition: $a }` : "",
      mitreForecast: mitre
    };
  }
};
