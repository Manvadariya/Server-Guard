import React, { useRef, useEffect } from 'react';
import { Cpu, Server, Wifi, Terminal } from 'lucide-react';
import MultiLineGraph from '../ui/MultiLineGraph';

const TelemetryPanel = ({ telemetryHistory, currentMetrics, logs }) => {
    const scrollRef = useRef(null);

    // Auto-scroll logs
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs]);

    return (
        <section className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
            {/* Unified Telemetry Card */}
            <div className="flex-1 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 relative overflow-hidden group flex flex-col min-h-0">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ccf655]/5 to-transparent opacity-50 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-4 relative z-10 shrink-0">
                    <div>
                        <h2 className="text-xl font-instrument italic text-white mb-0.5">Unified Telemetry</h2>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Real-time Monitoring</p>
                    </div>
                    <div className="flex gap-1">
                        {['1H', '24H', '7D'].map(r => (
                            <button key={r} className="px-2 py-1 rounded-md text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">{r}</button>
                        ))}
                    </div>
                </div>

                {/* Metric Summaries */}
                <div className="grid grid-cols-3 gap-3 mb-4 relative z-10 shrink-0">
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1 text-[#ccf655] text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Cpu size={12} /> CPU
                        </div>
                        <div className="text-2xl font-light text-white">{currentMetrics.cpu}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1 text-purple-400 text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Server size={12} /> RAM
                        </div>
                        <div className="text-2xl font-light text-white">{currentMetrics.memory}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1 text-blue-400 text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Wifi size={12} /> NET
                        </div>
                        <div className="text-2xl font-light text-white">{currentMetrics.net}<span className="text-xs text-zinc-600 ml-1">Mbps</span></div>
                    </div>
                </div>

                {/* Unified Multi-Line Graph */}
                <div className="relative flex-1 bg-black/20 rounded-xl border border-white/5 p-3 z-10 min-h-0">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">Resource Timeline</span>
                        <div className="flex gap-3 text-[9px] font-mono uppercase">
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#ccf655]"></div> CPU</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-purple-400"></div> MEM</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-blue-400"></div> NET</span>
                        </div>
                    </div>
                    <MultiLineGraph data={telemetryHistory} height={140} />
                </div>
            </div>

            {/* Scrolling Console Stream */}
            <div className="h-48 shrink-0 bg-black border border-white/10 rounded-3xl p-4 font-mono text-xs overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black to-transparent pointer-events-none z-10"></div>
                <div className="flex items-center gap-2 mb-2 text-zinc-500 uppercase tracking-widest text-[10px] border-b border-zinc-900 pb-2">
                    <Terminal size={12} /> Event Stream
                </div>
                <div ref={scrollRef} className="h-full overflow-y-auto space-y-1 pb-6 scrollbar-hide">
                    {logs.map(log => {
                        // Determine log level styling
                        const isBlocked = log.status === 'blocked';
                        const isWarning = log.status === 'warning' || log.threat === 'medium';
                        const isError = isBlocked || log.threat === 'critical';
                        const levelColor = isError ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-[#ccf655]';
                        const levelText = isError ? 'ALERT' : isWarning ? 'WARN' : 'INFO';
                        
                        return (
                            <div key={log.id} className="flex gap-3 text-zinc-500 hover:text-zinc-300 transition-colors group">
                                <span className="opacity-50 w-16 shrink-0 tabular-nums">{log.ts}</span>
                                <span className={`${levelColor} opacity-80 w-12 shrink-0 font-semibold`}>{levelText}</span>
                                <span className={`font-light ${isError ? 'text-red-300' : isWarning ? 'text-amber-200' : ''}`}>
                                    {log.source && <span className="text-zinc-600">[{log.source}]</span>} {log.msg}
                                </span>
                                {log.score !== undefined && (
                                    <span className="ml-auto text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        conf: {(log.score * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        );
                    })}
                    {logs.length === 0 && (
                        <div className="text-zinc-600 text-center py-8">
                            <div className="mb-2">No events recorded</div>
                            <div className="text-[10px]">Run an attack simulation to see real-time logs</div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default TelemetryPanel;
