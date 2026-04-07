const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const initializeDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ scans: [] }, null, 2));
  }
};

const readDB = () => {
  initializeDB();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const saveScanResult = (filePath, result) => {
  const db = readDB();
  const filename = path.basename(filePath);
  
  db.scans.push({
    timestamp: new Date().toISOString(),
    filename,
    filePath,
    result
  });
  
  writeDB(db);
};

const getHistory = () => {
  const db = readDB();
  return db.scans;
};

const getFileHistory = (filename) => {
  const db = readDB();
  return db.scans.filter(s => s.filename === filename);
};

module.exports = {
  initializeDB,
  saveScanResult,
  getHistory,
  getFileHistory
};
