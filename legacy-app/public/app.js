const socket = io();

// UI Elements
const terminalOutput = document.getElementById('terminal-output');
const historyList = document.getElementById('history-list');
const valScanned = document.getElementById('val-scanned');
const valBlocked = document.getElementById('val-blocked');
const valSandboxed = document.getElementById('val-sandboxed');
const valRam = document.getElementById('val-ram');
const valUptime = document.getElementById('val-uptime');

const colorMap = {
    'ALLOW': '#00ffcc',
    'WARN': '#ffcc00',
    'SANDBOX': '#ffcc00',
    'BLOCK': '#ff3366'
};

const playAlertSound = () => {
    // A simple, futuristic beep (optional, might require browser interaction first)
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.value = 150; // Deep hum
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 200);
    } catch (e) { }
};

// Functions to Render Data
const renderTerminalItem = (scan) => {
    const isCritical = scan.result.decision === 'BLOCK';
    if (isCritical) playAlertSound();

    const div = document.createElement('div');
    div.className = `log-line ${isCritical ? 'critical' : scan.result.decision === 'ALLOW' ? 'info' : 'warning'}`;
    const time = new Date(scan.timestamp).toLocaleTimeString();
    div.innerHTML = `
        <span style="color:#8b9bb4">[${time}]</span> 
        <strong style="color: ${colorMap[scan.result.decision]}">[${scan.result.decision}]</strong> 
        File: <b>${scan.filename}</b> <br/>
        <span style="color:#8b9bb4">Score:</span> ${scan.result.riskScore}% | <span style="color:#8b9bb4">Class:</span> ${scan.result.classification} <br/>
        <span style="color: ${colorMap[scan.result.decision]}">↳ ${scan.result.reasoning}</span>
    `;
    terminalOutput.appendChild(div);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
};

const renderHistoryItem = (scan) => {
    const isCritical = scan.result.decision === 'BLOCK';
    const isWarn = scan.result.decision === 'SANDBOX' || scan.result.decision === 'WARN';

    let borderClass = '';
    let colorCss = colorMap[scan.result.decision];
    if (isCritical) borderClass = 'blocked';
    else if (isWarn) borderClass = 'sandboxed';

    const div = document.createElement('div');
    div.className = `history-item ${borderClass}`;
    div.innerHTML = `
        <div class="history-info">
            <span class="file-name">${scan.filename}</span>
            <span class="file-desc">${scan.result.classification}</span>
        </div>
        <div class="history-score" style="color: ${colorCss}">${scan.result.riskScore}%</div>
    `;
    historyList.prepend(div);
};

const updateStats = (stats) => {
    valScanned.innerText = stats.totalScans;
    valBlocked.innerText = stats.threatsBlocked;
    valSandboxed.innerText = stats.sandboxed;
    valRam.innerText = stats.memoryUsage;
    valUptime.innerText = stats.uptime;
};

// Socket Listeners
socket.on('new_scan', (scan) => {
    renderTerminalItem(scan);
    renderHistoryItem(scan);
});

socket.on('stats_update', (stats) => {
    updateStats(stats);
});

// Initial Fetch
fetch('/api/history')
    .then(r => r.json())
    .then(data => {
        data.slice(-50).forEach(scan => {
            renderHistoryItem(scan);
        });
    });

fetch('/api/stats')
    .then(r => r.json())
    .then(data => {
        updateStats(data);
    });

// Simulate Button (Optional hidden feature for demo)
document.getElementById('btn-simulate').addEventListener('click', () => {
    alert("In demo mode, you can copy 'fake_malware.bat' from 'examples' folder into the 'monitor' folder to trigger the real-time AI!");
});
