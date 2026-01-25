import React from 'react';

const IntelligenceGrid = () => {
    const handleMouseMove = (e) => {
        // using event delegation for the cards
        // The snippet assumes each child is a card
        for (const card of e.currentTarget.children) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }
    };

    return (
        <section className="bg-[#050505] pt-12 pr-6 pb-0 pl-6 relative z-10">
            <div className="max-w-[1600px] mx-auto">
                <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-0 border-t border-l border-white/5"
                    onMouseMove={handleMouseMove}
                >

                    {/* Card 1: Predictive Models */}
                    <div className="col-span-1 lg:col-span-2 group flex flex-col overflow-hidden transition-all hover:bg-white/[0.02] bg-zinc-900/50 border-r border-b border-white/5 rounded-none pt-8 pr-8 pb-8 pl-8 relative backdrop-blur-md justify-between" style={{ animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) both', '--mouse-x': '0px', '--mouse-y': '0px' }}>
                        {/* Hover Gradients */}
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)', zIndex: 0 }}></div>
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.4), transparent 40%)', zIndex: 0, padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

                        <div className="flex h-48 mb-6 relative items-center justify-center">
                            {/* Improved Neural Network Visual */}
                            <div className="relative w-full h-full max-w-[240px] flex items-center justify-center">
                                <svg width="240" height="160" viewBox="0 0 240 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                    {/* Connecting Lines with Dash Animation */}
                                    <g stroke="url(#paint0_linear)" strokeWidth="1" strokeOpacity="0.3">
                                        <path d="M40 40 L120 40" className="animate-dash" strokeDasharray="4 4"></path>
                                        <path d="M40 40 L120 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.1s' }}></path>
                                        <path d="M40 40 L120 120" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.2s' }}></path>

                                        <path d="M40 80 L120 40" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.3s' }}></path>
                                        <path d="M40 80 L120 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.4s' }}></path>
                                        <path d="M40 80 L120 120" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.5s' }}></path>

                                        <path d="M40 120 L120 40" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.6s' }}></path>
                                        <path d="M40 120 L120 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.7s' }}></path>
                                        <path d="M40 120 L120 120" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.8s' }}></path>

                                        <path d="M120 40 L200 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.2s' }}></path>
                                        <path d="M120 80 L200 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.4s' }}></path>
                                        <path d="M120 120 L200 80" className="animate-dash" strokeDasharray="4 4" style={{ animationDelay: '0.6s' }}></path>
                                    </g>

                                    {/* Input Nodes */}
                                    <circle cx="40" cy="40" r="4" fill="#6366f1" style={{ animation: 'pulse-node 2s infinite' }}></circle>
                                    <circle cx="40" cy="80" r="4" fill="#6366f1" style={{ animation: 'pulse-node 2s infinite 0.3s' }}></circle>
                                    <circle cx="40" cy="120" r="4" fill="#6366f1" style={{ animation: 'pulse-node 2s infinite 0.6s' }}></circle>

                                    {/* Hidden Nodes */}
                                    <circle cx="120" cy="40" r="5" fill="#a855f7" style={{ animation: 'pulse-node 2s infinite 0.9s' }}></circle>
                                    <circle cx="120" cy="80" r="5" fill="#a855f7" style={{ animation: 'pulse-node 2s infinite 1.2s' }}></circle>
                                    <circle cx="120" cy="120" r="5" fill="#a855f7" style={{ animation: 'pulse-node 2s infinite 1.5s' }}></circle>

                                    {/* Output Node */}
                                    <circle cx="200" cy="80" r="8" fill="#10b981" stroke="rgba(255,255,255,0.2)" strokeWidth="2" style={{ animation: 'pulse-node 2s infinite 1.8s' }}></circle>

                                    <defs>
                                        <linearGradient id="paint0_linear" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#6366F1" stopOpacity="0.2"></stop>
                                            <stop offset="0.5" stopColor="#A855F7" stopOpacity="0.6"></stop>
                                            <stop offset="1" stopColor="#10B981" stopOpacity="0.8"></stop>
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Floating Labels */}
                                <div className="absolute top-4 left-0 text-[10px] font-mono uppercase tracking-wider text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded">Input</div>
                                <div className="absolute bottom-4 right-0 text-[10px] font-mono uppercase tracking-wider text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">Output</div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-medium text-white mb-2 tracking-tight flex items-center gap-2">Predictive Models</h3>
                            <p className="text-sm text-white/50 font-light leading-relaxed">Deploy custom predictive models trained on your specific business data patterns.</p>
                        </div>
                    </div>

                    {/* Card 2: Risk Scores */}
                    <div className="col-span-1 lg:col-span-2 group flex flex-col overflow-hidden transition-all hover:bg-white/[0.02] bg-zinc-900/50 border-r border-b border-white/5 rounded-none pt-8 pr-8 pb-8 pl-8 relative backdrop-blur-md justify-between" style={{ animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) both', '--mouse-x': '0px', '--mouse-y': '0px' }}>
                        {/* Hover Gradients */}
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)', zIndex: 0 }}></div>
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.4), transparent 40%)', zIndex: 0, padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

                        <div className="w-full max-w-[280px] space-y-4 relative z-10">
                            {/* Risk Item 1 */}
                            <div className="relative group/item">
                                <div className="flex items-center justify-between mb-1.5 text-xs z-10 relative">
                                    <span className="font-medium text-white">j.parker@co.com</span>
                                    <span className="font-mono text-red-400">98.2</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-600 to-orange-500 rounded-full w-[98.2%] origin-left" style={{ animation: 'scale-loop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite', animationDelay: '0s' }}></div>
                                </div>
                            </div>

                            {/* Risk Item 2 */}
                            <div className="relative group/item opacity-80">
                                <div className="flex items-center justify-between mb-1.5 text-xs z-10 relative">
                                    <span className="font-medium text-white/80">a.lee@inc.io</span>
                                    <span className="font-mono text-yellow-400">45.0</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full w-[45%] origin-left" style={{ animation: 'scale-loop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite', animationDelay: '0.2s' }}></div>
                                </div>
                            </div>

                            {/* Risk Item 3 */}
                            <div className="relative group/item opacity-60">
                                <div className="flex items-center justify-between mb-1.5 text-xs z-10 relative">
                                    <span className="font-medium text-white/80">m.scott@paper.com</span>
                                    <span className="font-mono text-green-400">12.4</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full w-[12.4%] origin-left" style={{ animation: 'scale-loop 4s cubic-bezier(0.4, 0, 0.2, 1) infinite', animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8">
                            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Risk Scores</h3>
                            <p className="text-sm text-white/50 font-light leading-relaxed">Instant risk scoring for every user and account, updated in real-time.</p>
                        </div>
                    </div>

                    {/* Card 3: Retention Forecasting */}
                    <div className="col-span-1 lg:col-span-2 group flex flex-col overflow-hidden transition-all hover:bg-white/[0.02] bg-zinc-900/50 border-r border-b border-white/5 rounded-none pt-8 pr-8 pb-8 pl-8 relative backdrop-blur-md justify-between" style={{ animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) both', '--mouse-x': '0px', '--mouse-y': '0px' }}>
                        {/* Hover Gradients */}
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)', zIndex: 0 }}></div>
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.4), transparent 40%)', zIndex: 0, padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

                        <div className="flex h-48 mb-6 pr-2 pb-4 pl-2 relative items-end justify-center">
                            {/* Chart Visual */}
                            <div className="relative w-full h-32 border-l border-b border-white/10 group-hover:border-white/20 transition-colors">
                                {/* Forecast Line */}
                                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <path d="M0 100 L20 80 L40 85 L60 50 L80 40 L100 20 L100 100 Z" fill="none"></path>
                                    <path d="M0 100 L20 80 L40 85 L60 50 L80 40 L100 20" fill="none" stroke="#a855f7" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeDasharray="200" style={{ animation: 'draw-chart-loop 5s ease-in-out infinite' }}></path>
                                    {/* Dotted Future Prediction */}
                                    <path d="M100 20 L120 15 L140 10" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="100" opacity="0.6" vectorEffect="non-scaling-stroke" style={{ animation: 'draw-chart-dash-loop 5s ease-in-out infinite' }} className=""></path>
                                    {/* Point */}
                                    <circle cx="100" cy="20" r="3" fill="#fff"></circle>
                                </svg>

                                <div className="absolute -top-6 right-0 text-[10px] px-2 py-0.5 rounded-full border font-mono shadow-sm bg-yellow-500/10 text-yellow-300 border-yellow-500/20">
                                    +14.5% proj
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-lg font-medium text-white mb-2 tracking-tight">Retention Forecasting</h3>
                            <p className="text-sm text-white/50 font-light leading-relaxed">Forecast user retention cohorts with high accuracy using historical patterns.</p>
                        </div>
                    </div>

                    {/* Card 4: AI Pipelines Editor (Wide) */}
                    <div className="col-span-1 lg:col-span-3 group flex flex-col overflow-hidden transition-all hover:bg-white/[0.02] bg-zinc-900/50 border-r border-b border-white/5 rounded-none pt-8 pr-8 pb-8 pl-8 relative backdrop-blur-md justify-between" style={{ minHeight: '320px', animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) both', '--mouse-x': '0px', '--mouse-y': '0px' }}>
                        {/* Hover Gradients */}
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)', zIndex: 0 }}></div>
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.4), transparent 40%)', zIndex: 0, padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

                        <div className="flex-1 flex mb-8 relative items-center justify-center">
                            {/* Improved Pipeline UI */}
                            <div className="flex overflow-hidden bg-zinc-900/50 w-full h-48 border-white/5 border rounded-xl pr-8 pl-8 relative items-center justify-between">

                                {/* Background Grid Effect */}
                                <div className="[mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)] pointer-events-none absolute top-0 right-0 bottom-0 left-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                                {/* Source Node (Left) */}
                                <div className="relative z-10 w-16 h-16 bg-zinc-800 border border-white/10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
                                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 relative z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
                                    </div>
                                </div>

                                {/* Connecting Noodles (Beam Animation) */}
                                <div className="flex-1 h-full relative px-0 mx-[-1px]">
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 192">
                                        <defs>
                                            <linearGradient id="grad-orange-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#f97316"></stop>
                                                <stop offset="100%" stopColor="#3b82f6"></stop>
                                            </linearGradient>
                                            <linearGradient id="grad-orange-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#f97316"></stop>
                                                <stop offset="100%" stopColor="#a855f7"></stop>
                                            </linearGradient>
                                        </defs>

                                        {/* Top Noodle (Base + Beam) */}
                                        <path d="M0,96 C50,96 50,68 100,68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                        <path d="M0,96 C50,96 50,68 100,68" fill="none" stroke="url(#grad-orange-blue)" strokeWidth="2" strokeLinecap="round" strokeDasharray="30 200" vectorEffect="non-scaling-stroke">
                                            <animate attributeName="stroke-dashoffset" from="230" to="0" dur="2.5s" repeatCount="indefinite"></animate>
                                        </path>

                                        {/* Bottom Noodle (Base + Beam) */}
                                        <path d="M0,96 C50,96 50,124 100,124" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
                                        <path d="M0,96 C50,96 50,124 100,124" fill="none" stroke="url(#grad-orange-purple)" strokeWidth="2" strokeLinecap="round" strokeDasharray="30 200" vectorEffect="non-scaling-stroke">
                                            <animate attributeName="stroke-dashoffset" from="230" to="0" dur="3s" repeatCount="indefinite"></animate>
                                        </path>
                                    </svg>
                                </div>

                                {/* Process Nodes (Right) */}
                                <div className="flex flex-col h-full justify-between py-[40px] relative z-10">
                                    {/* Process Node 1 */}
                                    <div className="flex transition-transform duration-300 hover:scale-105 bg-zinc-800 w-10 h-10 border-white/10 border rounded-xl shadow-lg items-center justify-center">
                                        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 relative z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-cpu"><rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path><path d="M2 15h2"></path><path d="M2 9h2"></path><path d="M20 15h2"></path><path d="M20 9h2"></path><path d="M9 2v2"></path><path d="M9 20v2"></path></svg>
                                        </div>
                                    </div>

                                    {/* Process Node 2 */}
                                    <div className="flex transition-transform duration-300 hover:scale-105 bg-zinc-800 w-10 h-10 border-white/10 border rounded-xl shadow-lg items-center justify-center">
                                        <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 relative z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3" className=""></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <h3 className="text-xl font-medium text-white mb-2 tracking-tight">AI Pipelines Editor</h3>
                            <p className="text-sm text-white/50 font-light leading-relaxed max-w-md">Drag-and-drop editor to build and customize your AI data pipelines without writing code.</p>
                        </div>
                    </div>

                    {/* Card 5: Automated Mitigation (Wide) */}
                    <div className="col-span-1 lg:col-span-3 group flex flex-col overflow-hidden transition-all hover:bg-white/[0.02] bg-zinc-900/50 border-r border-b border-white/5 rounded-none pt-8 pr-8 pb-8 pl-8 relative backdrop-blur-md justify-between" style={{ minHeight: '320px', animation: 'reveal-up 1s cubic-bezier(0.16, 1, 0.3, 1) both', '--mouse-x': '0px', '--mouse-y': '0px' }}>
                        {/* Hover Gradients */}
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.06), transparent 40%)', zIndex: 0 }}></div>
                        <div className="pointer-events-none absolute -inset-px rounded-none opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.4), transparent 40%)', zIndex: 0, padding: '1px', mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', maskComposite: 'exclude' }}></div>

                        <div className="relative flex-1 mb-8 flex items-center justify-center">
                            {/* Improved Terminal/Activity Log */}
                            <div className="w-full max-w-sm border border-white/10 bg-black/40 rounded-lg overflow-hidden backdrop-blur-sm shadow-xl">
                                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    <div className="ml-auto text-[10px] text-white/30 font-mono">activity.log</div>
                                </div>
                                <div className="p-4 space-y-3 font-mono text-[11px] leading-relaxed">
                                    <div className="flex gap-2" style={{ animation: 'type-loop-1 6s steps(30, end) infinite' }}>
                                        <span className="text-green-500">✓</span>
                                        <span className="text-white/80">Cluster scaling initiated</span>
                                        <span className="text-white/30 ml-auto">12:04:45</span>
                                    </div>
                                    <div className="flex gap-2" style={{ animation: 'type-loop-2 6s steps(30, end) infinite' }}>
                                        <span className="text-green-500">✓</span>
                                        <span className="text-white/80">Redis cache cleared</span>
                                        <span className="text-white/30 ml-auto">12:04:42</span>
                                    </div>
                                    <div className="flex gap-2 opacity-60" style={{ animation: 'type-loop-3 6s steps(30, end) infinite' }}>
                                        <span className="text-yellow-500 animate-pulse">●</span>
                                        <span className="text-white/80">Optimizing shards...</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-auto">
                            <h3 className="text-xl font-medium text-white mb-2 tracking-tight">Automated Mitigation</h3>
                            <p className="text-sm text-white/50 font-light leading-relaxed max-w-md">Trigger preventative workflows and route alerts to the right engineers before incidents escalate.</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default IntelligenceGrid;
