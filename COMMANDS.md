# 💻 SentinelAI Command Cheat Sheet

This is a quick-reference list of every command available in the SentinelAI Enterprise ecosystem. All commands should be run from the root directory (`C:\Users\amals\Downloads\secure`).

## 🌐 Global Orchestration
These commands start multiple backend microservices at once.

| Command | Description |
|---|---|
| `npm run deploy:local` | 🚀 **Start the Cloud Backends.** Boots the API Gateway, Sandbox Engine, Threat Intel Engine, and Identity Engine concurrently in the terminal. (Press `Ctrl+C` to stop). |
| `npm run deploy:cloud` | 🐳 **Start via Docker.** Packages the 4 cloud backend microservices into containers and runs them on an isolated Docker bridge network. |

## 🖥️ Client Applications
These commands start the front-end user interfaces or user-land endpoint hooks.

| Command | Description |
|---|---|
| `npm run start:dashboard` | 📊 **Start the SOC Dashboard.** Boots the Next.js UI on `http://localhost:3000`. Use this to view the live Interactive Attack Chains and AI SOC Assistant. |
| `npm run start:agent` | 🛡️ **Start the Endpoint Defender.** Boots the local daemon that injects Honeypots, monitors the file system, scans memory, and executes automated SOAR recovery playbooks. |

## ⚙️ Individual Microservices (Advanced Debugging)
If you need to test or debug a single isolated module without deploying the full network, you can run them individually:

| Command | Description |
|---|---|
| `npm run start:gateway` | Starts *only* the API Gateway (Port 4000) orchestrating AI intelligence. |
| `npm run start:sandbox` | Starts *only* the Docker Detonation sandbox (Port 4001). |
| `npm run start:intel` | Starts *only* the Global Hash Threat Registry (Port 4002). |
| `npm run start:identity`| Starts *only* the Zero Trust Endpoint trust monitor (Port 4003). |

> **Note:** If you see an `EADDRINUSE` error (like `address: '::', port: 4000`), it means the command is already running in another terminal window blocking the port. Close the other processes first!
