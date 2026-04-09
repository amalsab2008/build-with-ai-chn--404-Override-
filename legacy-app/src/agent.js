const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { analyzeThreat, analyzeEmail } = require('./ai');
const { saveScanResult } = require('./db');
const { showNotification } = require('./notifier');
const { logAction, initLogger } = require('./logger');

class SentinelAgent {
  constructor(watchDir) {
    this.watchDir = watchDir;
    this.watcher = null;
    this.isRunning = false;
    initLogger(); // Initialize the audit logger
  }

  start() {
    if (this.isRunning) return;
    
    console.log(`\n===========================================`);
    console.log(`🛡️  SentinelAI Background Agent Online 🛡️`);
    console.log(`===========================================`);
    logAction('ALERT', `Monitoring directory: ${this.watchDir}`, 'AGENT');

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
    
    this.isRunning = true;
  }

  async handleNewFile(filePath) {
    const filename = path.basename(filePath);
    logAction('ALERT', `New file intercepted: ${filename}`, 'AGENT');
    
    let result;
    try {
      if (filename.toLowerCase().endsWith('.eml') || filename.toLowerCase().endsWith('.msg') || filename.toLowerCase().endsWith('.url') || filename.toLowerCase().endsWith('.html')) {
        logAction('INFO', `Dispatching to Phishing & URL Analyst Agent...`, 'AI_ROUTER');
        result = await analyzeEmail(filePath);
      } else {
        logAction('INFO', `Dispatching to File Analyzer Agent...`, 'AI_ROUTER');
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
      logAction('ERROR', `Failed to process file ${filename}: ${err.message}`, 'AGENT');
    }
  }

  async executeDecision(filePath, result) {
    const decision = result.decision;
    const score = result.riskScore;
    
    // Trigger OS Popup
    try {
       showNotification(path.basename(filePath), result);
    } catch(e) {}

    if (score >= 50 && score <= 90) {
      logAction('WARN', `Risk score ${score}% is within Sandbox Threshold (50-90). Automatically executing Sandbox...`, 'MITIGATION');
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
        logAction('ALERT', `FILE SECURED. Moved to VirtualBox Dropzone: ${destPath}`, 'MITIGATION');
      } catch(e) {
        logAction('ERROR', `Could not move file to VirtualBox Shared Folder. Error: ${e.message}`, 'MITIGATION');
      }
    } else if (score > 90) {
      // Instant hard delete for absolute highest risk
      logAction('ALERT', `Risk score ${score}% is CRITICAL. Bypassing sandbox for immediate hard deletion.`, 'MITIGATION');
      try {
        fs.unlinkSync(filePath);
        logAction('ALERT', `FILE TERMINATED. Malicious file permanently removed from system.`, 'MITIGATION');
      } catch(e) {
        logAction('ERROR', `Could not delete file. Error: ${e.message}`, 'MITIGATION');
      }
    } else {
      logAction('INFO', `File marked as low risk (${score}%). Allowed.`, 'MITIGATION');
    }
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
    }
    this.isRunning = false;
    logAction('INFO', `SentinelAI Agent Offline.`, 'AGENT');
  }
}

module.exports = SentinelAgent;
