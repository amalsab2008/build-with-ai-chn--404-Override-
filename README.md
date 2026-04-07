# SentinelAI 🛡️

## Problem Statement
Modern cyber threats, such as polymorphic malware and zero-day phishing attacks, evolve faster than traditional signature-based antivirus software can update. Security Operations Center (SOC) analysts are often overwhelmed with alerts, while standard endpoint users remain vulnerable to evasive macro-documents and disguised URL shortcuts that easily bypass static security checkpoints.

## Project Description
SentinelAI is a real-time, AI-powered Endpoint Detection and Response (EDR) native agent. Operating completely in the background via Node.js file streams, it autonomously guards critical system directories (like `Downloads`). The moment a file drops onto the machine, SentinelAI intercepts it, parses its raw hex/text buffers, and routes it to an onboard AI decision engine. 

Based on dynamic AI heuristics, the system autonomously executes mitigation protocols:
- **0-49% (Safe):** File is permitted seamlessly.
- **50-90% (Sandbox Threshold):** The file is neutralized extension-wise and physically routed into a VirtualBox Shared Dropzone (`vbox_share`) for safe isolation, while a mock-sandbox behavioral replay is logged in the terminal.
- **91-100% (Critical):** The agent bypasses quarantine and permanently hard-deletes (`fs.unlinkSync`) the zero-day malware before the user can accidentally double-click it.

The entire architecture is visually tracked via a sleek, local Express.js **Premium Web Dashboard** that streams intercepted threats, scoring metrics, and AI classifications asynchronously.

## Google AI Usage
### Tools / Models Used
* Google Generative AI SDK (`@google/generative-ai`)
* Model: `gemini-2.5-flash`

### How Google AI Was Used
Google Gemini serves as the core "Brain" of the EDR tool. Instead of relying on rigid string matching, Sentinel extracts the raw contents of unknown executables, PowerShell scripts, `.url` web shortcuts, and `.eml` phishing architectures and feeds them directly into custom system prompts. 

Gemini acts as an elite SOC Analyst. It performs few-shot reasoning to determine the malicious intent of obscured scripts or social-engineering language, returning a cleanly structured JSON response containing:
1. `riskScore` (0-100)
2. `classification` (e.g., "Credential Harvesting Email" or "Evasive PowerShell Script")
3. `decision` (ALLOW, WARN, SANDBOX, BLOCK)
4. `reasoning` (Contextual explanations for the user)

If the API limit is reached, Sentinel elegantly falls back on a native "Offline Heuristics Engine" to confidently assign scores without breaking operations.

## Proof of Google AI Usage
*(Please review the `/proof` folder in the repository for logs showing live Gemini JSON responses.)*

## Screenshots
*(Insert your own image links here)*
* [Screenshot 1: The Hacker Green Real-Time Threat Stream Dashboard]
* [Screenshot 2: Windows Native Desktop UI Popup Alerting a Blocked Phishing URL]
* [Screenshot 3: Terminal View showing Sandbox Execution and File Deletion]

## Demo Video
[Watch Demo Here](https://drive.google.com/your-shareable-link)

## Installation Steps
```bash
# Clone the repository
git clone <your-repo-link>

# Go to project folder
cd SentinelAI

# Install dependencies
npm install

# Configure Google Gemini
# Create a .env file and add your key: GEMINI_API_KEY=your_key_here

# Run the Background Endpoint Agent
node bin/sentinel.js start

# Launch the Web Command Center
node bin/sentinel.js dashboard
```
