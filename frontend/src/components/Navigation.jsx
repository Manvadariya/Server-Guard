import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed z-50 flex transition-all duration-300 w-full px-4 top-6 right-0 left-0 justify-center`}>
            <div className={`flex shadow-black/50 bg-zinc-900/80 w-full max-w-4xl border-white/10 border rounded-full py-2 pl-6 pr-2 shadow-2xl backdrop-blur-xl items-center justify-between transition-all duration-300`}>
                <a href="#" className="flex items-center gap-2 text-xl font-medium tracking-tight text-white hover:opacity-80 transition-opacity">
                    <span className="font-instrument italic text-2xl">Server Guard.</span>
                </a>

                <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
                    <a href="#features" className="transition-colors hover:text-white flex items-center gap-1 group">
                        Features
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#ccf655]" />
                    </a>
                    <a href="#process" className="transition-colors hover:text-white group flex items-center gap-1">
                        How It Works
                    </a>
                    <a href="#defense" className="transition-colors hover:text-white group flex items-center gap-1">
                        Defense Matrix
                    </a>
                    <Link to="/dashboard" className="transition-colors hover:text-white group flex items-center gap-1">
                        Dashboard
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/simulation" className="hidden md:inline-flex items-center justify-center bg-[#ccf655] text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#bce34d] transition-colors shadow-[0_0_20px_rgba(204,246,85,0.3)]">
                        Live Demo
                    </Link>

                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-3 rounded-full hover:bg-white/10 text-white hover:text-[#ccf655] transition-colors"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="absolute top-20 left-4 right-4 bg-zinc-900 border border-white/10 rounded-2xl p-6 flex flex-col gap-4 md:hidden shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-4">
                    <a href="#features" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white font-medium py-2">Features</a>
                    <a href="#process" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white font-medium py-2">How It Works</a>
                    <a href="#defense" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white font-medium py-2">Defense Matrix</a>
                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white font-medium py-2">Dashboard</Link>
                    <Link to="/simulation" onClick={() => setIsOpen(false)} className="bg-[#ccf655] text-black text-center py-3 rounded-xl font-semibold hover:bg-[#bce34d] transition-colors">
                        Live Demo
                    </Link>
                </div>
            )}
        </nav>
    );
};

export default Navigation;
