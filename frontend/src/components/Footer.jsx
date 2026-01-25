import React from 'react';
import { Globe, Mail, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => (
    <footer className="bg-[#050505] pt-16 pb-8 px-6 border-t border-white/10">
        <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                <div className="col-span-1 md:col-span-2">
                    <a href="#" className="text-lg font-semibold tracking-widest uppercase block mb-6 font-instrument italic text-white">Server Guard.</a>
                    <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">
                        The active defense platform for modern infrastructure. Secure, automated, and resilient.
                    </p>
                </div>
                <div>
                    <h4 className="font-medium text-sm mb-4 text-white">Platform</h4>
                    <ul className="space-y-3 text-sm text-neutral-500">
                        <li><Link to="/dashboard" className="transition-colors hover:text-white">Dashboard</Link></li>
                        <li><a href="#" className="transition-colors hover:text-white">Documentation</a></li>
                        <li><a href="#" className="transition-colors hover:text-white">API Status</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-medium text-sm mb-4 text-white">Contact</h4>
                    <ul className="space-y-3 text-sm text-neutral-500">
                        <li className="flex items-center gap-2">
                            <Globe size={14} /> Global
                        </li>
                        <li className="flex items-center gap-2">
                            <Mail size={14} /> support@serverguard.ai
                        </li>
                    </ul>
                </div>
            </div>

            <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 border-white/10">
                <p className="text-xs text-neutral-500">© 2024 Server Guard. All rights reserved.</p>
                <div className="flex gap-4">
                    <a href="#" className="transition-colors text-neutral-500 hover:text-white">
                        <Github size={18} />
                    </a>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
