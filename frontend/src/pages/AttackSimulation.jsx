import React, { useState, useEffect, useRef } from 'react';
import {
    Terminal,
    Activity,
    Lock,
    Globe,
    Settings,
    Database,
    Search,
    Crosshair,
    AlertOctagon,
    Cpu,
    Server,
    Shield,
    Zap
} from 'lucide-react';

// --- Simulation Data & Helpers ---

const INITIAL_LOGS = [
    { ts: '00:00:01', type: 'info', msg: 'Server console initialized. Kernel v5.15.0-generic loaded.' },
    { ts: '00:00:02', type: 'success', msg: 'Uplink established. Latency: 12ms.' },
    { ts: '00:00:02', type: 'info', msg: 'Loading infrastructure modules...' },
    { ts: '00:00:03', type: 'success', msg: 'Modules ready: [SQLi, BruteForce, DDoS, PortScan]' },
    { ts: '00:00:04', type: 'warning', msg: 'Root privileges granted. Monitoring active.' },
    { ts: '00:00:05', type: 'info', msg: 'Awaiting target designation...' },
];

const SERVER_ATTACKS = [
    { id: 'sql', name: 'SQL Injection', icon: Database, color: 'text-blue-400', desc: 'Inject malicious queries to manipulate backend database.' },
    { id: 'brute', name: 'Brute Force', icon: Lock, color: 'text-orange-400', desc: 'Automated credential cracking against auth servers.' },
    { id: 'flood', name: 'Network Flood', icon: Activity, color: 'text-purple-400', desc: 'High-volume UDP/TCP packet saturation attack.' },
    { id: 'scan', name: 'Port Scan', icon: Search, color: 'text-[#ccf655]', desc: 'Reconnaissance for open server ports (21, 22, 80, 443).' },
];

// --- Components ---

