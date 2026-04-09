require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logAction } = require('./logger');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing from .env. AI Agent will fail if triggered.");
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-2.5-flash as the latest standard fast model
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Function to compute file hash
const getFileHash = (filePath) => {
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
const calculateEntropy = (filePath) => {
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

const analyzeThreat = async (filePath) => {
  const filename = path.basename(filePath);
  
  const fileHash = getFileHash(filePath);
  const entropy = calculateEntropy(filePath);
  logAction('INFO', `Computed File Hash: ${fileHash} | Entropy: ${entropy}/8.0`, "AI_ENGINE");
  
  let fileContent = "";
  try {
    const stats = fs.statSync(filePath);
    // Only read if it's small to avoid loading giant binaries
    if (stats.size < 1000000) { // < 1MB
       // just read it as text, ignoring garbage characters for the sake of the prompt
       fileContent = fs.readFileSync(filePath, 'utf8').substring(0, 5000); 
    } else {
       fileContent = "[File too large, relying on metadata]";
    }
  } catch (err) {
    fileContent = "[Error reading file]";
  }

  const prompt = `
You are SentinelAI, an elite SOC analyst and endpoint protection agent.
A new file has been created or modified on the user's system. Analyze the file metadata and partial content (if available) to determine if it is a threat.

File Name: ${filename}
SHA-256 Hash: ${fileHash}
Shannon Entropy: ${entropy} (Scale of 0-8. If Entropy is > 7, it heavily implies the executable or document is packed/encrypted malware. If it's a known malicious extension and entropy is high, risk is extreme).

File Content / Metadata Preview:
${fileContent}

Based on this, classify the threat level and determine an action.
Rules for decisions:
- 0 to 30 -> ALLOW (safe)
- 31 to 60 -> WARN (suspicious but not explicitly malicious)
- 61 to 80 -> SANDBOX (needs isolated execution to verify)
- 81 to 100 -> BLOCK (known or highly obvious malware)

Return ONLY a valid JSON object matching this schema:
{
  "riskScore": Number, // 0 to 100
  "classification": String, // Short term for the threat, e.g. "Safe", "Ransomware", "Macro Virus", "Unknown Document"
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
  } catch (error) {
    console.error("[AI] Error calling Gemini API:", error.message);
    logAction('ERROR', 'Gemini API Offline. Engaging offline heuristics.', 'AI_ENGINE');
    // OFFLINE HEURISTICS ENGINE (Activates when API quota is exceeded)
    const dangerousExts = ['.bat', '.vbs', '.exe', '.sh', '.msi', '.ps1'];
    const suspiciousExts = ['.docx', '.pdf', '.docm', '.js'];
    const phishingExts = ['.eml', '.msg', '.url', '.html'];
    const ext = path.extname(filename).toLowerCase();
    
    let baseScore = 15;
    let decision = "ALLOW";
    let classification = "Low Risk (Offline Mode)";
    let reasoning = "API Offline. Safe file extension detected.";

    if (dangerousExts.includes(ext)) {
      baseScore = entropy > 7 ? 99 : 92;
      decision = "BLOCK";
      classification = entropy > 7 ? "Packed Executable (Offline)" : "Suspicious Executable (Offline)";
      reasoning = "API Offline. Strict heuristics engaged for executables/scripts.";
    } else if (suspiciousExts.includes(ext)) {
      baseScore = entropy > 7 ? 85 : 75;
      decision = "SANDBOX";
      classification = "Suspicious Document (Offline Mode)";
      reasoning = "API Offline. Format may carry malicious macros.";
    } else if (phishingExts.includes(ext)) {
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

const analyzeEmail = async (filePath) => {
  const filename = path.basename(filePath);
  const fileHash = getFileHash(filePath);

  let fileContent = "";
  try {
    const stats = fs.statSync(filePath);
    if (stats.size < 1000000) { 
       fileContent = fs.readFileSync(filePath, 'utf8').substring(0, 5000); 
    } else {
       fileContent = "[File too large, relying on metadata]";
    }
  } catch (err) {
    fileContent = "[Error reading file]";
  }

  const prompt = `
You are SentinelAI, an elite SOC phishing analyst.
Analyze the following email content, HTML string, or Website URL shortcut to determine if it is a phishing attempt, spam, or malicious communication.

File Name: ${filename}
SHA256 Hash: ${fileHash}

Content (Email or URL data):
${fileContent}

Based on this, classify the threat level and determine an action.
Rules for decisions:
- 0 to 30 -> ALLOW (legitimate email)
- 31 to 60 -> WARN (spam or suspicious sender)
- 61 to 80 -> SANDBOX (contains suspicious links or attachments)
- 81 to 100 -> BLOCK (known phishing, credential harvesting, or malware delivery)

Return ONLY a valid JSON object matching this schema:
{
  "riskScore": Number, // 0 to 100
  "classification": String, // Short term, e.g. "Safe", "Spear Phishing", "Spam", "Credential Harvester"
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
  } catch (error) {
    console.error("[AI] Error calling Gemini API:", error.message);
    const ext = path.extname(filename).toLowerCase();
    const phishingExts = ['.eml', '.msg', '.url', '.html'];
    
    if (phishingExts.includes(ext)) {
      return {
        riskScore: 85,
        classification: "Malicious Website Link / Phishing (Offline Mode)",
        decision: "SANDBOX",
        reasoning: "API Offline. Untrusted hyperlink or email file intercepted."
      };
    } else {
      return {
        riskScore: 15,
        classification: "Low Risk (Offline Mode)",
        decision: "ALLOW",
        reasoning: "API Offline. Safe file extension detected by heuristic engine."
      };
    }
  }
};

module.exports = {
  analyzeThreat,
  analyzeEmail
};
