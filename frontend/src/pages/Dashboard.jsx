import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import NodeSidebar from '../components/dashboard/NodeSidebar';
import TelemetryPanel from '../components/dashboard/TelemetryPanel';
import AlertsSidebar from '../components/dashboard/AlertsSidebar';
import { API_CONFIG, buildApiUrl } from '../config/api';

// Use centralized API configuration
const API_URL = API_CONFIG.API_GATEWAY;

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [telemetryHistory, setTelemetryHistory] = useState(Array(30).fill({ cpu: 0, memory: 0, net: 0 }));
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [stats, setStats] = useState({ events: 0, blocked: 0 });
    const [lastPollError, setLastPollError] = useState(null);
    // Poll model microservice dashboard for real detections
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch(`${API_URL}/api/dashboard`);
                const data = await res.json();
                setLastPollError(null);

                // Format service names for better readability
                const formatService = (service) => {
                    const serviceMap = {
                        'web_frontend': 'Web Frontend',
                        'auth_service': 'Auth Service',
                        'api_gateway': 'API Gateway',
                        'network_scanner': 'Network Scanner',
                        'ping_test': 'Health Check',
                        'unknown': 'System'
                    };
                    return serviceMap[service] || service;
                };

                // Format attack types for display
                const formatAttack = (attack) => {
                    const attackMap = {
                        'sql_injection': 'SQL Injection detected',
                        'brute_force': 'Brute force attempt',
                        'ddos': 'DDoS attack detected',
                        'port_scan': 'Port scan detected',
                        'xss': 'XSS attempt detected'
                    };
                    return attackMap[attack] || attack || 'Request processed';
                };

                const normalizedLogs = (data.logs || []).map(l => {
                    const service = formatService(l.service || 'unknown');
                    const attackType = l.attack_type ? formatAttack(l.attack_type) : '';
                    const statusText = l.status === 'blocked' ? '⛔ Blocked' : l.status === 'warning' ? '⚠️ Warning' : '✅ Allowed';
                    
                    // Build professional message
                    let message = attackType || l.message || statusText;
                    if (l.threat_level && l.threat_level !== 'low') {
                        message += ` — Threat: ${l.threat_level.toUpperCase()}`;
                    }
                    
                    return {
                        id: l.id || Date.now() + Math.random(),
                        msg: message,
                        ts: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
                        status: l.status,
                        score: l.score,
                        threat: l.threat_level,
                        source: service,
                        is_ai_gen: l.is_ai_gen || false
                    };
                }).slice(-50);

                setLogs(normalizedLogs);

                // Derive alerts from blocked/warning entries
                const derivedAlerts = normalizedLogs
                    .filter(l => l.status === 'blocked' || l.status === 'warning')
                    .map(l => ({
                        id: l.id,
                        type: l.status === 'blocked' ? 'critical' : 'warning',
                        source: l.source || 'AI Defense',
                        msg: l.msg,
                        conf: Math.round((l.score || 0) * 100),
                        time: l.ts,
                        isAiGen: l.is_ai_gen || false,
                        isBlocked: l.status === 'blocked'
                    }));
                setAlerts(derivedAlerts);

                // Update stats
                setStats({
                    events: data.total_logs || normalizedLogs.length,
                    blocked: derivedAlerts.filter(a => a.type === 'critical').length
                });

                // Telemetry history: basic signal derived from log volume
                const cpu = Math.min(99, 10 + (normalizedLogs.length % 70));
                const memory = 40 + ((normalizedLogs.length * 3) % 40);
                const net = 50 + ((normalizedLogs.length * 5) % 300);
                setTelemetryHistory(prev => [...prev.slice(1), { cpu, memory, net }]);

                // Nodes: single detection engine target
                setNodes([{
                    id: 'model-microservice',
                    name: 'Detection Engine',
                    ip: '127.0.0.1:8006',
                    type: 'Firewall',
                    status: 'online'
                }]);
                setSelectedNode('model-microservice');

            } catch (e) {
                console.error('Dashboard poll failed', e);
                setLastPollError('Model service unreachable');
            }
        };

        poll();
        const interval = setInterval(poll, 2000);
        return () => clearInterval(interval);
    }, []);

    const alertCounts = {
        critical: alerts.filter(a => a.type === 'critical').length,
        warning: alerts.filter(a => a.type === 'warning').length
    };

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Derived current metrics
    const currentMetrics = telemetryHistory[telemetryHistory.length - 1] || { cpu: 0, memory: 0, net: 0 };

    return (
        <div className="h-screen bg-[#050505] text-white font-inter selection:bg-[#ccf655] selection:text-black overflow-hidden relative flex flex-col">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Instrument+Serif:ital,wght@0,400;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; font-feature-settings: "cv11", "ss01"; }
        .font-instrument { font-family: 'Instrument Serif', serif !important; }
        .font-grotesk { font-family: 'Space Grotesk', sans-serif !important; }

        /* Cinematic Background Elements */
        .beam-h { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.03); overflow: hidden; }
        .beam-h::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(to right, transparent, #ccf655, transparent); transform: translateX(-100%); animation: beam-slide 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        .stars {
            background-image: 
                radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.8), rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: stars-move 120s linear infinite;
            opacity: 0.15;
        }

        @keyframes beam-slide { 0% { transform: translateX(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        @keyframes stars-move { from { transform: translateY(0); } to { transform: translateY(-200px); } }
      `}</style>

            {/* --- Background --- */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ccf655]/10 via-[#050505]/10 to-transparent blur-[120px]"></div>
                <div className="absolute inset-0 stars"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_40%,transparent_100%)]"></div>
                <div className="beam-h top-24"></div>
            </div>

            {/* --- Main Content --- */}
            <div className="flex flex-col flex-1 max-w-[1800px] w-full mx-auto p-4 md:p-6 relative z-10 gap-4 overflow-hidden">

                <DashboardHeader stats={stats} currentTime={currentTime} />

                {/* Dashboard Grid */}
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">

                    <NodeSidebar
                        nodes={nodes}
                        selectedNode={selectedNode}
                        onSelectNode={setSelectedNode}
                    />

                    <TelemetryPanel
                        telemetryHistory={telemetryHistory}
                        currentMetrics={currentMetrics}
                        logs={logs}
                    />

                    <AlertsSidebar alerts={alerts} alertCounts={alertCounts} lastPollError={lastPollError} />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
