"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeThreat = void 0;
const generative_ai_1 = require("@google/generative-ai");
const path_1 = __importDefault(require("path"));
const apiKey = process.env.GEMINI_API_KEY || '';
if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is missing from .env. AI Agent will fail if triggered.");
}
const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const analyzeThreat = async (telemetry) => {
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

Return ONLY a valid JSON object matching this schema:
{
  "riskScore": Number, // 0 to 100
  "classification": String, // Short term for the threat
  "decision": String, // ALLOW, WARN, SANDBOX, or BLOCK
  "reasoning": String // A brief 1-2 sentence explanation
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
    }
    catch (error) {
        console.error("[AI] Error calling Gemini API:", error.message);
        // Fallback Offline Heuristics Engine
        const dangerousExts = ['.bat', '.vbs', '.exe', '.sh', '.msi', '.ps1'];
        const suspiciousExts = ['.docx', '.pdf', '.docm', '.js'];
        const phishingExts = ['.eml', '.msg', '.url', '.html'];
        const ext = path_1.default.extname(filename).toLowerCase();
        let baseScore = 15;
        let decision = "ALLOW";
        let classification = "Low Risk (Offline Mode)";
        let reasoning = "API Offline. Safe file extension detected.";
        if (dangerousExts.includes(ext)) {
            baseScore = Number(entropy) > 7 ? 99 : 92;
            decision = "BLOCK";
            classification = Number(entropy) > 7 ? "Packed Executable (Offline)" : "Suspicious Executable (Offline)";
            reasoning = "API Offline. Strict heuristics engaged for executables/scripts.";
        }
        else if (suspiciousExts.includes(ext)) {
            baseScore = Number(entropy) > 7 ? 85 : 75;
            decision = "SANDBOX";
            classification = "Suspicious Document (Offline Mode)";
            reasoning = "API Offline. Format may carry malicious macros.";
        }
        else if (phishingExts.includes(ext)) {
            baseScore = 85;
            decision = "SANDBOX";
            classification = "Malicious Link / Phishing (Offline Mode)";
            reasoning = "Untrusted hyperlink or email file intercepted.";
        }
        return {
            riskScore: baseScore,
            classification: classification,
            decision: decision,
            reasoning: reasoning
        };
    }
};
exports.analyzeThreat = analyzeThreat;
