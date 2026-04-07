const path = require('path');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runSandbox = async (filePath) => {
  console.log(`\n[SANDBOX] Initializing isolated environment for: ${path.basename(filePath)}...`);
  await delay(1000);
  console.log(`[SANDBOX] Executing file within container...`);
  await delay(1500);

  const filename = path.basename(filePath).toLowerCase();
  
  // Simulated telemetry based on file extension / name
  let logs = [];
  
  if (filename.endsWith('.exe') || filename.endsWith('.vbs') || filename.endsWith('.bat')) {
    logs.push("=> Process spawned");
    logs.push("=> Attempted connection to an obscure remote IP (185.34.22.x)");
    logs.push("=> Suspicious registry modification detected in HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run");
    if (filename.includes('dropper') || filename.includes('malware')) {
       logs.push("=> Secondary payload dropped in %AppData%\\Local\\Temp");
    }
  } else if (filename.endsWith('.pdf') || filename.endsWith('.docx')) {
    logs.push("=> File opened successfully in simulated viewer");
    if (filename.includes('invoice') || filename.includes('urgent')) {
      logs.push("=> Embedded macro attempted execution (Blocked by Sandbox)");
      logs.push("=> Attempted connection out over port 443");
    } else {
      logs.push("=> No suspicious network activity");
      logs.push("=> No registry changes");
    }
  } else {
    logs.push("=> Read operation successful");
    logs.push("=> No anomalous behavior detected");
  }

  console.log(`[SANDBOX] Execution complete. Analyzing logs...`);
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
