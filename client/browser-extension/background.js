chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId === 0) { // Only track main window navigation
        console.log(`[SentinelAI] Intercepted navigation to: ${details.url}`);
        
        try {
            const response = await fetch('http://localhost:4000/api/web-threat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: details.url,
                    domain: new URL(details.url).hostname,
                    type: 'WEB_NAVIGATION',
                    timestamp: new Date().toISOString()
                })
            });

            const aiVerdict = await response.json();
            
            if (aiVerdict.verdict && aiVerdict.verdict.decision === 'BLOCK') {
                console.log("[SentinelAI] BLOCKED BY AI:", aiVerdict.verdict.reasoning);
                // Dynamically inject the block screen
                chrome.scripting.executeScript({
                    target: { tabId: details.tabId },
                    func: (reasoning) => {
                        window.postMessage({ type: 'SENTINEL_BLOCK', reason: reasoning }, '*');
                    },
                    args: [aiVerdict.verdict.reasoning]
                });
            }

        } catch (error) {
            console.error("[SentinelAI] Gateway Offline. Fail Open.", error);
        }
    }
});
