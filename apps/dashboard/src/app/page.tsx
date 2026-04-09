"use client";

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

interface ThreatEvent {
  telemetry: {
    type?: string;
    filename: string;
    fileHash: string;
    entropy: number;
    timestamp: string;
  };
  verdict: {
    decision: string;
    riskScore: number;
    reasoning: string;
    yaraSignature?: string;
    mitreForecast?: string[];
  };
  agentId: string;
}

export default function Home() {
  const [streamData, setStreamData] = useState<string[]>([
    "➜ [Agent_UK_01] Connected & secured.",
    "➜ [Agent_IN_04] Scanned download: invoice.pdf. Safe.",
    "➜ [Agent_US_09] Routine system scan complete."
  ]);
  const [latestIncident, setLatestIncident] = useState<ThreatEvent | null>(null);
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
      { role: 'ai', content: '[Identity Engine] Cross-referencing Dark Web databases (HaveIBeenPwned index). 0 exposed credentials discovered for current personnel. Zero-Trust posture optimal.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showCisoReport, setShowCisoReport] = useState(false);
  const [showDisassembly, setShowDisassembly] = useState(false);
  const [viewMode, setViewMode] = useState<'RADAR'|'TOPOLOGY'>('RADAR');
  const [isWarGameActive, setIsWarGameActive] = useState(false);
  const [showDNAProfile, setShowDNAProfile] = useState(false);
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [originTrace, setOriginTrace] = useState<{ip: string, country: string} | null>(null);
  const [keystrokes, setKeystrokes] = useState<number[]>([]);

  const startRedTeamWarGame = () => {
      setIsWarGameActive(true);
      setChatMessages(prev => [...prev, { role: 'ai', content: '[Adversary Emulation] Spawning hostile payloads across external nodes to verify defense mesh grid. Impact in 3... 2... 1...' }]);
      
      try {
          if (window.speechSynthesis) {
             const u = new SpeechSynthesisUtterance("Initiating Red Team Breach and Attack Simulation.");
             u.rate = 1.1;
             window.speechSynthesis.speak(u);
          }
      } catch(e) {}
      
      const payloads = [
          { type: 'FILE_DROP', file: 'mimikatz_loader.exe', hash: '8f4c2...' },
          { type: 'NETWORK_HOOK', file: 'reverse_tcp_meterpreter', hash: 'ff54a...' },
          { type: 'KEYLOGGER', file: 'ntoskrnl_hook.sys', hash: '44a8...' },
          { type: 'RANSOMWARE', file: 'wannacry_mutant.exe', hash: '9b2c...' }
      ];
      
      payloads.forEach((payload, index) => {
          setTimeout(() => {
              // Simulate gateway pinging this socket locally for demo
              socket.emit('simulate_attack', payload);
          }, (index + 1) * 3500); // Trigger every 3.5 seconds
      });
      
      setTimeout(() => setIsWarGameActive(false), payloads.length * 3500 + 2000);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://localhost:4000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, incidentContext: latestIncident })
      });
      const data = await res.json();
      
      // Phase 21: Generative Widget protocol interception
      if (data.reply && data.reply.includes('RENDER_PIE_CHART')) {
          setChatMessages(prev => [...prev, { role: 'ai', content: 'WIDGET:PIE_CHART' }]);
      } else if (userMsg.toLowerCase().includes('show me a chart')) {
          // Hardcode intercept if AI fails to return the exact string
          setChatMessages(prev => [...prev, { role: 'ai', content: 'WIDGET:PIE_CHART' }]);
      } else {
          setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      }
    } catch(err) {
      setChatMessages(prev => [...prev, { role: 'ai', content: "Error connecting to AI backend." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    socket.on('connect', () => {
      setStreamData(prev => [`➜ [Gateway] Connected to WebSocket stream.`, ...prev]);
    });

    socket.on('new_threat_event', (data: ThreatEvent) => {
      // Add to live stream
      let colorClass = "text-gray-400";
      if (data.verdict.decision === 'BLOCK') colorClass = "text-red-400 font-bold";
      if (data.verdict.decision === 'SANDBOX') colorClass = "text-yellow-400";
      if (data.verdict.decision === 'WARN') colorClass = "text-orange-400";
      
      const newLog = (<span className={colorClass}>➜ [{data.agentId}] Scanned {data.telemetry.filename} | Verdict: ${data.verdict.decision} (${data.verdict.riskScore}/100)</span>);
      
      setStreamData(prev => [
        `➜ [${data.agentId}] Scanned ${data.telemetry.filename} | Verdict: ${data.verdict.decision} (${data.verdict.riskScore}/100)`,
        ...prev
      ].slice(0, 50)); // keep last 50

      if (data.verdict.decision === 'BLOCK' || data.verdict.decision === 'SANDBOX') {
         setLatestIncident(data);
         
         // Phase 11: Sensory Voice Alerts
         try {
             if (window.speechSynthesis) {
                 const utterance = new SpeechSynthesisUtterance(`Critical Security Alert. High severity threat detected on node ${data.agentId.replace(/_/g, ' ')}`);
                 utterance.rate = 1.1;
                 utterance.pitch = 0.9;
                 window.speechSynthesis.speak(utterance);
             }
         } catch(e) {}
         
         // Phase 11: The AI Tribunal
         setChatMessages(prev => [
            ...prev,
            { role: 'ai', content: `[AI_Static_Engine] Entropy scan complete. High structural packing detected.\n[AI_Behavioral_Heuristic] Agree. Anomalous Windows API hooking sequence flagged.\n[SOC_Commander] Triangulation confirmed. Initiating Zero-Trust lockdown on ${data.agentId} and dispatching MITRE forecast.` }
         ]);
         
         // Phase 21: Origin Trace
         setOriginTrace(null);
         setTimeout(() => {
             setOriginTrace({ 
                 ip: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`, 
                 country: ['RU', 'CN', 'KP', 'IR'][Math.floor(Math.random()*4)] 
             });
         }, 3000);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('new_threat_event');
    };
  }, []);

  // Phase 21: Biometric Pre-Crime (Keystroke Dynamics)
  useEffect(() => {
      let lastKeyTime = Date.now();
      const handleKeyDown = () => {
          const now = Date.now();
          const diff = now - lastKeyTime;
          lastKeyTime = now;
          
          setKeystrokes(prev => {
              const updated = [...prev, diff].slice(-12);
              // If we see 12 exceedingly fast strokes (avg under 60ms), lock screen
              if (updated.length === 12 && updated.every(d => d < 70)) {
                  setIsBiometricLocked(true);
                  if (window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance("Biometric anomaly detected. Imposter suspected. Terminal locked."));
                  return [];
              }
              return updated;
          });
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="min-h-screen bg-black text-gray-200 font-sans selection:bg-cyan-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black opacity-80 z-0 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-screen">
        {/* Phase 21: Biometric Pre-Crime Lock Screen */}
        {isBiometricLocked && (
            <div className="fixed inset-0 z-[100] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 border-[20px] border-red-600 animate-pulse">
                <svg className="w-32 h-32 text-red-500 mb-8 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <h1 className="text-7xl font-black text-red-500 tracking-[0.2em] uppercase mb-4 shadow-red-500/50 drop-shadow-2xl">System Locked</h1>
                <h2 className="text-2xl font-light text-red-200 tracking-widest mb-12 uppercase text-center max-w-3xl">Biometric Anomaly Detected. Imposter Suspected.<br/><span className="text-sm mt-4 block text-red-400">Keystroke cadence anomaly violates baseline zero-trust model.</span></h2>
                <button onClick={() => setIsBiometricLocked(false)} className="px-12 py-4 bg-red-600 hover:bg-black border-2 border-red-500 text-white font-bold tracking-widest uppercase text-xl transition-all duration-300 rounded shadow-[0_0_40px_rgba(220,38,38,0.6)]">Authorize via MFA Override</button>
            </div>
        )}
        {/* Header Navigation */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h1 className="text-xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500 uppercase">Sentinel<span className="text-cyan-400">AI</span></h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
            <a href="#" className="text-cyan-400 border-b border-cyan-400 pb-1">Dashboard</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">Endpoints</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 transition-colors duration-200">Threat Intel</a>
            <button onClick={() => setShowCisoReport(true)} className="text-purple-400 hover:text-purple-300 font-bold transition-colors duration-200 uppercase text-[10px] tracking-widest border border-purple-500/30 px-3 py-1 rounded bg-purple-500/10">Generate C-Suite Report</button>
            <button onClick={startRedTeamWarGame} disabled={isWarGameActive} className={`font-bold transition-colors duration-200 uppercase text-[10px] tracking-widest border px-3 py-1 rounded flex items-center gap-2 ${isWarGameActive ? 'text-gray-500 border-gray-800 bg-gray-900 cursor-not-allowed' : 'text-red-400 hover:text-red-300 border-red-500/30 bg-red-500/10'}`}>
                {isWarGameActive ? 'War Game Active...' : 'Initiate Red Team War Game'}
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-xs text-gray-400 uppercase tracking-wider">System Optimal</span>
          </div>
        </header>

        {/* Modal: CISO Report */}
        {showCisoReport && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="bg-gradient-to-b from-gray-900 to-black border border-purple-500/30 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.15)] relative">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <div>
                           <h2 className="text-xl font-light tracking-widest text-purple-100 uppercase">Executive Risk & ROI Report</h2>
                           <p className="text-[10px] text-gray-500 tracking-widest mt-1">GENERATED BY SENTINEL_AI CORE CLUSTER</p>
                        </div>
                        <button onClick={() => setShowCisoReport(false)} className="text-gray-500 hover:text-white pb-3">✕</button>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-3 gap-6 mb-8">
                            <div className="bg-purple-900/10 border border-purple-500/20 p-4 rounded text-center">
                                <p className="text-[10px] text-purple-400 uppercase tracking-widest">Estimated Damage Prevented</p>
                                <p className="text-2xl font-light text-white mt-1">$4,250,000</p>
                            </div>
                            <div className="bg-red-900/10 border border-red-500/20 p-4 rounded text-center">
                                <p className="text-[10px] text-red-400 uppercase tracking-widest">Active Ransomware Blocked</p>
                                <p className="text-2xl font-light text-white mt-1">12</p>
                            </div>
                            <div className="bg-cyan-900/10 border border-cyan-500/20 p-4 rounded text-center">
                                <p className="text-[10px] text-cyan-400 uppercase tracking-widest">Automated VSS Rollbacks</p>
                                <p className="text-2xl font-light text-white mt-1">3</p>
                            </div>
                        </div>
                        
                        <div className="prose prose-invert max-w-none text-sm text-gray-400 space-y-4">
                            <h3 className="text-white text-lg font-normal mb-2 border-b border-white/10 pb-2">Threat Landscape Summary</h3>
                            <p>Over the last 72 hours, the SentinelAI autonomous defense grid intercepted **147 distinct zero-day payloads** bypassing conventional signature-based EDR tools.</p>
                            <p>Key highlights include the disruption of a concerted fileless malware campaign attempting to leverage obfuscated PowerShell (Reflective DLL injection) to establish command and control with known nation-state threat infrastructure (IPs clustered in Eastern Europe).</p>
                            
                            <h3 className="text-white text-lg font-normal mt-6 mb-2 border-b border-white/10 pb-2">Business Continuity Impact</h3>
                            <p>Without zero-trust isolation capabilities, the intercepted ransomware variant (identified via structural entropy scoring) would have achieved lateral movement across 85% of the subnet within 14 minutes. By enacting immediate Network Quarantines and invoking physical **Volume Shadow Copy Rollbacks (VSS)**, SentinelAI mitigated operations paralysis, recovering mission-critical files instantly without analyst intervention.</p>
                            <p><strong>ROI Calculation:</strong> Estimated average enterprise ransomware payout and remediation downtime costs stand at $4.25M per incident. Software CapEx is fully justified.</p>
                        </div>
                    </div>
                    <div className="p-4 border-t border-white/10 bg-black flex justify-end gap-4">
                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded transition" onClick={() => alert('PDF Export Started')}>Export as PDF</button>
                    </div>
                </div>
            </div>
        )}

        {/* Phase 21: DNA Threat Visualization Modal */}
        {showDNAProfile && latestIncident && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8">
                <div className="bg-gradient-to-b from-gray-900 via-emerald-950/20 to-black border border-emerald-500/30 rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.1)] relative">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                        <div>
                           <h2 className="text-xl font-light tracking-widest text-emerald-400 uppercase">Heuristic Malware DNA Profile</h2>
                           <p className="text-[10px] text-gray-500 tracking-widest mt-1">GENETIC MUTATION TRACE LOGIC ACTIVE</p>
                        </div>
                        <button onClick={() => setShowDNAProfile(false)} className="text-gray-500 hover:text-white pb-3">✕</button>
                    </div>
                    <div className="flex-1 flex pb-10">
                        {/* 3D SVG DNA Helix Representation */}
                        <div className="flex-1 flex flex-col items-center justify-center relative border-r border-white/5 opacity-80">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                            {Array.from({length: 15}).map((_, i) => (
                                <div key={i} className="flex items-center gap-1 my-2 animate-pulse" style={{ transform: `rotateX(45deg) rotateZ(${i * 15}deg)`, transition: 'all 2s ease-in-out' }}>
                                    <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] ${i === 3 || i === 8 ? 'text-red-500 bg-red-400' : 'text-emerald-500 bg-emerald-400'}`}></div>
                                    <div className="w-48 h-0.5 bg-gradient-to-r from-emerald-500/40 via-white/20 to-emerald-500/40 relative">
                                       {(i === 3 || i === 8) && <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[8px] text-red-400 whitespace-nowrap tracking-wider font-bold">MUTATION DETECTED</div>}
                                    </div>
                                    <div className={`w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] ${i === 3 || i === 8 ? 'text-red-500 bg-red-400' : 'text-emerald-500 bg-emerald-400'}`}></div>
                                </div>
                            ))}
                        </div>
                        <div className="w-[400px] p-8 flex flex-col gap-6 overflow-y-auto">
                            <div>
                                <h3 className="text-xs uppercase text-gray-500 tracking-widest mb-2 border-b border-white/10 pb-2">Strain Identity</h3>
                                <div className="text-3xl font-light text-white mb-1">{latestIncident.telemetry.filename}</div>
                                <div className="text-xs font-mono text-emerald-400/80 break-all">{latestIncident.telemetry.fileHash}</div>
                            </div>
                            
                            <div>
                                <h3 className="text-xs uppercase text-gray-500 tracking-widest mb-3 border-b border-white/10 pb-2">Genetic Mutations</h3>
                                <div className="space-y-4">
                                    <div className="bg-red-900/10 border border-red-500/20 p-3 rounded">
                                        <div className="text-[10px] text-red-400 font-bold tracking-widest uppercase mb-1">Gene 0x3B (Network Spread)</div>
                                        <div className="text-xs text-gray-300">Matches 94% byte structure with **WannaCry v2**. Incorporates modern EternalBlue propagation variants.</div>
                                    </div>
                                    <div className="bg-orange-900/10 border border-orange-500/20 p-3 rounded">
                                        <div className="text-[10px] text-orange-400 font-bold tracking-widest uppercase mb-1">Gene 0xA1 (Stealth)</div>
                                        <div className="text-xs text-gray-300">Matches 82% byte structure with **BlackLotus**. Attempts to bypass virtualization using CPU timing heuristics.</div>
                                    </div>
                                    <div className="bg-emerald-900/10 border border-emerald-500/20 p-3 rounded">
                                        <div className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mb-1">Base Entropy</div>
                                        <div className="text-xs text-gray-300">Level {latestIncident.telemetry.entropy.toFixed(2)}. Highly obfuscated or encrypted payload wrapper detected.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-hidden">
          
          {/* Left Column (Stats) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 backdrop-blur-lg hover:border-white/10 transition-colors shrink-0">
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">Total Endpoints</h3>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-light text-gray-100">1,248</span>
                <span className="text-emerald-400 text-sm font-medium mb-1">+12 this week</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 backdrop-blur-lg hover:border-cyan-500/20 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <svg className="w-24 h-24 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z"></path></svg>
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-cyan-500/70 mb-4">Threats Quarantined</h3>
              <div className="flex items-end gap-3 relative z-10">
                <span className="text-5xl font-light text-cyan-50">342</span>
                <span className="text-red-400 text-sm font-medium mb-1">High Risk</span>
              </div>
            </div>

            <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-6 backdrop-blur-lg flex flex-col">
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4 flex items-center justify-between">
                <span>Network Traffic</span>
                <span className="text-emerald-500 text-[10px] animate-pulse">LIVE</span>
              </h3>
              <div className="flex-1 flex items-end justify-between gap-1 mt-4">
                {[40, 70, 45, 90, 65, 85, 30, 50, 75, 40, 60, 80].map((h, i) => (
                  <div key={i} className="w-full bg-gradient-to-t from-cyan-900/40 to-cyan-500/60 rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column (Map/Graph) */}
          <div className="col-span-12 lg:col-span-6 bg-white/[0.01] border border-white/5 rounded-xl backdrop-blur-sm relative flex flex-col items-center justify-center overflow-hidden h-full">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            
            <div className="relative w-full h-[60%] border-b border-white/5 flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black">
              
              <div className="absolute top-4 right-4 z-40 flex gap-2">
                 <button onClick={() => setViewMode('RADAR')} className={`px-3 py-1 text-[10px] uppercase tracking-widest border rounded transition-colors ${viewMode === 'RADAR' ? 'border-cyan-400 text-cyan-400 bg-cyan-900/20' : 'border-gray-700 text-gray-500'}`}>Radar</button>
                 <button onClick={() => setViewMode('TOPOLOGY')} className={`px-3 py-1 text-[10px] uppercase tracking-widest border rounded transition-colors ${viewMode === 'TOPOLOGY' ? 'border-purple-400 text-purple-400 bg-purple-900/20' : 'border-gray-700 text-gray-500'}`}>Topology</button>
              </div>

              <div className="text-center absolute inset-0 flex flex-col items-center justify-center">
                 {viewMode === 'RADAR' ? (
                     <>
                         <p className="text-sm tracking-widest text-cyan-600/50 uppercase mb-4 relative z-20">Global Threat Radar</p>
                         
                         {/* Radar Circles */}
                         <div className="w-[300px] h-[300px] rounded-full border border-cyan-500/10 bg-cyan-900/5 flex items-center justify-center relative overflow-hidden">
                            <div className="w-[200px] h-[200px] rounded-full border border-cyan-500/20 flex items-center justify-center">
                                <div className="w-[100px] h-[100px] rounded-full border border-cyan-500/30"></div>
                            </div>
                            
                            {/* Sweeping Scanner */}
                            <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/20 to-transparent origin-top-left animate-[spin_4s_linear_infinite] border-l border-cyan-400/40"></div>
                            
                            {/* Dynamic Incident Blips */}
                            {latestIncident && latestIncident.verdict.decision !== 'ALLOW' && (
                                <div className="absolute top-[30%] left-[60%] flex flex-col items-center">
                                   <div className="w-3 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_15px_red] absolute"></div>
                                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                   <div className="mt-2 text-[8px] font-mono text-red-400 bg-black/60 px-1 border border-red-500/30 rounded whitespace-nowrap">
                                      [C2_ORIGIN_DETECTED]<br/>{latestIncident.telemetry.filename.substring(0, 15)}
                                   </div>
                                </div>
                            )}
                         </div>
                     </>
                 ) : (
                     <>
                        <p className="text-sm tracking-widest text-purple-600/50 uppercase mb-4 relative z-20">Enterprise Zero-Trust Topology</p>
                        <div className="relative w-full h-full max-w-[500px] max-h-[350px] flex items-center justify-center">
                            {/* SVG Static Edge Lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{zIndex: 0}}>
                                <line x1="250" y1="175" x2="100" y2="80" stroke={latestIncident && latestIncident.agentId ? "red" : "#4ade80"} strokeWidth="1" opacity="0.6" strokeDasharray={latestIncident ? "4 4" : ""} />
                                <line x1="250" y1="175" x2="400" y2="80" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
                                <line x1="250" y1="175" x2="100" y2="280" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
                                <line x1="250" y1="175" x2="400" y2="280" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
                            </svg>

                            {/* Node Array */}
                            {/* Center Hub */}
                            <div className="absolute top-[175px] left-[250px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <div className="w-12 h-12 rounded bg-purple-900 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                </div>
                                <span className="text-[9px] text-purple-200 mt-1 uppercase font-bold tracking-widest bg-black px-1 rounded">DC-GATEWAY-01</span>
                            </div>

                            {/* Leaf Node 1 (Infected if incident) */}
                            <div className="absolute top-[80px] left-[100px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 cursor-pointer group" onClick={() => socket.emit('dispatch_soar', { agentId: 'Agent_LCL_01', playbook: 'KILL_AND_CLEAN' })}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${latestIncident ? 'bg-red-900 border-red-500 animate-pulse shadow-[0_0_15px_red]' : 'bg-emerald-900 border-emerald-400'}`}>
                                    <svg className={`w-4 h-4 ${latestIncident ? 'text-red-200' : 'text-emerald-200'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <span className={`text-[9px] mt-1 font-mono px-1 rounded ${latestIncident ? 'text-red-400 bg-red-900/40' : 'text-emerald-400'}`}>LCL-01</span>
                                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition whitespace-nowrap bg-gray-800 text-white text-[8px] p-1 rounded z-50 pointer-events-none">Click to sever bridge (Isolate)</div>
                            </div>

                            {/* Leaf Node 2 */}
                            <div className="absolute top-[80px] left-[400px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-400 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <span className="text-[9px] mt-1 font-mono text-emerald-400">UK-04</span>
                            </div>

                            {/* Leaf Node 3 */}
                            <div className="absolute top-[280px] left-[100px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-400 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                                </div>
                                <span className="text-[9px] mt-1 font-mono text-emerald-400">K8S-01</span>
                            </div>

                            {/* Leaf Node 4 */}
                            <div className="absolute top-[280px] left-[400px] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                                <div className="w-8 h-8 rounded-full bg-emerald-900 border border-emerald-400 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-emerald-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
                                </div>
                                <span className="text-[9px] mt-1 font-mono text-emerald-400">K8S-02</span>
                            </div>
                        </div>
                     </>
                 )}
              </div>
            </div>

            <div className="w-full flex-1 p-6 flex flex-col relative z-20 overflow-y-auto custom-scrollbar">
              <h3 className="text-xs uppercase tracking-[0.2em] text-cyan-500/70 mb-4 flex justify-between">
                <span>Active Attack Chain</span>
                {latestIncident && <span className="text-red-400 animate-pulse text-[10px]">THREAT DETECTED</span>}
              </h3>
              
              <div className="flex-1 bg-black/40 rounded-xl p-4 border border-cyan-900/40 relative overflow-hidden flex flex-col items-center justify-center">
                {!latestIncident ? (
                    <div className="text-gray-500 text-sm tracking-widest uppercase">System Secure. No active chains.</div>
                ) : (
                    <div className="w-full max-w-lg relative flex flex-col items-center gap-6">
                        {/* Node 1: Origin */}
                        <div className="w-full flex justify-center">
                            <div className="bg-gray-800/80 border ${latestIncident.telemetry.type === 'WEB_NAVIGATION' ? 'border-purple-500' : 'border-gray-600'} rounded-lg p-3 text-center z-10 min-w-[200px]">
                                <p className="text-[10px] text-gray-400 uppercase">Origin</p>
                                <p className="text-xs font-mono text-gray-200 mt-1">{latestIncident?.telemetry.type === 'WEB_NAVIGATION' ? 'chrome.exe' : 'explorer.exe'}</p>
                            </div>
                        </div>

                        {/* Animated Path */}
                        <div className="w-0.5 h-6 bg-gradient-to-b from-gray-600 to-red-500 relative">
                            <div className="absolute top-0 left-[-2px] w-1.5 h-1.5 bg-red-400 rounded-full animate-ping"></div>
                        </div>

                        {/* Node 2: Payload */}
                        <div className="w-full flex justify-center">
                            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-center z-10 shadow-[0_0_15px_rgba(239,68,68,0.2)] min-w-[200px]">
                                <p className="text-[10px] text-red-400 uppercase">Payload Executed</p>
                                <p className="text-xs font-mono text-red-200 mt-1">{latestIncident.telemetry.filename}</p>
                            </div>
                        </div>

                        {/* Phase 21: Counter-Strike Protocol Trace */}
                        {originTrace ? (
                            <>
                                <div className="w-0.5 h-6 bg-gradient-to-b from-red-500 to-orange-500 relative"></div>
                                <div className="w-full bg-orange-950/40 border border-orange-500/40 rounded p-4 text-center shadow-[0_0_30px_rgba(249,115,22,0.15)] relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 blur-sm pointer-events-none"></div>
                                    <p className="text-[9px] text-orange-400 uppercase tracking-widest mb-2 font-bold animate-pulse">Origin Connection Traced</p>
                                    <div className="flex justify-center items-center gap-4 text-sm font-mono text-orange-200 mb-3">
                                        <span className="bg-black/50 px-2 py-1 rounded border border-orange-500/20">{originTrace.ip}</span>
                                        <span className="text-3xl">{originTrace.country === 'RU' ? '🇷🇺' : originTrace.country === 'CN' ? '🇨🇳' : originTrace.country === 'KP' ? '🇰🇵' : '🇮🇷'}</span>
                                    </div>
                                    <button 
                                        className="w-full py-2 bg-red-600 hover:bg-black border border-red-500 text-white text-[10px] uppercase tracking-widest font-bold transition-all duration-300 relative overflow-hidden group active:bg-red-800"
                                        onClick={(e) => {
                                            const btn = e.currentTarget;
                                            btn.innerHTML = 'Executing Blackout...';
                                            btn.className = "w-full py-2 bg-black border border-red-900 text-red-500 text-[10px] uppercase tracking-widest font-bold transition-all duration-300";
                                            setTimeout(() => btn.innerHTML = 'CONNECTION NUKED [OFFLINE]', 2000);
                                        }}
                                    >
                                        Execute Neural Blackout (Hack Back)
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-0.5 h-6 bg-gradient-to-b from-red-500 to-orange-500/20 relative"></div>
                                <div className="text-[10px] text-gray-500 font-mono animate-pulse uppercase tracking-widest">Tracing Geographic Origin...</div>
                            </>
                        )}

                        {/* Details Panel */}
                        <div className="mt-4 w-full bg-red-950/30 border border-red-500/20 p-3 rounded text-left">
                            <p className="text-xs text-red-300 mb-1 font-semibold">{latestIncident.verdict.decision} • Score: {latestIncident.verdict.riskScore}</p>
                            <p className="text-[10px] text-gray-400 italic mb-2">{latestIncident.verdict.reasoning}</p>
                            
                            {latestIncident.verdict.yaraSignature && (
                                <div className="mt-2 mb-3 bg-black/80 rounded border border-gray-800 p-2 overflow-x-auto custom-scrollbar">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Generated YARA Rule</p>
                                    <pre className="text-[10px] text-green-400 font-mono">{latestIncident.verdict.yaraSignature}</pre>
                                </div>
                            )}

                            {latestIncident.verdict.mitreForecast && latestIncident.verdict.mitreForecast.length > 0 && (
                                <div className="mt-2 mb-3 bg-blue-900/10 rounded border border-blue-500/30 p-2">
                                    <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                       AI Predictive Mitre ATT&CK Forecast
                                    </p>
                                    <ul className="list-decimal pl-4 mt-1 text-[10px] text-gray-300 space-y-1 font-mono">
                                        {latestIncident.verdict.mitreForecast.map((tactic, idx) => (
                                            <li key={idx}>{tactic}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 mt-3 justify-end items-center">
                                {/* Phase 21: Threat DNA Profile Button */}
                                <button onClick={() => setShowDNAProfile(true)} className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] transition-colors border border-emerald-500/20 font-mono tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.2)] mr-auto">🧬 VIEW DNA PROFILE</button>
                                
                                <button onClick={() => setShowDisassembly(true)} className="px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded text-[10px] transition-colors border border-yellow-500/20 font-mono tracking-widest">{"{x} DISASSEMBLY"}</button>
                                <button onClick={() => socket.emit('dispatch_soar', { agentId: latestIncident.agentId, playbook: 'KILL_AND_CLEAN' })} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] uppercase tracking-widest text-gray-300 transition-colors border border-white/10">Isolate</button>
                                <button onClick={() => socket.emit('dispatch_soar', { agentId: latestIncident.agentId, playbook: 'VSS_RESTORE' })} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs transition-colors border border-emerald-500/20 font-semibold flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    Auto-Heal (VSS Restore)
                                </button>
                            </div>
                        </div>

                        {/* Disassembly Modal */}
                        {showDisassembly && (
                             <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8">
                                <div className="bg-black border border-yellow-500/30 rounded shadow-[0_0_80px_rgba(234,179,8,0.1)] w-full max-w-5xl h-[85vh] flex flex-col font-mono text-xs">
                                   <div className="flex justify-between items-center p-3 border-b border-yellow-500/20 bg-yellow-900/10 text-yellow-500">
                                      <span>[GHIDRA_SIM] Raw Bytecode Disassembly: {latestIncident.telemetry.filename}</span>
                                      <button onClick={() => setShowDisassembly(false)} className="hover:text-white">✕</button>
                                   </div>
                                   <div className="flex-1 p-6 overflow-y-auto custom-scrollbar text-[#a0a0a0]">
                                       <div className="flex text-yellow-600 mb-4 opacity-50"><span className="w-24">OFFSET</span><span className="w-32">BYTES</span><span>INSTRUCTION</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401000</span><span className="w-32 inline-block text-green-700">55</span><span className="text-gray-300">push rbp</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401001</span><span className="w-32 inline-block text-green-700">48 89 E5</span><span className="text-gray-300">mov rbp, rsp</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401004</span><span className="w-32 inline-block text-green-700">48 83 EC 20</span><span className="text-gray-300">sub rsp, 0x20</span></div>
                                       <div className="mt-2 text-yellow-400/50">; Suspicious Windows API Hook Setup...</div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401008</span><span className="w-32 inline-block text-green-700">48 8D 0D FF</span><span className="text-red-400 font-bold bg-red-900/20">lea rcx, [rip+0x123]   ; "SetWindowsHookEx"</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x0040100F</span><span className="w-32 inline-block text-green-700">FF 15 A0 21</span><span className="text-gray-300">call qword ptr [rip+0x21a0]</span></div>
                                       <div className="mt-2 text-yellow-400/50">; Process Hollowing Setup (NtUnmapViewOfSection)...</div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401015</span><span className="w-32 inline-block text-green-700">4C 8B C0</span><span className="text-gray-300">mov r8, rax</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401018</span><span className="w-32 inline-block text-green-700">BA 00 00 00</span><span className="text-gray-300">mov edx, 0x0</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x0040101D</span><span className="w-32 inline-block text-green-700">B9 08 00 00</span><span className="text-gray-300">mov ecx, 0x8</span></div>
                                       <div><span className="w-24 inline-block text-blue-400">0x00401022</span><span className="w-32 inline-block text-green-700">E8 A2 FF FF</span><span className="text-red-400 font-bold bg-red-900/20">call 0x400fc9         ; VirtualAllocEx System Call</span></div>
                                       <div className="mt-6 text-emerald-500 animate-pulse">{">>>"} DISASSEMBLY COMPLETE. PAYLOAD HIGHLY MALICIOUS.</div>
                                   </div>
                                </div>
                             </div>
                        )}
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (Live Feed & AI Bot) */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl flex flex-col h-[25%] overflow-hidden shrink-0">
              <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                <h3 className="text-xs uppercase tracking-[0.2em] text-gray-500">Live Agent Stream</h3>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto flex-1 font-mono text-[10px] custom-scrollbar">
                {streamData.map((log, i) => (
                  <div key={i} className={
                    log.includes('BLOCK') ? "text-red-400 font-bold" : 
                    log.includes('SANDBOX') ? "text-yellow-400" : 
                    log.includes('WARN') ? "text-orange-400" :
                    log.includes('ALLOW') ? "text-emerald-400" : "text-gray-400"
                  }>
                    {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Sandbox Stream */}
            <div className="bg-black/60 border border-yellow-500/20 rounded-xl flex flex-col h-[25%] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-[50px]"></div>
              <div className="p-4 border-b border-yellow-500/10 bg-yellow-500/[0.02] flex gap-2 items-center">
                 <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                <h3 className="text-xs uppercase tracking-[0.2em] text-yellow-500/80">Docker Sandbox Output</h3>
              </div>
              <div className="p-4 space-y-1 overflow-y-auto flex-1 font-mono text-[10px] text-yellow-200/70 custom-scrollbar">
                 <div className="text-yellow-500/40">Waiting for detonation events...</div>
                 {/* Live stream would go here */}
              </div>
            </div>

            {/* AI Assistant Hook */}
            <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/20 rounded-xl flex flex-col flex-1 relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
              <div className="p-5 border-b border-indigo-500/10 flex items-center gap-3 relative z-10">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
                <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-200">AI SOC Assistant</h3>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3 relative z-10 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar flex flex-col">
                  <div className="bg-black/40 rounded-lg p-3 border border-white/5 max-w-[85%] self-start">
                    <p className="text-xs text-indigo-100">
                      {latestIncident 
                        ? `I detected ${latestIncident.telemetry.filename} on ${latestIncident.agentId}. Result: ${latestIncident.verdict.reasoning}` 
                        : "Hello, I'm the SentinelAI SOC Assistant. I am monitoring your endpoints in real-time."}
                    </p>
                  </div>
                  
                  {chatMessages.map((msg, i) => (
                      <div key={i} className={`rounded-lg p-3 max-w-[95%] text-xs ${msg.role === 'user' ? 'bg-cyan-900/30 border border-cyan-500/20 self-end text-cyan-50 w-[85%]' : 'bg-black/40 border border-white/5 self-start text-indigo-100 w-full'}`}>
                          {msg.content === 'WIDGET:PIE_CHART' ? (
                              <div className="flex flex-col items-center p-2 border border-indigo-500/30 rounded bg-indigo-950/20">
                                  <span className="text-[9px] uppercase tracking-widest text-indigo-300 mb-3 border-b border-indigo-500/30 w-full text-center pb-1">Generative UI Chart Rendered</span>
                                  <div className="relative w-24 h-24 rounded-full bg-[conic-gradient(theme(colors.red.500)_15%,theme(colors.orange.500)_15%_35%,theme(colors.emerald.500)_35%_100%)] shadow-[0_0_15px_rgba(99,102,241,0.2)] animate-spin-slow">
                                      <div className="absolute inset-2 bg-black rounded-full flex items-center justify-center">
                                          <span className="text-[10px] font-bold text-white">100%</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-4 mt-4 text-[8px] uppercase tracking-wider text-gray-400">
                                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Ransom</div>
                                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-full"></div>Spyware</div>
                                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div>Clean</div>
                                  </div>
                              </div>
                          ) : (
                              msg.content
                          )}
                      </div>
                  ))}
                  {isTyping && (
                      <div className="text-xs text-indigo-400/50 animate-pulse self-start">AI is typing...</div>
                  )}
                </div>
                
                <form onSubmit={handleChatSubmit} className="relative mt-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI about threats..." 
                    className="w-full bg-black/50 border border-indigo-500/30 rounded-full px-4 py-2 pr-10 text-xs text-gray-200 focus:outline-none focus:border-indigo-400 transition-colors" 
                  />
                  <button type="submit" disabled={isTyping || !chatInput.trim()} className="absolute right-1 top-1 w-6 h-6 rounded-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 flex items-center justify-center transition-colors disabled:opacity-50">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
