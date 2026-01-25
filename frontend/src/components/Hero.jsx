import React from 'react';
import { ArrowUpRight, Zap, Shield, Activity, Cpu } from 'lucide-react';
import StatItem from './ui/StatItem';
import LogoItem from './ui/LogoItem';

const Hero = () => {
    return (
        <header className="min-h-[100vh] overflow-hidden flex flex-col lg:pt-32 lg:pb-20 selection:bg-[#FACC15] selection:text-black group text-white bg-[#050505] w-full pt-20 pb-12 relative">
            {/* Background Component */}
            <div className="bg-[#050505] z-0 absolute top-0 right-0 bottom-0 left-0">
                {/* Spotlight Gradient */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[800px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FACC15]/10 via-[#050505]/10 to-transparent blur-[120px] pointer-events-none"></div>
                {/* Stars */}
                <div className="absolute inset-0 stars pointer-events-none"></div>
                {/* Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,black_40%,transparent_100%)] pointer-events-none"></div>
            </div>

            {/* Unicorn Studio Script Injection & Container */}
            <div className="aura-background-component fixed top-0 w-full h-screen z-0 pointer-events-none" data-alpha-mask="80" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 0%, black 80%, transparent)' }}>
                <div className="aura-background-component top-0 w-full -z-10 absolute h-full">
                    <div data-us-project="bKN5upvoulAmWvInmHza" className="absolute w-full h-full left-0 top-0 -z-10"></div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow min-h-screen z-10 w-full max-w-[1600px] mx-auto px-6 relative gap-12 items-start">
                <div className="lg:col-span-12 flex flex-col lg:mt-0 text-center w-full mt-20 relative items-center justify-start">

                    {/* Typography */}
                    <div className="flex flex-col items-center w-full max-w-5xl mx-auto mb-24 lg:mb-32 relative z-10 fade-in-up">
                        <div className="flex items-center gap-3 mb-10 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-[#FACC15] rounded-full shadow-[0_0_10px_#FACC15] animate-pulse"></div>
                            <span className="uppercase text-[10px] text-[#FACC15] tracking-[0.25em] font-mono leading-none pt-0.5">System v1.0 // Active</span>
                        </div>

                        <h1 className="md:text-7xl lg:text-8xl bg-clip-text leading-[0.95] text-5xl font-medium text-transparent tracking-tighter bg-gradient-to-b from-white via-white to-zinc-500 max-w-4xl mx-auto py-4 delay-100">
                            Active Defense
                        </h1>

                        <p className="text-lg md:text-xl text-neutral-400 font-light max-w-lg leading-relaxed mb-12 delay-200">
                            <span className="text-white font-normal">(The SOAR Platform for Modern Infrastructure)</span>. ML-driven threat detection and automated response for enterprise resilience.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center items-center delay-300">
                            <a href="#features" className="group relative px-8 py-4 bg-white text-black font-medium text-sm uppercase tracking-wider overflow-hidden hover:bg-[#FACC15] transition-colors duration-300 border border-transparent rounded-sm">
                                <span className="relative z-10 flex items-center gap-2">
                                    Deploy Shield
                                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </span>
                            </a>
                            <div className="px-8 py-4 border border-white/10 text-neutral-500 font-mono text-xs uppercase tracking-wider flex items-center gap-3 hover:border-[#FACC15]/30 hover:text-neutral-300 transition-colors cursor-default rounded-sm bg-white/[0.02]">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Sentinel Online
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="w-full border-t border-white/10 pt-16 pb-20 max-w-[1400px] fade-in-up delay-300">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-x-0 lg:divide-x divide-white/5">
                            <StatItem icon={<Zap size={20} />} value="<2ms" label="Latency" />
                            <StatItem icon={<Shield size={20} />} value="99.9%" label="Uptime" />
                            <StatItem icon={<Activity size={20} />} value="24/7" label="Monitoring" />
                            <StatItem icon={<Cpu size={20} />} value="AI-Core" label="Detection" isText />
                        </div>
                    </div>

                    {/* Social Proof */}
                    <div className="flex flex-col gap-8 fade-in-up delay-500 w-full border-white/10 border-t pt-10 relative items-center">
                        <div className="flex flex-col gap-2 text-center items-center z-10 relative">
                            <span className="text-[10px] uppercase text-neutral-600 tracking-[0.25em] font-mono">Trusted By</span>
                            <h3 className="text-xl font-medium tracking-tight text-white">Securing Infrastructure <span className="text-neutral-500">Globally</span></h3>
                        </div>

                        <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)] py-4 overflow-hidden">
                            <div className="flex gap-8 animate-scroll-logos w-max">
                                {[...Array(2)].map((_, setIndex) => (
                                    <React.Fragment key={setIndex}>
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/1200px-Node.js_logo.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1200px-Python-logo-notext.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Kubernetes_logo_without_workmark.svg/1200px-Kubernetes_logo_without_workmark.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Amazon_Web_Services_Logo.svg/1200px-Amazon_Web_Services_Logo.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Go_Logo_Blue.svg/1200px-Go_Logo_Blue.svg.png" />
                                        <LogoItem src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Postgresql_elephant.svg/1200px-Postgresql_elephant.svg.png" />
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission Card */}
            <div className="flex flex-col min-h-screen lg:px-12 selection:bg-[#FACC15] selection:text-black z-20 overflow-hidden transition-all duration-500 group bg-zinc-900/60 w-full max-w-[1600px] border-white/10 border ring-white/5 ring-1 rounded-3xl mx-auto pt-24 pr-6 pb-12 pl-6 relative shadow-2xl backdrop-blur-xl justify-between mt-20">
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-50"></div>
                    <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[80%] h-[600px] bg-[#FACC15]/5 blur-[120px] rounded-full mix-blend-screen opacity-60"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#FACC15]/5 blur-[100px] rounded-full mix-blend-screen opacity-40"></div>
                </div>

                <div className="flex w-full justify-start relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-lg shadow-black/20 hover:border-[#FACC15]/30 transition-colors cursor-default">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FACC15] shadow-[0_0_8px_#FACC15] animate-pulse"></div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-400">Mission Protocol</span>
                    </div>
                </div>

                <div className="max-w-[95rem] mt-auto mb-auto relative z-10 py-12">
                    <h2 className="text-4xl md:text-6xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[1.0] md:leading-[0.95] tracking-tighter font-medium text-white/20 select-none transition-all duration-700">
                        <span className="text-white drop-shadow-lg">We engineer cyber-resilience</span> for mission-critical systems.
                        <span className="text-white hover:text-[#FACC15] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-default inline-block origin-bottom font-semibold px-2">Active Defense</span>
                        over passive monitoring. Using automated
                        <span className="text-white hover:text-[#FACC15] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-default inline-block origin-bottom font-semibold px-2">SOAR playbooks</span>
                        and real-time
                        <span className="text-white hover:text-[#FACC15] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-default inline-block origin-bottom font-semibold px-2">telemetry ingestion</span>,
                        we ensure your infrastructure remains
                        <span className="text-white hover:text-[#FACC15] hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] transition-all duration-300 cursor-default inline-block origin-bottom font-semibold px-2">uncompromised</span>.
                    </h2>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full border-t border-white/5 bg-[#050505]/80 backdrop-blur-md z-20">
                <div className="beam-h top-0"></div>
            </div>
        </header>
    );
};

export default Hero;
