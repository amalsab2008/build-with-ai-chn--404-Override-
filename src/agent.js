const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { analyzeThreat, analyzeEmail } = require('./ai');
const { saveScanResult } = require('./db');
const { showNotification } = require('./notifier');

class SentinelAgent {
  constructor(watchDir) {
    this.watchDir = watchDir;
    this.watcher = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    console.log(`\n===========================================`);
    console.log(`🛡️  SentinelAI Background Agent Online 🛡️`);
    console.log(`===========================================`);
    console.log(`[SYSTEM] Monitoring directory: ${this.watchDir}\n`);

    if (!fs.existsSync(this.watchDir)) {
      fs.mkdirSync(this.watchDir, { recursive: true });
    }

    this.watcher = chokidar.watch(this.watchDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // ignore existing files on startup
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher.on('add', this.handleNewFile.bind(this));
    // Optionally monitor changes: this.watcher.on('change', this.handleNewFile.bind(this));
    
    this.isRunning = true;
  }

  async handleNewFile(filePath) {
    const filename = path.basename(filePath);
    console.log(`\n[EVENT] New file detected: ${filename}`);
    
    let result;
    try {
      if (filename.toLowerCase().endsWith('.eml') || filename.toLowerCase().endsWith('.msg') || filename.toLowerCase().endsWith('.url') || filename.toLowerCase().endsWith('.html')) {
        console.log(`[AI] Dispatching to Phishing & URL Analyst Agent...`);
        result = await analyzeEmail(filePath);
      } else {
        console.log(`[AI] Dispatching to File Analyzer Agent...`);
        result = await analyzeThreat(filePath);
      }
      
      console.log(`\n+---[ AI ANALYSIS RESULTS ]---+`);
      console.log(`| File:           ${filename}`);
      console.log(`| Classification: ${result.classification}`);
      console.log(`| Risk Score:     ${result.riskScore}%`);
      console.log(`| Decision:       ${result.decision}`);
      console.log(`| Reasoning:      ${result.reasoning}`);
      console.log(`+-----------------------------+\n`);

      saveScanResult(filePath, result);
      
      await this.executeDecision(filePath, result);

    } catch (err) {
      console.error(`[ERROR] Failed to process file ${filename}:`, err);
    }
  }

  async executeDecision(filePath, result) {
    const decision = result.decision;
    const score = result.riskScore;
    
    // Trigger OS Popup
    showNotification(path.basename(filePath), result);

    if (score >= 50 && score <= 90) {
      console.log(`[ACTION] ⚠️ Risk score ${score}% is within Sandbox Threshold (50-90). Automatically executing Sandbox...`);
      const { runSandbox } = require('./sandbox');
      const report = await runSandbox(filePath);
      
      console.log(`\n=== AUTOMATIC SANDBOX REPLAY ===`);
      console.log(`Target: ${path.basename(filePath)}`);
      console.log(`Status: ${report.status}`);
      console.log(`Events Detected:`);
      report.logs.forEach(log => console.log(`  ${log}`));
      console.log(`================================`);

      // Route the file to VirtualBox Shared Folder instead of deleting it
      try {
        const vboxShareDir = path.join(__dirname, '..', 'data', 'vbox_share');
        if (!fs.existsSync(vboxShareDir)) {
          fs.mkdirSync(vboxShareDir, { recursive: true });
        }
        
        const safeName = `${path.basename(filePath)}.vbox_quarantine`;
        const destPath = path.join(vboxShareDir, safeName);
        
        fs.renameSync(filePath, destPath);
        console.log(`[ACTION] 🚨 FILE SECURED. Moved to VirtualBox Dropzone: ${destPath}`);
        console.log(`[ACTION] 💡 Open your Ubuntu VM to inspect this file safely.`);
      } catch(e) {
        console.log(`[ACTION] 🛑 Could not move file to VirtualBox Shared Folder (it may be locked). Error: ${e.message}`);
      }
    } else if (score > 90) {
      // Instant hard delete for absolute highest risk
      console.log(`[ACTION] 🛑 Risk score ${score}% is CRITICAL. Bypassing sandbox for immediate hard deletion.`);
      try {
        fs.unlinkSync(filePath);
        console.log(`[ACTION] 🛑 FILE TERMINATED. Malicious file permanently removed from system.`);
      } catch(e) {
        console.log(`[ACTION] 🛑 Could not delete file (it may be locked). Error: ${e.message}`);
      }
    } else {
      console.log(`[ACTION] ✅ File marked as low risk (${score}%). Allowed.`);
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    this.isRunning = false;
    console.log(`[SYSTEM] SentinelAI Agent Offline.`);
  }
}

module.exports = SentinelAgent;
