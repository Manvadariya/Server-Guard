import React from 'react';
import { Server, ShieldCheck } from 'lucide-react';

const NodeSidebar = ({ nodes, selectedNode, onSelectNode }) => {
    return (
        <aside className="lg:col-span-3 bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 shrink-0">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 font-mono">Infrastructure</h3>
                <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md text-zinc-400 font-mono">{nodes.length} Active</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {nodes.map(node => (
                    <button
                        key={node.id}
                        onClick={() => onSelectNode(node.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 group
               ${selectedNode === node.id
                                ? 'bg-[#ccf655]/10 border-[#ccf655]/30'
                                : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {node.type === 'Workstation' && <Server size={14} className={selectedNode === node.id ? 'text-[#ccf655]' : 'text-zinc-500'} />}
                                {node.type === 'Database' && <Server size={14} className={selectedNode === node.id ? 'text-[#ccf655]' : 'text-zinc-500'} />}
                                {node.type === 'Firewall' && <ShieldCheck size={14} className={selectedNode === node.id ? 'text-[#ccf655]' : 'text-zinc-500'} />}
                                <span className={`text-sm font-medium ${selectedNode === node.id ? 'text-white' : 'text-zinc-400'}`}>{node.name}</span>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-600">
                            <span>{node.ip}</span>
                            <span className="uppercase">{node.type}</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="pt-4 border-t border-white/5 shrink-0">
                <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] uppercase text-zinc-500 font-mono">System Health</span>
                        <span className="text-lg font-bold text-emerald-500">100%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-emerald-500"></div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default NodeSidebar;
