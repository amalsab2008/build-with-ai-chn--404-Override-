const express = require('express');
const fs = require('fs');
const path = require('path');
const open = require('open');
const http = require('http');
const { Server } = require("socket.io");
const chokidar = require('chokidar');
const os = require('os');
const { logAction } = require('./logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

app.get('/api/history', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const db = JSON.parse(data);
      res.json(db.scans || []); // Account for structure
    } else { res.json([]); }
  } catch (err) { res.status(500).json({ error: "Failed to read database" }); }
});

app.get('/api/stats', (req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const scans = db.scans || [];
      const stats = {
        totalScans: scans.length,
        threatsBlocked: scans.filter(s => s.result.decision === 'BLOCK').length,
        sandboxed: scans.filter(s => s.result.decision === 'SANDBOX').length,
        safe: scans.filter(s => s.result.decision === 'ALLOW').length,
        memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        uptime: Math.round(os.uptime() / 60) + ' min'
      };
      res.json(stats);
    } else {
      res.json({ totalScans: 0, threatsBlocked: 0, sandboxed: 0, safe: 0, memoryUsage: '0 MB', uptime: '0 min' });
    }
  } catch(err) { res.status(500).json({ error: "Failed to parse stats" }); }
});

// Watch the database for changes so we can stream them to websocket clients!
const watchDB = () => {
    // Only watch if DB exists, otherwise wait to add watch
    if(!fs.existsSync(DB_FILE)) {
        setTimeout(watchDB, 2000);
        return;
    }
    
    chokidar.watch(DB_FILE, { persistent: true }).on('change', () => {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const db = JSON.parse(data);
            const scans = db.scans || [];
            if (scans.length > 0) {
               const latestScan = scans[scans.length - 1];
               io.emit('new_scan', latestScan);
               // Also push stats
               const stats = {
                totalScans: scans.length,
                threatsBlocked: scans.filter(s => s.result.decision === 'BLOCK').length,
                sandboxed: scans.filter(s => s.result.decision === 'SANDBOX').length,
                safe: scans.filter(s => s.result.decision === 'ALLOW').length,
                memoryUsage: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
                uptime: Math.round(os.uptime() / 60) + ' min'
               };
               io.emit('stats_update', stats);
            }
        } catch(e) {}
    });
};

io.on('connection', (socket) => {
  logAction('INFO', 'New dashboard observer connected via WebSocket.', 'DASHBOARD');
});

const startDashboard = async () => {
  server.listen(PORT, async () => {
    logAction('INFO', `Web UI is LIVE at http://localhost:${PORT}`, 'DASHBOARD');
    watchDB();
    try {
      await open(`http://localhost:${PORT}`);
    } catch(err) {}
  });
};

module.exports = { startDashboard };
