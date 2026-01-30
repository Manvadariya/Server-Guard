import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
    Zap,
    Home,
    LayoutDashboard,
    ChevronRight
} from 'lucide-react';
import { API_CONFIG } from '../config/api';

// --- Simulation Data & Helpers ---

const INITIAL_LOGS = [
    { ts: '00:00:01', type: 'system', msg: '[INIT] Security Operations Console v3.1.0 starting...' },
    { ts: '00:00:01', type: 'info', msg: '[KERNEL] Linux 5.15.0-generic x86_64 loaded successfully' },
    { ts: '00:00:02', type: 'success', msg: '[NETWORK] Secure uplink established — RTT: 12ms, jitter: 2ms' },
    { ts: '00:00:02', type: 'info', msg: '[MODULE] Loading AI defense infrastructure...' },
    { ts: '00:00:03', type: 'success', msg: '[AI] Web Gatekeeper model initialized (accuracy: 98.2%)' },
    { ts: '00:00:03', type: 'success', msg: '[AI] Network Shield model initialized (accuracy: 97.8%)' },
    { ts: '00:00:04', type: 'warning', msg: '[AUTH] Elevated privileges granted — Session ID: 0x7F3A9C' },
    { ts: '00:00:04', type: 'info', msg: '[MONITOR] Real-time threat detection active' },
    { ts: '00:00:05', type: 'info', msg: '[STATUS] System ready — Awaiting simulation parameters...' },
];

const SERVER_ATTACKS = [
    { id: 'sql', name: 'SQL Injection', icon: Database, color: 'text-blue-400', desc: 'OWASP A03:2021 — Injection attack targeting database layer via malicious SQL queries.' },
    { id: 'brute', name: 'Brute Force', icon: Lock, color: 'text-orange-400', desc: 'OWASP A07:2021 — Automated credential stuffing against authentication endpoints.' },
    { id: 'flood', name: 'DDoS Attack', icon: Activity, color: 'text-purple-400', desc: 'MITRE ATT&CK T1498 — Volumetric network flood to exhaust server resources.' },
    { id: 'scan', name: 'Port Scan', icon: Search, color: 'text-[#ccf655]', desc: 'MITRE ATT&CK T1046 — Network reconnaissance scanning for open services.' },
];

// Attack payload helpers (mirrors simulation_driver.py)
const SQL_PAYLOADS = [
    "' OR 1=1 --",
    "UNION SELECT username, password FROM users",
    "admin' --",
    "1; DROP TABLE production_logs",
    "' OR '1'='1",
    "SELECT * FROM data WHERE id=1 OR 1=1"
];

