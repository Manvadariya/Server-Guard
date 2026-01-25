import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import NodeSidebar from '../components/dashboard/NodeSidebar';
import TelemetryPanel from '../components/dashboard/TelemetryPanel';
import AlertsSidebar from '../components/dashboard/AlertsSidebar';

const API_URL = 'http://localhost:3001';

const Dashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [telemetryHistory, setTelemetryHistory] = useState(Array(30).fill({ cpu: 0, memory: 0, net: 0 }));
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [stats, setStats] = useState({ events: 0, blocked: 0 });
    const [socket, setSocket] = useState(null);

    // Initial Fetch & Socket Setup
    useEffect(() => {
        // Fetch initial nodes
        fetch(`${API_URL}/nodes`)
            .then(res => res.json())
            .then(data => {
                if (data.nodes) {
                    setNodes(data.nodes);
                    if (data.nodes.length > 0) setSelectedNode(data.nodes[0].node_id || data.nodes[0].id);
                }
            })
            .catch(err => console.error("Failed to fetch nodes:", err));

        // Socket Connection
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to backend');
        });

        newSocket.on('telemetry', (data) => {
            // Update Telemetry History
            setTelemetryHistory(prev => {
                const newPoint = {
                    cpu: data.metrics.cpu,
                    memory: data.metrics.memory,
                    net: data.metrics.network
                };
                return [...prev.slice(1), newPoint];
            });

            // Add to Logs
            setLogs(prev => [
                ...prev.slice(-20),
                {
                    id: Date.now() + Math.random(),
                    msg: `[${data.deviceName}] CPU:${data.metrics.cpu}% MEM:${data.metrics.memory}%`,
                    ts: new Date().toLocaleTimeString()
                }
            ]);

            // Update Stats (Simulated increment for visual liveliness based on traffic)
            setStats(prev => ({
                events: prev.events + 1,
                blocked: prev.blocked
            }));
        });

        newSocket.on('alert', (alert) => {
            setAlerts(prev => [alert, ...prev].slice(0, 50));
        });

        newSocket.on('ip:blocked', (data) => {
            // Add a critical alert for blocking
            const newAlert = {
                id: Date.now(),
                type: 'critical',
                source: 'Defense Engine',
                msg: `Blocked IP ${data.ip} for ${data.reason}`,
                conf: 99,
                time: 'Just now'
            };
            setAlerts(prev => [newAlert, ...prev].slice(0, 50));

            setStats(prev => ({ ...prev, blocked: prev.blocked + 1 }));
        });

        newSocket.on('attack_routed', (data) => {
            setLogs(prev => [
                ...prev.slice(-20),
                {
                    id: Date.now(),
                    msg: `⚡ ATTACK ROUTED: ${data.attack_type} -> ${data.sector} sector`,
                    ts: new Date().toLocaleTimeString()
                }
            ]);
        });

        return () => newSocket.close();
    }, []);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Derived current metrics
    const currentMetrics = telemetryHistory[telemetryHistory.length - 1] || { cpu: 0, memory: 0, net: 0 };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-inter selection:bg-[#ccf655] selection:text-black overflow-x-hidden relative">
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
            <div className="flex flex-col min-h-screen max-w-[1800px] mx-auto p-4 md:p-6 relative z-10 gap-6">

                <DashboardHeader stats={stats} currentTime={currentTime} />

                {/* Dashboard Grid */}
                <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-8">

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

                    <AlertsSidebar alerts={alerts} />
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
