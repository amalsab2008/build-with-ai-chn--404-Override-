const { Service } = require('node-windows');
const path = require('path');

const svc = new Service({
  name: 'SentinelAI Endpoint Daemon',
  description: 'The real-time background zero-trust OS monitor for SentinelAI.',
  script: path.join(__dirname, 'dist', 'index.js')
});

svc.on('uninstall', () => {
  console.log('[-] SentinelAI Native Windows Service Uninstalled.');
  console.log('[-] The daemon will no longer run on background boot.');
});

console.log('Uninstalling service...');
svc.uninstall();
