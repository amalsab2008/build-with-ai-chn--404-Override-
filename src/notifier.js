const notifier = require('node-notifier');
const path = require('path');

const showNotification = (filename, result) => {
  let title = 'SentinelAI Alert';
  let message = '';
  // Optional: you can point to an icon file if you have one.
  // We'll leave it out so it uses the default terminal/node icon.
  
  const classLower = (result.classification || '').toLowerCase();
  const isPhishing = classLower.includes('phishing') || classLower.includes('email') || classLower.includes('spam');
  const isWebsite = classLower.includes('website') || classLower.includes('url') || classLower.includes('link') || classLower.includes('site');

  if (result.decision === 'BLOCK' || result.decision === 'SANDBOX') {
    if (isPhishing) title = `🎣 Phishing Email Blocked: ${filename}`;
    else if (isWebsite) title = `🚨 Malicious Website Blocked: ${filename}`;
    else title = `🚨 Threat Blocked: ${filename}`;
    
    message = `Classification: ${result.classification}\nScore: ${result.riskScore}% - ${result.decision}`;
  } else if (result.decision === 'WARN') {
    if (isPhishing) title = `⚠️ Suspicious Email: ${filename}`;
    else if (isWebsite) title = `🌐 Warning Website: ${filename}`;
    else title = `⚠️ Suspicious File: ${filename}`;
    
    message = `Classification: ${result.classification}\nScore: ${result.riskScore}% - Proceed with caution.`;
  } else {
    title = `✅ Safe: ${filename}`;
    message = `Item has been scanned and marked as safe.`;
  }

  notifier.notify(
    {
      title: title,
      message: message,
      sound: result.decision !== 'ALLOW', // Only play sound for warnings/threats
      wait: false // Don't wait for user action
    },
    (err, response, metadata) => {
      if (err) {
        console.error('[NOTIFIER ERROR]', err);
      }
    }
  );
};

module.exports = { showNotification };