const Header = ({ status }) => (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 relative z-10">
        <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 bg-[#ccf655] rounded-full shadow-[0_0_10px_#ccf655] animate-pulse"></div>
                <span className="uppercase text-[10px] text-[#ccf655] tracking-[0.25em] font-mono leading-none pt-0.5">Server Ops v3.1 // Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white font-instrument italic">
                Server Attack Console.
            </h1>
        </div>

        <div className="flex items-center gap-6 bg-zinc-900/60 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="text-right">
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-widest font-mono">Status</div>
                <div className={`text-xl font-medium font-mono tracking-widest ${status === 'ATTACKING' ? 'text-red-500 animate-pulse' : 'text-[#ccf655]'}`}>
                    {status}
                </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${status === 'ATTACKING' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-[#ccf655] shadow-[0_0_10px_#ccf655]'}`}></div>
        </div>
    </div>
);

const ConfigPanel = ({ config, setConfig, onPing }) => (
    <div className="relative group bg-zinc-900/40 border-white/10 border ring-white/5 ring-1 rounded-3xl p-8 mb-8 backdrop-blur-xl transition-all duration-500 hover:bg-zinc-900/60 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"></div>

        <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
            <Settings className="text-zinc-400" size={18} />
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 font-mono">Server Configuration</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end relative z-10">
            {/* Target URL */}
            <div className="lg:col-span-7 space-y-3">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Target Server IP / Domain</label>
                <div className="flex gap-3">
                    <div className="relative flex-grow group/input">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within/input:text-[#ccf655] transition-colors" />
                        <input
                            type="text"
                            value={config.target}
                            onChange={(e) => setConfig({ ...config, target: e.target.value })}
                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-mono text-white focus:outline-none focus:border-[#ccf655]/50 focus:ring-1 focus:ring-[#ccf655]/50 transition-all placeholder:text-zinc-700"
                            placeholder="https://api.server.local"
                        />
                    </div>
                    <button
                        onClick={onPing}
                        className="px-6 py-3 bg-[#ccf655] hover:bg-[#bce34d] text-black rounded-xl text-xs font-bold font-mono border border-transparent transition-all shadow-[0_0_20px_rgba(204,246,85,0.2)] hover:shadow-[0_0_30px_rgba(204,246,85,0.4)]"
                    >
                        PING SERVER
                    </button>
                </div>
                <div className="flex gap-4 text-[10px] text-zinc-600 font-mono pl-1">
                    <span className="cursor-pointer hover:text-[#ccf655] transition-colors" onClick={() => setConfig({ ...config, target: '10.0.0.1' })}>Ex: 10.0.0.1 (Internal)</span>
                    <span className="text-zinc-800">|</span>
                    <span className="cursor-pointer hover:text-[#ccf655] transition-colors" onClick={() => setConfig({ ...config, target: 'prod-db-01.local' })}>Ex: prod-db-01.local</span>
                </div>
            </div>

            {/* Parameters */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="space-y-3">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Packet Count</label>
                    <input
                        type="number"
                        value={config.requests}
                        onChange={(e) => setConfig({ ...config, requests: parseInt(e.target.value) })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-white/30 transition-all"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Concurrency (Threads)</label>
                    <input
                        type="number"
                        value={config.threads}
                        onChange={(e) => setConfig({ ...config, threads: parseInt(e.target.value) })}
                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono text-white focus:outline-none focus:border-white/30 transition-all"
                    />
                </div>
            </div>
        </div>
    </div>
);

const AttackModule = ({ module, isActive, onClick }) => {
    const Icon = module.icon;

    return (
        <button
            onClick={onClick}
            disabled={isActive}
            className={`relative group flex flex-col items-start p-6 rounded-2xl border transition-all duration-500 w-full text-left h-full backdrop-blur-sm overflow-hidden
        ${isActive
                    ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                }
      `}
        >
            {/* Background Hover Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>

            {isActive && (
                <span className="absolute top-4 right-4 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
            )}

            <div className={`p-3 rounded-xl mb-6 transition-colors ${isActive ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-zinc-400 group-hover:text-[#ccf655] group-hover:bg-[#ccf655]/10'}`}>
                <Icon size={24} className="transition-colors" />
            </div>

            <h4 className={`text-base font-medium font-instrument tracking-wide mb-2 transition-colors ${isActive ? 'text-red-400' : 'text-white'}`}>{module.name}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-inter">{module.desc}</p>

            {isActive && (
                <div className="w-full mt-6 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 animate-progress-indeterminate"></div>
                </div>
            )}
        </button>
    );
};

const LogConsole = ({ logs }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="flex flex-col h-[320px] bg-black/80 rounded-3xl border border-white/10 overflow-hidden font-mono text-xs shadow-2xl relative z-10 backdrop-blur-xl">
            <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-[#ccf655]" />
                    <span className="font-semibold text-zinc-400 uppercase tracking-widest text-[10px]">Server Logs</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-zinc-500">ROOT ACCESS</div>
                    <div className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-zinc-500">SSH</div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-4 hover:bg-white/5 p-1 rounded-sm transition-colors -mx-1 px-2 border-l-2 border-transparent hover:border-white/10">
                        <span className="text-zinc-600 shrink-0 select-none font-light">{log.ts}</span>
                        <span className={`
              font-medium tracking-tight
              ${log.type === 'error' ? 'text-red-400' : ''}
              ${log.type === 'success' ? 'text-[#ccf655]' : ''}
              ${log.type === 'warning' ? 'text-amber-300' : ''}
              ${log.type === 'info' ? 'text-zinc-400' : ''}
              ${log.type === 'system' ? 'text-blue-300' : ''}
            `}>
                            {log.type === 'system' && <span className="text-zinc-500 mr-2">root@server:~#</span>}
                            {log.msg}
                        </span>
                    </div>
                ))}
                {logs.length === 0 && <div className="text-zinc-700 italic">No active logs...</div>}
            </div>
        </div>
    );
};

// --- Main App ---

const AttackSimulation = () => {
    const [status, setStatus] = useState('READY');
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [config, setConfig] = useState({
        target: '192.168.1.10',
        requests: 10000,
        threads: 64
    });

    const timerRef = useRef(null);

    const addLog = (msg, type = 'info') => {
        const now = new Date();
        const ts = now.toTimeString().split(' ')[0];
        setLogs(prev => [...prev.slice(-100), { ts, msg, type }]);
    };

    const handlePing = () => {
        if (!config.target) {
            addLog('Error: No target specified for PING request.', 'error');
            return;
        }
        addLog(`Pinging server ${config.target}...`, 'system');
        setTimeout(() => {
            const latency = Math.floor(Math.random() * 80) + 10;
            addLog(`Server reply from ${config.target}: bytes=64 time=${latency}ms`, 'success');
        }, 600);
    };

    const startAttack = async (moduleId) => {
        if (status === 'ATTACKING') return;

        if (!config.target) {
            addLog('FAILURE: Cannot initialize attack module. Target server undefined.', 'error');
            return;
        }

        setStatus('ATTACKING');
        setActiveModuleId(moduleId);
        addLog(`Initializing module: ${moduleId.toUpperCase()}`, 'warning');
        addLog(`Target: ${config.target} | Threads: ${config.threads}`, 'info');

        // map internal IDs to backend attack types
        const attackTypeMap = {
            'sql': 'sql_injection',
            'brute': 'brute_force',
            'flood': 'flooding',
            'scan': 'port_scan'
        };

        const payload = {
            sector: "general",
            attack_type: attackTypeMap[moduleId] || "unknown",
            payload: { threads: config.threads, target: config.target }
        };

        try {
            const response = await fetch('http://localhost:3001/attack', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                addLog(`[Backend] Attack routed successfully to ${data.nodes_targeted} nodes`, 'success');
                if (data.results) {
                    data.results.forEach(res => {
                        addLog(`Node ${res.node_id}: ${res.status}`, res.status === 'delivered' ? 'info' : 'error');
                    });
                }
            } else {
                if (data.blocked) {
                    addLog(`[SHIELD] Attack BLOCKED by Defense Engine: ${data.message}`, 'error');
                    setStatus('BLOCKED');
                } else {
                    addLog(`[Backend] Error: ${data.error || 'Unknown error'}`, 'error');
                }
            }

        } catch (e) {
            addLog(`[Network] Failed to contact Gateway: ${e.message}`, 'error');
        }

        // Still keep some visually simulated logs for effect if backend is quiet
        let counter = 0;
        timerRef.current = setInterval(() => {
            counter++;
            const rdm = Math.random();

            // ... keep existing simulation logic for visual feedback ...
            if (moduleId === 'sql') {
                if (rdm > 0.8) addLog(`[SQLi] Injecting payload: ' OR 1=1; --`, 'info');
            }
            else if (moduleId === 'brute') {
                if (rdm > 0.7) addLog(`[Brute] Testing credential batch #${counter}...`, 'info');
            }
        }, 1500);
    };

    const stopAttack = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus('READY');
        setActiveModuleId(null);
        addLog('Attack sequence aborted. Closing connections.', 'error');
        addLog('Server returned to idle state.', 'info');
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-inter selection:bg-[#ccf655] selection:text-black overflow-x-hidden relative">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital,wght@0,400;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; font-feature-settings: "cv11", "ss01"; }
        .font-instrument { font-family: 'Instrument Serif', serif !important; }
        .font-grotesk { font-family: 'Space Grotesk', sans-serif !important; }

        .beam-h { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.03); overflow: hidden; }
        .beam-h::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(to right, transparent, #ccf655, transparent); transform: translateX(-100%); animation: beam-slide 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        .stars {
            background-image: 
                radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: stars-move 120s linear infinite;
            opacity: 0.15;
        }

        @keyframes beam-slide { 0% { transform: translateX(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        @keyframes stars-move { from { transform: translateY(0); } to { transform: translateY(-200px); } }
        
        @keyframes progress-indeterminate {
          0% { transform: translateX(-100%) scaleX(0.2); }
          50% { transform: translateX(0%) scaleX(0.5); }
          100% { transform: translateX(100%) scaleX(0.2); }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s infinite linear;
        }
      `}</style>

            {/* --- Cinematic Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {/* Top Gradient Spot */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ccf655]/10 via-[#050505]/10 to-transparent blur-[120px]"></div>
                {/* Stars */}
                <div className="absolute inset-0 stars"></div>
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_40%,transparent_100%)]"></div>
                {/* Beam */}
                <div className="beam-h top-32"></div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">

                <Header status={status} />

                {/* Configuration */}
                <ConfigPanel
                    config={config}
                    setConfig={setConfig}
                    onPing={handlePing}
                />

                {/* Attack Modules */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 font-mono">
                            <Crosshair size={16} />
                            Infrastructure Vectors
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {SERVER_ATTACKS.map((module) => (
                            <AttackModule
                                key={module.id}
                                module={module}
                                isActive={activeModuleId === module.id}
                                onClick={() => startAttack(module.id)}
                            />
                        ))}

                        {/* Action Area */}
                        {status === 'ATTACKING' && (
                            <button
                                onClick={stopAttack}
                                className="col-span-1 md:col-span-2 lg:col-span-4 mt-2 py-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all flex items-center justify-center gap-3 backdrop-blur-xl group animate-in fade-in slide-in-from-bottom-4"
                            >
                                <AlertOctagon size={24} className="group-hover:scale-110 transition-transform" />
                                Stop Active Server Attack
                            </button>
                        )}
                    </div>
                </div>

                {/* Terminal / Logs */}
                <LogConsole logs={logs} />

                {/* Footer info */}
                <div className="flex justify-between items-center mt-8 pt-8 border-t border-white/5 text-[10px] text-zinc-600 font-mono uppercase">
                    <div className="flex items-center gap-2">
                        <Server size={12} />
                        Infrastructure Target: {config.target || 'UNDEFINED'}
                    </div>
                    <div>Session ID: {Math.random().toString(36).substr(2, 9)}</div>
                </div>

            </div>
        </div>
    );
};

export default AttackSimulation;
