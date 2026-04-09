const { Service } = require('node-windows');
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'SentinelAI Endpoint Daemon',
  description: 'The real-time background zero-trust OS monitor for SentinelAI.',
  script: path.join(__dirname, 'dist', 'index.js'),
  env: [{
    name: "WATCH_DIR",
    value: process.env.USERPROFILE || "C:\\"
  }, {
    name: "GATEWAY_URL",
    value: "http://localhost:4000/api/telemetry"
  }]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', () => {
  console.log('[+] SentinelAI Service Installed Successfully.');
  svc.start();
  console.log('[+] SentinelAI Service Started correctly on Windows Auto-Boot.');
});

// Install the script as a service
console.log('Installing SentinelAI Native Windows Service. Please wait and accept the privilege escalation prompt if asked...');
svc.install();
