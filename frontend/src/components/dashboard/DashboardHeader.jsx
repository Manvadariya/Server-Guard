import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Home, Crosshair, LayoutDashboard } from 'lucide-react';

const DashboardHeader = ({ stats, currentTime }) => {
    return (
        <header className="flex items-center justify-between px-6 py-3 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-full shadow-2xl shrink-0">
            <div className="flex items-center gap-4">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <ShieldCheck className="text-[#ccf655]" size={24} />
                    <span className="text-xl font-instrument italic tracking-wide text-white hidden sm:inline">Server Guard</span>
                </Link>
                <div className="h-6 w-px bg-white/10 mx-2 hidden md:block"></div>
                
                {/* Navigation Links */}
                <nav className="flex items-center gap-1">
                    <Link 
                        to="/" 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                    >
                        <Home size={14} />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                    <Link 
                        to="/dashboard" 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ccf655]/10 text-[#ccf655] border border-[#ccf655]/20 text-xs font-medium"
                    >
                        <LayoutDashboard size={14} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <Link 
                        to="/simulation" 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                    >
                        <Crosshair size={14} />
                        <span className="hidden sm:inline">Simulation</span>
                    </Link>
                </nav>
                
                <div className="h-6 w-px bg-white/10 mx-2 hidden lg:block"></div>
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#ccf655]/10 border border-[#ccf655]/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#ccf655] animate-pulse"></div>
                    <span className="text-[10px] font-mono font-bold text-[#ccf655] uppercase tracking-wider">Online</span>
                </div>
            </div>

            <div className="flex items-center gap-8 hidden md:flex">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Event Throughput</span>
                    <span className="text-sm font-mono text-white">{stats.events.toLocaleString()}/s</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Threats Blocked</span>
                    <span className="text-sm font-mono text-[#ccf655]">{stats.blocked}</span>
                </div>
                <div className="flex flex-col items-end pl-8 border-l border-white/10">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-mono uppercase">{currentTime.toLocaleDateString()}</span>
                    </div>
                    <span className="text-sm font-mono text-white tabular-nums">{currentTime.toLocaleTimeString()}</span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
