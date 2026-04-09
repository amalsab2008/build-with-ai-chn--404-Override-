window.addEventListener('message', function(event) {
    if (event.data.type === 'SENTINEL_BLOCK') {
        const reason = event.data.reason || 'Malicious Payload Detected';
        
        // Annihilate the page DOM and inject pure red Phishing Shield
        document.documentElement.innerHTML = `
            <html style="height:100%; background: #220000; color: #ff4444; font-family: monospace;">
                <body style="height:100%; display:flex; flex-direction:column; align-items:center; justify-center:center; text-align:center; padding-top: 10%;">
                    <svg width="100" height="100" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-bottom: 20px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <h1 style="font-size: 48px; margin: 0; letter-spacing: 5px;">ACCESS DENIED</h1>
                    <h2 style="font-size: 24px; color: #993333; margin-top: 10px;">ZERO TRUST ENFORCEMENT</h2>
                    <div style="background: black; padding: 20px; border: 1px solid #550000; margin-top: 40px; max-width: 600px;">
                        <p style="font-size: 16px;">This web navigation was intercepted and terminated by SentinelAI.</p>
                        <p style="color: white;"><strong>AI Diagnosis:</strong> ${reason}</p>
                    </div>
                </body>
            </html>
        `;
        window.stop(); // Halt any further resource loading
    }
});
