import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Play, WifiOff } from 'lucide-react';

const AlertsSidebar = ({ alerts, alertCounts, lastPollError }) => {
    const [activeFilter, setActiveFilter] = useState('All');
    
    // Filter alerts based on active filter
    const filteredAlerts = alerts.filter(alert => {
        switch (activeFilter) {
            case 'AI-Gen':
                return alert.isAiGen === true;
            case 'Active':
                return alert.type === 'critical' || alert.type === 'warning';
            case 'Blocked':
                return alert.isBlocked === true;
            case 'All':
            default:
                return true;
        }
    });
    
    return (
        <aside className="lg:col-span-3 flex flex-col gap-6">

            {/* Alerts Panel */}
            <div className="min-h-[500px] bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 font-mono">Active Alerts</h3>
                    <div className="flex gap-2">
                        <span className="text-[10px] px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">{alertCounts?.critical || 0} Crit</span>
                        <span className="text-[10px] px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">{alertCounts?.warning || 0} Warn</span>
                    </div>
                </div>

                {lastPollError && (
                    <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-3">
                        <WifiOff size={14} /> {lastPollError}
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
                    {['All', 'AI-Gen', 'Active', 'Blocked'].map((f) => (
                        <button 
                            key={f} 
                            onClick={() => setActiveFilter(f)}
                            className={`px-3 py-1 rounded-full text-[10px] border whitespace-nowrap transition-all ${
                                activeFilter === f 
                                    ? 'bg-[#ccf655]/20 border-[#ccf655]/40 text-[#ccf655]' 
                                    : 'border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/20'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Alerts List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {filteredAlerts.length === 0 && (
                        <div className="text-center text-zinc-500 text-xs py-8">
                            No alerts match the "{activeFilter}" filter
                        </div>
                    )}
                    {filteredAlerts.map(alert => (
                        <div key={alert.id} className="p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/5 transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {alert.type === 'critical' ? <ShieldAlert size={14} className="text-red-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                                    <span className={`text-xs font-bold ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{alert.source}</span>
                                </div>
                                <span className="text-[10px] text-zinc-600">{alert.time}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{alert.msg}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[10px] text-zinc-500 font-mono">Confidence: <span className="text-[#ccf655]">{alert.conf}%</span></span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:text-[#ccf655] text-zinc-500"><CheckCircle2 size={14} /></button>
                                    <button className="p-1 hover:text-red-500 text-zinc-500"><XCircle size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Defense Playbook Action */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccf655] blur-[80px] opacity-10 pointer-events-none"></div>
                <h3 className="text-lg font-instrument italic text-white mb-2 relative z-10">Automated Defense</h3>
                <p className="text-xs text-zinc-500 mb-6 leading-relaxed relative z-10">
                    SOAR detected 3 actionable threats. Execute pre-approved mitigation playbooks?
                </p>
                <button className="w-full py-4 bg-[#ccf655] hover:bg-[#bce34d] text-black font-bold rounded-xl uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(204,246,85,0.3)] transition-all flex items-center justify-center gap-3 group relative z-10">
                    <Play size={16} className="fill-black group-hover:scale-110 transition-transform" />
                    Run Defense Playbook
                </button>
            </div>

        </aside>
    );
};

export default AlertsSidebar;
