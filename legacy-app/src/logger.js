const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'data', 'audit.log');

const initLogger = () => {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
};

const logAction = (level, message, source = "SYSTEM") => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] [${source}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logLine);
  
  // Terminal aesthetics
  if (level === 'ERROR') {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  } else if (level === 'WARN') {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
  } else if (level === 'ALERT') {
    console.log(`\x1b[1;31m[🚨 ALERT]\x1b[0m ${message}`);
  } else {
    // Normal white or green depending on if it's safe
    console.log(`\x1b[32m[INFO]\x1b[0m ${message}`);
  }
};

module.exports = {
  initLogger,
  logAction
};
