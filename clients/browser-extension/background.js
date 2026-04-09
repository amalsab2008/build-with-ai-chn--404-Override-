// SentinelAI Browser Security Service Worker

const GATEWAY_URL = 'http://localhost:4000/api/web-threat';

// Monitor all downloads
chrome.downloads.onCreated.addListener(async (downloadItem) => {
    console.log("[SentinelAI] Intercepted Download:", downloadItem.url);
    
    // Attempt to pause it while AI evaluates
    try {
        await chrome.downloads.pause(downloadItem.id);
        
        const payload = {
            url: downloadItem.url,
            filename: downloadItem.filename,
            type: 'DOWNLOAD_INTERCEPT',
            timestamp: new Date().toISOString(),
            agentId: 'Browser_Agent_01'
        };

        const response = await fetch(GATEWAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (result.verdict.decision === 'BLOCK' || result.verdict.decision === 'SANDBOX') {
            console.warn(`[SentinelAI] BLOCKED DOWNLOAD! Reason: ${result.verdict.reasoning}`);
            await chrome.downloads.cancel(downloadItem.id);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-48.png', // Fallback to default if icon missing
                title: 'SentinelAI: Threat Blocked',
                message: `Malicious download intercepted: ${downloadItem.filename}`
            });
        } else {
            console.log("[SentinelAI] Download deemed Safe. Resuming.");
            await chrome.downloads.resume(downloadItem.id);
        }
    } catch (e) {
        console.error("[SentinelAI] Error evaluating download:", e);
        // Fail open or fail closed depending on enterprise policy. Default: fail open.
        try { await chrome.downloads.resume(downloadItem.id); } catch(err){}
    }
});

// Monitor suspicious web navigation (Phishing/C2 Domains)
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Exclude inner frames
    if (details.frameId !== 0) return;
    
    const url = new URL(details.url);
    if (!url.protocol.startsWith('http')) return;

    // Send domain for AI Phishing/Reputation Check
    try {
        const payload = {
            url: details.url,
            domain: url.hostname,
            type: 'WEB_NAVIGATION',
            timestamp: new Date().toISOString(),
            agentId: 'Browser_Agent_01'
        };

        const response = await fetch(GATEWAY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.verdict.decision === 'BLOCK') {
            // Usually we'd redirect to a block page here
            chrome.tabs.update(details.tabId, {
                url: `data:text/html,<html><head><title>SentinelAI Blocked</title><style>body{background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;} .box { border: 1px solid red; background: rgba(255,0,0,0.1); padding: 40px; border-radius: 10px; max-width: 600px;}</style></head><body><div class="box"><h1>🛡️ SentinelAI Blocked This Page</h1><p><b>Threat Detected:</b> ${result.verdict.reasoning}</p><p>URL: ${details.url}</p></div></body></html>`
            });
        }
    } catch (e) {
        console.error("[SentinelAI] Domain evaluation failed:", e);
    }
});
