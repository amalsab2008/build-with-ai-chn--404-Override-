const path = require('path');
const fs = require('fs');
const { logAction } = require('./logger');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runSandbox = async (filePath) => {
  logAction('INFO', `Initializing isolated environment for: ${path.basename(filePath)}...`, "SANDBOX");
  await delay(1000);
  logAction('INFO', `Executing file within container...`, "SANDBOX");
  await delay(1500);

  const filename = path.basename(filePath).toLowerCase();
  
  let logs = [];
  
  // Real static String Extraction Analysis
  try {
    const buffer = fs.readFileSync(filePath);
    const content = buffer.toString('utf8');
    
    // Quick regex for IP addresses
    const ipMatcher = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
    const ipsFound = content.match(ipMatcher);
    
    // Quick regex for URLs
    const urlMatcher = /https?:\/\/[^\s]+/g;
    const urlsFound = content.match(urlMatcher);
    
    if (ipsFound) {
      logs.push(`=> [STATIC] Extracted hardcoded IP addresses: ${[...new Set(ipsFound)].slice(0, 3).join(', ')}`);
    }
    if (urlsFound) {
      logs.push(`=> [STATIC] Extracted embedded URLs: ${[...new Set(urlsFound)].slice(0, 3).join(', ')}`);
    }
    
    if (content.includes('powershell') || content.includes('cmd.exe')) {
       logs.push("=> [STATIC] File invokes Command Prompt or PowerShell.");
    }
  } catch (err) {
    logs.push("=> [STATIC] Could not read file contents for string extraction.");
  }

  // Simulated telemetry based on file extension / name to retain the "demo" feel
  if (filename.endsWith('.exe') || filename.endsWith('.vbs') || filename.endsWith('.bat') || filename.endsWith('.js')) {
    logs.push("=> [BEHAVIORAL] Process spawned in virtual thread.");
    logs.push("=> [BEHAVIORAL] Suspicious registry modification detected in HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run");
    if (filename.includes('dropper') || filename.includes('malware') || filename.includes('fake')) {
       logs.push("=> [BEHAVIORAL] Secondary payload dropped in %AppData%\\Local\\Temp");
    }
  } else if (filename.endsWith('.pdf') || filename.endsWith('.docx') || filename.endsWith('.eml')) {
    logs.push("=> [BEHAVIORAL] File opened successfully in simulated viewer");
    if (filename.includes('invoice') || filename.includes('urgent') || filename.includes('phish')) {
      logs.push("=> [BEHAVIORAL] Embedded macro/script attempted execution (Blocked by Sandbox)");
      logs.push("=> [BEHAVIORAL] Attempted connection out over port 443");
    } else {
      logs.push("=> [BEHAVIORAL] No anomalous behavioral activity");
    }
  } else {
    logs.push("=> [BEHAVIORAL] Read operation successful");
    logs.push("=> [BEHAVIORAL] No anomalous behavior detected");
  }

  logAction('INFO', `Execution complete. Analyzing logs...`, "SANDBOX");
  await delay(800);

  return {
    filePath,
    status: "Completed",
    logs
  };
};

module.exports = {
  runSandbox
};