// Industry-standard log message templates
const LOG_TEMPLATES = {
    sql: [
        (payload) => `[SQLi] Payload injected: ${payload.substring(0, 30)}...`,
        () => `[SQLi] Attempting authentication bypass via tautology`,
        () => `[SQLi] Probing for UNION-based extraction vectors`,
        () => `[SQLi] Testing error-based injection on input field`,
        () => `[WAF] Signature match: SQL injection pattern detected`,
    ],
    brute: [
        (n) => `[AUTH] Failed login attempt #${n} — user: admin, src: 192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        () => `[AUTH] Rate limit threshold exceeded — 50 req/min`,
        () => `[AUTH] Credential stuffing pattern detected`,
        () => `[AUTH] Geographic anomaly — Login from unexpected region`,
        () => `[LOCKOUT] Account temporarily locked after failed attempts`,
    ],
    flood: [
        (threads) => `[DDoS] SYN flood detected — ${threads * 50} packets/sec`,
        () => `[DDoS] UDP amplification attack in progress`,
        () => `[NET] Bandwidth saturation: 94% capacity utilized`,
        () => `[NET] Connection pool exhausted — new connections queued`,
        () => `[ALERT] Service degradation detected — latency spike to 4200ms`,
    ],
    scan: [
        () => `[RECON] TCP SYN scan detected from external host`,
        (port) => `[RECON] Port ${port} probed — service: ${port === 22 ? 'SSH' : port === 443 ? 'HTTPS' : port === 3306 ? 'MySQL' : 'Unknown'}`,
        () => `[RECON] OS fingerprinting attempt via TTL analysis`,
        () => `[RECON] Service version enumeration in progress`,
        () => `[IDS] Nmap signature detected — scan type: SYN stealth`,
    ]
};

const generate_network_stats = (mode) => {
    if (mode === "ddos") {
        return {
            Rate: 8000 + Math.random() * 42000,
            syn_count: 100 + Math.floor(Math.random() * 200),
            IAT: 0.001 + Math.random() * 0.05,
            "Tot size": 64 + Math.random() * 64
        };
    } else if (mode === "heavy_load") {
        return {
            Rate: 2000 + Math.random() * 2500,
            syn_count: 5 + Math.floor(Math.random() * 15),
            IAT: 0.1 + Math.random() * 0.4,
            "Tot size": 500 + Math.random() * 1000
        };
    } else if (mode === "scan") {
        return {
            Rate: 500 + Math.random() * 1000,
            syn_count: 200 + Math.floor(Math.random() * 300),
            IAT: 0.01 + Math.random() * 0.05,
            "Tot size": 40 + Math.random() * 24
        };
    } else {
        return {
            Rate: 10 + Math.random() * 790,
            syn_count: Math.floor(Math.random() * 4),
            IAT: 1.0 + Math.random() * 4.0,
            "Tot size": 200 + Math.random() * 1000
        };
    }
};

const generate_server_metrics = (mode) => {
    if (mode === "crash") {
        return { cpu_usage: 96 + Math.floor(Math.random() * 5), ram_usage: 90 + Math.floor(Math.random() * 10) };
    } else if (mode === "busy") {
        return { cpu_usage: 50 + Math.floor(Math.random() * 30), ram_usage: 40 + Math.floor(Math.random() * 20) };
    } else {
        return { cpu_usage: 5 + Math.floor(Math.random() * 25), ram_usage: 20 + Math.floor(Math.random() * 20) };
    }
};

// --- Components ---

const Header = ({ status }) => (
    <div className="relative z-10">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
            <div className="flex items-center gap-6">
                <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                    <Home size={14} className="group-hover:text-[#ccf655]" />
                    <span className="text-xs font-mono uppercase tracking-wider">Home</span>
                </Link>
                <ChevronRight size={12} className="text-zinc-700" />
                <Link to="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
                    <LayoutDashboard size={14} className="group-hover:text-[#ccf655]" />
                    <span className="text-xs font-mono uppercase tracking-wider">Dashboard</span>
                </Link>
                <ChevronRight size={12} className="text-zinc-700" />
                <span className="flex items-center gap-2 text-[#ccf655]">
                    <Terminal size={14} />
                    <span className="text-xs font-mono uppercase tracking-wider">Simulation</span>
                </span>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center gap-3 bg-zinc-900/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                <div className="text-right">
                    <div className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest font-mono">Status</div>
                    <div className={`text-sm font-medium font-mono tracking-widest ${status === 'ATTACKING' ? 'text-red-500 animate-pulse' : 'text-[#ccf655]'}`}>
                        {status}
                    </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'ATTACKING' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-[#ccf655] shadow-[0_0_10px_#ccf655]'}`}></div>
            </div>
        </nav>
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-1.5 bg-[#ccf655] rounded-full shadow-[0_0_10px_#ccf655] animate-pulse"></div>
                    <span className="uppercase text-[10px] text-[#ccf655] tracking-[0.25em] font-mono leading-none pt-0.5">Server Ops v3.1 // Online</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white font-instrument italic">
                    Server Attack Console.
                </h1>
            </div>
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

// Use centralized API configuration
const DEFAULT_TARGET = API_CONFIG.API_GATEWAY;

const AttackSimulation = () => {
    const [status, setStatus] = useState('READY');
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [logs, setLogs] = useState(INITIAL_LOGS);
    const [config, setConfig] = useState({
        target: DEFAULT_TARGET, // Empty in production (uses relative /api)
        requests: 10000,
        threads: 64
    });

    const timerRef = useRef(null);

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    const addLog = (msg, type = 'info') => {
        const now = new Date();
        const ts = now.toTimeString().split(' ')[0];
        setLogs(prev => [...prev.slice(-100), { ts, msg, type }]);
    };

    const handlePing = () => {
        addLog(`[PROBE] Initiating health check to ${config.target || 'backend API'}`, 'system');

        // In production, use relative /api path; in dev, use full URL
        const baseUrl = config.target ? config.target.replace(/\/$/, '') : '';
        const apiUrl = `${baseUrl}/api/analyze`;
        const probePayload = {
            service_type: 'ping_test',
            payload: "PING",
            network_data: { Rate: 200, syn_count: 1, IAT: 1.2 },
            server_metrics: { cpu_usage: 10 }
        };

        fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(probePayload)
        })
            .then(res => res.json())
            .then(data => {
                addLog(`[PROBE] Response received — Status: ${(data.status || 'unknown').toUpperCase()} | Threat Level: ${data.threat_level || 'low'} | Web Score: ${data.web_ai_score ?? 'N/A'} | Net Score: ${data.net_ai_score ?? 'N/A'}`, 'success');
            })
            .catch(() => addLog('[ERROR] Connection refused — AI endpoint unreachable at ' + apiUrl, 'error'));
    };

    const startAttack = async (moduleId) => {
        if (status === 'ATTACKING') return;

        const attackNames = { sql: 'SQL Injection', brute: 'Brute Force', flood: 'DDoS Attack', scan: 'Port Scan' };
        
        setStatus('ATTACKING');
        setActiveModuleId(moduleId);
        addLog(`[ATTACK] Initializing ${attackNames[moduleId] || moduleId.toUpperCase()} simulation module`, 'warning');
        addLog(`[CONFIG] Target: ${config.target || 'backend API'} | Concurrency: ${config.threads} threads | Requests: ${config.requests}`, 'info');

        // In production, use relative /api path; in dev, use full URL
        const baseUrl = config.target ? config.target.replace(/\/$/, '') : '';
        const apiUrl = `${baseUrl}/api/analyze`;

        // Build ML-friendly payloads to mirror simulation_driver.py
        const attackPayloads = {
            sql: {
                service_type: 'web_frontend',
                attack_type: 'sql_injection',
                payload: SQL_PAYLOADS[Math.floor(Math.random() * SQL_PAYLOADS.length)],
                network_data: generate_network_stats('normal'),
                server_metrics: generate_server_metrics('normal')
            },
            brute: {
                service_type: 'auth_service',
                attack_type: 'brute_force',
                payload: 'LOGIN_ATTEMPT',
                auth_data: {
                    username: 'admin',
                    failed_attempts: 150 + Math.floor(Math.random() * 100),
                    attempt_rate: 50 + Math.floor(Math.random() * 30)
                },
                network_data: generate_network_stats('heavy_load'),
                server_metrics: generate_server_metrics('busy')
            },
            flood: {
                service_type: 'api_gateway',
                attack_type: 'ddos',
                payload: 'TCP_FLOW_DATA_ONLY',
                network_data: generate_network_stats('ddos'),
                server_metrics: generate_server_metrics('busy')  // Not 'crash' - let Network Shield detect DDoS
            },
            scan: {
                service_type: 'network_scanner',
                attack_type: 'port_scan',
                payload: 'NMAP_SYN_SCAN',
                scan_data: {
                    ports_scanned: 1000 + Math.floor(Math.random() * 64000),
                    scan_rate: 500 + Math.floor(Math.random() * 500),
                    syn_packets: 200 + Math.floor(Math.random() * 300)
                },
                network_data: generate_network_stats('scan'),
                server_metrics: generate_server_metrics('normal')
            }
        };

        try {
            const res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attackPayloads[moduleId] || attackPayloads.sql)
            });

            const data = await res.json();

            if (res.ok) {
                const aiStatus = data.status || 'allowed';
                const aiThreat = data.threat_level || 'low';
                const webScore = data.web_ai_score !== undefined ? (data.web_ai_score * 100).toFixed(1) + '%' : 'N/A';
                const netScore = data.net_ai_score !== undefined ? (data.net_ai_score * 100).toFixed(1) + '%' : 'N/A';
                
                if (aiStatus === 'blocked') {
                    addLog(`[AI-DEFENSE] \u26A0\uFE0F THREAT BLOCKED | Source: ${data.source || 'AI Model'} | Threat Level: ${aiThreat.toUpperCase()} | Web Confidence: ${webScore} | Net Confidence: ${netScore}`, 'error');
                    setStatus('BLOCKED');
                } else {
                    addLog(`[AI-DEFENSE] \u2714\uFE0F REQUEST ALLOWED | Source: ${data.source || 'AI Model'} | Threat Level: ${aiThreat.toUpperCase()} | Web Score: ${webScore} | Net Score: ${netScore}`, 'success');
                }

                setTimeout(() => {
                    // Clear any running interval when attack completes
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    setStatus('READY');
                    setActiveModuleId(null);
                    addLog('[STATUS] Simulation complete \u2014 System returned to monitoring state', 'info');
                }, 1200);
            } else {
                addLog(`[ERROR] AI service returned error: ${data.error || res.statusText}`, 'error');
                // Clear interval on error
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setStatus('READY');
                setActiveModuleId(null);
            }

        } catch (e) {
            addLog(`[WARNING] AI endpoint unavailable \u2014 Running in offline simulation mode`, 'warning');
            // Don't clear interval on network error - let simulation continue
        }

        // --- SIMULATION MODE (Or Visual Feedback) ---
        // Clear any existing interval before starting a new one
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        let counter = 0;
        const maxIterations = 15; // Limit the number of log entries
        
        timerRef.current = setInterval(() => {
            counter++;
            
            // Auto-stop after maxIterations
            if (counter >= maxIterations) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                return;
            }
            
            // Use professional log templates
            const templates = LOG_TEMPLATES[moduleId] || LOG_TEMPLATES.sql;
            const templateIndex = counter % templates.length;
            const template = templates[templateIndex];
            
            // Generate contextual log messages
            if (moduleId === 'sql') {
                const payload = SQL_PAYLOADS[Math.floor(Math.random() * SQL_PAYLOADS.length)];
                addLog(template(payload), counter % 3 === 0 ? 'warning' : 'info');
            }
            else if (moduleId === 'brute') {
                addLog(template(counter * 10 + Math.floor(Math.random() * 10)), counter % 4 === 0 ? 'warning' : 'info');
            }
            else if (moduleId === 'flood') {
                addLog(template(config.threads), counter % 5 === 0 ? 'error' : 'warning');
            }
            else if (moduleId === 'scan') {
                const ports = [22, 80, 443, 3306, 5432, 8080, 27017];
                const port = ports[Math.floor(Math.random() * ports.length)];
                addLog(template(port), counter % 3 === 0 ? 'success' : 'info');
            }

        }, 800);
    };

    const stopAttack = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setStatus('READY');
        setActiveModuleId(null);
        addLog('[ABORT] Attack simulation terminated by operator', 'error');
        addLog('[STATUS] All connections closed \u2014 System returning to idle state', 'info');
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
