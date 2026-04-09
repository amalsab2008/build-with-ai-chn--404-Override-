const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { startDaemon, stopDaemon, statusDaemon } = require('./daemon');
const SentinelAgent = require('./agent');
const { analyzeThreat, analyzeEmail } = require('./ai');
const { runSandbox } = require('./sandbox');
const db = require('./db');
require('dotenv').config();

const program = new Command();

program
  .name('sentinel')
  .description('SentinelAI - Real-time AI Cybersecurity Agent')
  .version('1.0.0');

// Background Daemon Commands
program
  .command('start')
  .description('Start the SentinelAI background agent')
  .action(() => {
    startDaemon();
  });

program
  .command('stop')
  .description('Stop the SentinelAI background agent')
  .action(() => {
    stopDaemon();
  });

program
  .command('status')
  .description('Check the status of the Sentinel agent and memory')
  .action(() => {
    statusDaemon();
    
    // Show DB summary
    try {
      const history = db.getHistory();
      console.log(`[DATABASE] Total scanned events in history: ${history.length}`);
      if (history.length > 0) {
        const last = history[history.length - 1];
        console.log(`[DATABASE] Last scan: ${last.filename} (Score: ${last.result.riskScore}) [${last.result.decision}]`);
      }
    } catch(e) {
      // Ignored if DB hasn't been created yet
    }
  });

program
  .command('dashboard')
  .description('Launch the SentinelAI Web UI Dashboard')
  .action(() => {
    try {
      const { startDashboard } = require('./dashboard');
      startDashboard();
    } catch(err) {
      console.error(err);
      console.log("[ERROR] The Dashboard modules aren't installed correctly. Run 'npm install express open' manually first.");
    }
  });

// Manual Actions
program
  .command('scan-file <file>')
  .description('Manually scan a specific file using the AI engine')
  .action(async (file) => {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: File not found -> ${fullPath}`);
      return;
    }
    
    console.log(`[MANUAL SCAN] Analyzing ${path.basename(fullPath)}...`);
    const result = await analyzeThreat(fullPath);
    
    console.log(`\n+---[ AI ANALYSIS RESULTS ]---+`);
    console.log(`| File:           ${path.basename(fullPath)}`);
    console.log(`| Classification: ${result.classification}`);
    console.log(`| Risk Score:     ${result.riskScore}%`);
    console.log(`| Decision:       ${result.decision}`);
    console.log(`| Reasoning:      ${result.reasoning}`);
    console.log(`+-----------------------------+\n`);
  });

program
  .command('scan-email <file>')
  .description('Manually scan an email file (phishing detection) using the AI engine')
  .action(async (file) => {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) {
      console.error(`Error: File not found -> ${fullPath}`);
      return;
    }
    
    console.log(`[MANUAL SCAN] Analyzing Email ${path.basename(fullPath)}...`);
    const result = await analyzeEmail(fullPath);
    
    console.log(`\n+---[ AI PHISHING RESULTS ]---+`);
    console.log(`| Email:          ${path.basename(fullPath)}`);
    console.log(`| Classification: ${result.classification}`);
    console.log(`| Risk Score:     ${result.riskScore}%`);
    console.log(`| Decision:       ${result.decision}`);
    console.log(`| Reasoning:      ${result.reasoning}`);
    console.log(`+-----------------------------+\n`);
  });

program
  .command('open-safe <file>')
  .description('Execute a potentially dangerous file in the mock sandbox')
  .action(async (file) => {
    const fullPath = path.resolve(process.cwd(), file);
    // Even if it doesn't exist, we can simulate for demonstration purposes if needed,
    // but better to check if it exists in the monitor folder.
    
    let pathToUse = fullPath;
    if (!fs.existsSync(fullPath)) {
      // check if they meant a file in monitor/
      const monitorPath = path.join(__dirname, '..', 'monitor', file);
      if (fs.existsSync(monitorPath)) {
        pathToUse = monitorPath;
      } else {
        console.error(`Error: File not found -> ${fullPath}`);
        return;
      }
    }

    const report = await runSandbox(pathToUse);
    console.log(`\n=== SANDBOX FORENSIC REPORT ===`);
    console.log(`Target: ${path.basename(pathToUse)}`);
    console.log(`Status: ${report.status}`);
    console.log(`Events Detected:`);
    report.logs.forEach(log => console.log(`  ${log}`));
    console.log(`===============================\n`);
  });

// Hidden command used by the daemon
program
  .command('_run_agent', { hidden: true })
  .action(() => {
    const os = require('os');
    const defaultDownloads = path.join(os.homedir(), 'Downloads');
    const watchDir = process.env.WATCH_DIR || defaultDownloads;
    
    const agent = new SentinelAgent(watchDir);
    agent.start();
    
    // Keep process alive
    process.on('SIGINT', () => agent.stop());
    process.on('SIGTERM', () => agent.stop());
  });

program.parse(process.argv);
