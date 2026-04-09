const express = require('express');
const fs = require('fs');
const path = require('path');
const open = require('open');

const app = express();
const PORT = 3000;

// Serve static UI files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Endpoint to fetch scan history
app.get('/api/history', (req, res) => {
  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      res.json(JSON.parse(data));
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to read database" });
  }
});

// API Endpoint to fetch overall stats
app.get('/api/stats', (req, res) => {
  const dbPath = path.join(__dirname, '..', 'data', 'db.json');
  try {
    if (fs.existsSync(dbPath)) {
      const scans = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const stats = {
        totalScans: scans.length,
        threatsBlocked: scans.filter(s => s.result.decision === 'BLOCK').length,
        sandboxed: scans.filter(s => s.result.decision === 'SANDBOX').length,
        safe: scans.filter(s => s.result.decision === 'ALLOW').length,
      };
      res.json(stats);
    } else {
      res.json({ totalScans: 0, threatsBlocked: 0, sandboxed: 0, safe: 0 });
    }
  } catch(err) {
    res.status(500).json({ error: "Failed to parse stats" });
  }
});

const startDashboard = async () => {
  app.listen(PORT, async () => {
    console.log(`[DASHBOARD] 🟢 Web UI is LIVE at http://localhost:${PORT}`);
    try {
      // Automatically pop open the browser to the dashboard!
      await open(`http://localhost:${PORT}`);
    } catch(err) {
        console.log(`[DASHBOARD] Could not auto-open browser.`);
    }
  });
};

module.exports = { startDashboard };
