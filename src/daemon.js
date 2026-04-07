const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PID_FILE = path.join(__dirname, '..', 'data', 'sentinel.pid');
const LOG_FILE = path.join(__dirname, '..', 'data', 'sentinel.log');

const startDaemon = () => {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8');
    try {
      process.kill(pid, 0);
      console.log(`[SYSTEM] SentinelAI is already running (PID: ${pid}).`);
      return;
    } catch(e) {
      // Process isn't really running, clean up stale pid file
      fs.unlinkSync(PID_FILE);
    }
  }

  console.log('[SYSTEM] Starting SentinelAI essentially as a background agent...');

  const out = fs.openSync(LOG_FILE, 'a');
  const err = fs.openSync(LOG_FILE, 'a');

  // Spawn the cli with a hidden '_run_agent' command
  const child = spawn('node', [path.join(__dirname, '..', 'bin', 'sentinel.js'), '_run_agent'], {
    detached: true,
    stdio: ['ignore', out, err]
  });

  child.unref();

  fs.writeFileSync(PID_FILE, child.pid.toString());
  console.log(`[SYSTEM] SentinelAI Agent started (PID: ${child.pid}).`);
  console.log(`[SYSTEM] Logs can be viewed at: ${LOG_FILE}`);
};

const stopDaemon = () => {
  if (!fs.existsSync(PID_FILE)) {
    console.log(`[SYSTEM] SentinelAI is not currently running.`);
    return;
  }

  const pid = fs.readFileSync(PID_FILE, 'utf8');
  try {
    process.kill(pid);
    console.log(`[SYSTEM] SentinelAI Agent (PID: ${pid}) stopped.`);
  } catch (err) {
    console.log(`[SYSTEM] Process ${pid} not found. It may have already exited.`);
  }

  fs.unlinkSync(PID_FILE);
};

const statusDaemon = () => {
  if (fs.existsSync(PID_FILE)) {
    const pid = fs.readFileSync(PID_FILE, 'utf8');
    try {
      process.kill(pid, 0);
      console.log(`[STATUS] SentinelAI Agent is ONLINE (PID: ${pid}).`);
    } catch(e) {
      console.log(`[STATUS] SentinelAI Agent is OFFLINE (Stale PID file found).`);
    }
  } else {
    console.log(`[STATUS] SentinelAI Agent is OFFLINE.`);
  }
};

module.exports = { startDaemon, stopDaemon, statusDaemon };
