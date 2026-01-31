import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, XCircle, WifiOff, Shield, Ban, Clock, Server, RotateCcw } from 'lucide-react';
import { API_CONFIG } from '../../config/api';

// Use API config for production/development flexibility
const RESPONSE_ENGINE_URL = API_CONFIG.RESPONSE_ENGINE;

const AlertsSidebar = ({ alerts, alertCounts, lastPollError }) => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [soarStatus, setSoarStatus] = useState(null);
    
    // Filter alerts based on active filter and reverse to show latest first
    const filteredAlerts = alerts
        .filter(alert => {
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
        })
        .slice()
        .reverse(); // Reverse to show latest alerts first
    
    // Fetch SOAR status on mount and periodically
    useEffect(() => {
        const fetchSoarStatus = async () => {
            try {
                const res = await fetch(`${RESPONSE_ENGINE_URL}/api/soar/status`);
                if (res.ok) {
                    const data = await res.json();
                    setSoarStatus(data);
                }
            } catch (e) {
                // Response engine might not be running
            }
        };
        
        fetchSoarStatus();
        const interval = setInterval(fetchSoarStatus, 5000); // Every 5 seconds for real-time updates
        return () => clearInterval(interval);
    }, []);
    
    // Emergency unblock all
    const unblockAll = async () => {
        if (!confirm('This will remove ALL active defenses. Continue?')) return;
        
        try {
            const res = await fetch(`${RESPONSE_ENGINE_URL}/api/soar/unblock-all`, {
                method: 'POST'
            });
            
            if (res.ok) {
                const data = await res.json();
                alert(`Defenses cleared: ${data.unblocked_ips?.length || 0} IPs unblocked`);
                setSoarStatus(null);
                setUnblockTime(null);
            }
        } catch (e) {
            alert('Failed to clear defenses. Response Engine may be offline.');
        }
    };
    
    return (
        <aside className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">

            {/* Alerts Panel */}
            <div className="flex-1 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between mb-4 shrink-0">
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
                            <div className="text-2xl mb-2">🛡️</div>
                            <div className="font-medium mb-1">No alerts match "{activeFilter}"</div>
                            <div className="text-[10px] text-zinc-600">System is operating normally</div>
                        </div>
                    )}
                    {filteredAlerts.map(alert => (
                        <div key={alert.id} className={`p-4 rounded-xl border transition-all group ${
                            alert.type === 'critical' 
                                ? 'bg-red-950/20 border-red-500/20 hover:bg-red-950/30' 
                                : 'bg-amber-950/20 border-amber-500/20 hover:bg-amber-950/30'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    {alert.type === 'critical' ? <ShieldAlert size={14} className="text-red-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                                    <span className={`text-xs font-bold uppercase tracking-wide ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                        {alert.type === 'critical' ? 'Critical' : 'Warning'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-mono">{alert.time}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-zinc-400 font-mono">{alert.source}</span>
                                {alert.isAiGen && (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 font-mono">AI</span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-300 mb-3 leading-relaxed">{alert.msg}</p>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                        Confidence: <span className={alert.conf >= 80 ? 'text-red-400' : alert.conf >= 50 ? 'text-amber-400' : 'text-[#ccf655]'}>{alert.conf}%</span>
                                    </span>
                                    {alert.isBlocked && (
                                        <span className="text-[10px] px-2 py-0.5 bg-red-500/20 rounded text-red-300 font-mono">BLOCKED</span>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-1 hover:text-[#ccf655] text-zinc-500" title="Mark as resolved"><CheckCircle2 size={14} /></button>
                                    <button className="p-1 hover:text-red-500 text-zinc-500" title="Dismiss alert"><XCircle size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Defense Status Panel - Shows auto-blocked threats */}
            <div className="shrink-0 bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-2xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#ccf655] blur-[60px] opacity-10 pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[#ccf655]" />
                        <h3 className="text-sm font-semibold text-white relative z-10">Auto-Defense Status</h3>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                        soarStatus?.total_blocked > 0 || soarStatus?.total_throttled > 0
                            ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                            : 'bg-zinc-700/50 text-zinc-500'
                    }`}>
                        {soarStatus?.total_blocked > 0 || soarStatus?.total_throttled > 0 ? 'ACTIVE' : 'MONITORING'}
                    </span>
                </div>
                
                <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed relative z-10">
                    Threats are automatically blocked by the AI detection engine.
                </p>
                
                {/* Defense Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 relative z-10">
                    <div className={`flex flex-col items-center p-2.5 rounded-lg border transition-colors ${
                        soarStatus?.total_blocked > 0 
                            ? 'bg-red-500/20 border-red-500/30' 
                            : 'bg-white/5 border-white/10'
                    }`}>
                        <Ban size={16} className={soarStatus?.total_blocked > 0 ? 'text-red-400' : 'text-zinc-600'} />
                        <span className={`text-lg font-bold font-mono mt-1 ${soarStatus?.total_blocked > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                            {soarStatus?.total_blocked || 0}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">BLOCKED</span>
                    </div>
                    <div className={`flex flex-col items-center p-2.5 rounded-lg border transition-colors ${
                        soarStatus?.total_throttled > 0 
                            ? 'bg-amber-500/20 border-amber-500/30' 
                            : 'bg-white/5 border-white/10'
                    }`}>
                        <Clock size={16} className={soarStatus?.total_throttled > 0 ? 'text-amber-400' : 'text-zinc-600'} />
                        <span className={`text-lg font-bold font-mono mt-1 ${soarStatus?.total_throttled > 0 ? 'text-amber-400' : 'text-zinc-600'}`}>
                            {soarStatus?.total_throttled || 0}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">THROTTLED</span>
                    </div>
                    <div className={`flex flex-col items-center p-2.5 rounded-lg border transition-colors ${
                        soarStatus?.total_quarantined > 0 
                            ? 'bg-purple-500/20 border-purple-500/30' 
                            : 'bg-white/5 border-white/10'
                    }`}>
                        <Server size={16} className={soarStatus?.total_quarantined > 0 ? 'text-purple-400' : 'text-zinc-600'} />
                        <span className={`text-lg font-bold font-mono mt-1 ${soarStatus?.total_quarantined > 0 ? 'text-purple-400' : 'text-zinc-600'}`}>
                            {soarStatus?.total_quarantined || 0}
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">QUARANTINED</span>
                    </div>
                </div>
                
                {/* Blocked IPs List */}
                {soarStatus?.active_blocks && soarStatus.active_blocks.length > 0 && (
                    <div className="mb-3 p-2 bg-black/40 rounded-lg border border-white/5 max-h-20 overflow-y-auto">
                        <div className="text-[9px] font-mono text-zinc-500 mb-1">Blocked IPs:</div>
                        {soarStatus.active_blocks.map((ip, i) => (
                            <div key={i} className="text-[9px] font-mono text-red-400 flex items-center gap-1">
                                <Ban size={10} /> {ip}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Rate Limited IPs */}
                {soarStatus?.active_rate_limits && Object.keys(soarStatus.active_rate_limits).length > 0 && (
                    <div className="mb-3 p-2 bg-black/40 rounded-lg border border-white/5 max-h-20 overflow-y-auto">
                        <div className="text-[9px] font-mono text-zinc-500 mb-1">Rate Limited:</div>
                        {Object.entries(soarStatus.active_rate_limits).map(([ip, limit], i) => (
                            <div key={i} className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                                <Clock size={10} /> {ip} ({limit} req/min)
                            </div>
                        ))}
                    </div>
                )}
                
                {/* No Active Defenses */}
                {(!soarStatus || (soarStatus.total_blocked === 0 && soarStatus.total_throttled === 0)) && (
                    <div className="p-3 bg-zinc-800/30 rounded-lg border border-white/5 text-center">
                        <CheckCircle2 size={20} className="text-[#ccf655] mx-auto mb-1" />
                        <div className="text-[10px] font-mono text-zinc-400">No Active Threats</div>
                        <div className="text-[9px] text-zinc-600">System is monitoring for attacks</div>
                    </div>
                )}
                
                {/* Emergency Unblock - Only show when defenses are active */}
                {soarStatus && (soarStatus.total_blocked > 0 || soarStatus.total_throttled > 0) && (
                    <button 
                        onClick={unblockAll}
                        className="w-full mt-3 py-2 font-medium rounded-lg text-[9px] text-zinc-400 hover:text-white border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 relative z-10"
                    >
                        <RotateCcw size={12} />
                        Emergency: Clear All Blocks
                    </button>
                )}
            </div>

        </aside>
    );
};

export default AlertsSidebar;
