# SentinelAI Presentation Script

This document is your master script. The system has been streamlined to use just **ONE** terminal command plus the gorgeous Web Dashboard.

## Setup Your Screen
1. **The System Shell**: Open a command prompt inside your project. Run: `node bin/sentinel.js start`. Your system is now silently armed.
2. **The Command Center**: In that same terminal, run: `node bin/sentinel.js dashboard`. This will launch your Hacker Green Web UI in your browser! Put this window on the Left side of your screen.
3. **The Target**: Open your `Downloads` folder in standard Windows File Explorer on the Right side of your screen.

*(Make sure your PC volume is up to hear the alert chimes!)*

---

### Phase 1: Initiating The System
**Context**: Demonstrate safe file flow.
**Action**: Drop any standard file (like a picture) into `Downloads`.
**Result**: Tell the audience to watch the Web UI. The UI flashes, the counter increments, and a green `ALLOW` pill drops into the threat stream asynchronously.

### Phase 2: The Evasive Malware (Virtual Sandbox Integration)
**Context**: Show how Sentinel handles behavioral analysis.
**Action**: Run command: `copy examples\suspicious_invoice.docx C:\Users\amals\Downloads\`
**Result**: 
1. Watch the dashboard: A glowing yellow `SANDBOX` pill populates. 
2. Point out that the file vanished from `Downloads`: It was automatically routed to the VirtualBox Quarantine directory!

### Phase 3: The Phishing URL Attack
**Context**: Show dynamic content parsing.
**Action**: Run command: `copy examples\phishing_link.url C:\Users\amals\Downloads\`
**Result**: The Dashboard UI will natively tag it as a `Malicious Website Link`. Simultaneously, a native Windows OS desktop alert will slide out of your taskbar!

### Phase 4: The Lethal "Zero-Day"
**Context**: The Grand Finale. Immediate system protection.
**Action**: Run command: `copy examples\fake_malware.bat C:\Users\amals\Downloads\`
**Result**: The malware is scored **>90% Critical**. Sentinel aggressively bypasses the sandbox phase and completely erases the file from existence. The Dashboard screams with a Red `BLOCK` event.

---

### Cleanup Command
When your presentation is over, simply run:
```bash
node bin/sentinel.js stop
```
