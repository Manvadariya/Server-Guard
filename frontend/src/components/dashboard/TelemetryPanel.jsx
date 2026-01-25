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
        <section className="lg:col-span-6 flex flex-col gap-6">
            {/* Unified Telemetry Card */}
            <div className="min-h-[500px] bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group flex flex-col">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#ccf655]/5 to-transparent opacity-50 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-instrument italic text-white mb-1">Unified Telemetry</h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Real-time Resource Monitoring</p>
                    </div>
                    <div className="flex gap-2">
                        {['1H', '24H', '7D'].map(r => (
                            <button key={r} className="px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 hover:bg-white/10 transition-colors text-zinc-400 hover:text-white">{r}</button>
                        ))}
                    </div>
                </div>

                {/* Metric Summaries */}
                <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-[#ccf655] text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Cpu size={12} /> CPU
                        </div>
                        <div className="text-3xl font-light text-white">{currentMetrics.cpu}%</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-purple-400 text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Server size={12} /> RAM
                        </div>
                        <div className="text-3xl font-light text-white">{currentMetrics.memory}%</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-blue-400 text-[10px] uppercase font-mono tracking-widest font-bold">
                            <Wifi size={12} /> NET
                        </div>
                        <div className="text-3xl font-light text-white">{currentMetrics.net}<span className="text-sm text-zinc-600 ml-1">Mbps</span></div>
                    </div>
                </div>

                {/* Unified Multi-Line Graph */}
                <div className="relative flex-grow bg-black/20 rounded-xl border border-white/5 p-4 z-10 mb-2">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] text-zinc-600 font-mono uppercase">Resource Timeline</span>
                        <div className="flex gap-4 text-[9px] font-mono uppercase">
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-[#ccf655]"></div> CPU</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-purple-400"></div> MEM</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-0.5 bg-blue-400"></div> NET</span>
                        </div>
                    </div>
                    <MultiLineGraph data={telemetryHistory} height={200} />
                </div>
            </div>

            {/* Scrolling Console Stream */}
            <div className="h-64 bg-black border border-white/10 rounded-3xl p-6 font-mono text-xs overflow-hidden relative">
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-10"></div>
                <div className="flex items-center gap-2 mb-4 text-zinc-500 uppercase tracking-widest text-[10px] border-b border-zinc-900 pb-2">
                    <Terminal size={12} /> Request Logs
                </div>
                <div ref={scrollRef} className="h-full overflow-y-auto space-y-1 pb-8 scrollbar-hide">
                    {logs.map(log => (
                        <div key={log.id} className="flex gap-3 text-zinc-500 hover:text-zinc-300 transition-colors">
                            <span className="opacity-50 w-16 shrink-0">{log.ts}</span>
                            <span className="text-[#ccf655] opacity-80">INFO</span>
                            <span className="font-light">{log.msg}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TelemetryPanel;
