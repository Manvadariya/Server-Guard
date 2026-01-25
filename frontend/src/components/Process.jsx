import React, { useState } from 'react';
import { Minus, ArrowLeft } from 'lucide-react';
import FadedContainer from './ui/FadedContainer';

const Process = () => {
    const [activeTab, setActiveTab] = useState(1);

    const steps = [
        {
            id: 1,
            title: "Telemetry Ingestion",
            content: "High-throughput ingestion of server logs, metrics, and network flows via our lightweight Watchdog Agent. Real-time data stream processing.",
            img: "https://images.unsplash.com/photo-1558494949-efc527049c80?q=80&w=2698&auto=format&fit=crop"
        },
        {
            id: 2,
            title: "AI Threat Detection",
            content: "Our Detection Engine uses Random Forest & Deep Learning models to identify SQL Injection, XSS, and DDoS attacks instantaneously.",
            img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
        },
        {
            id: 3,
            title: "Automated Response",
            content: "The Response Engine triggers SOAR playbooks: blocking malicious IPs, isolating compromised services, and throttling traffic automatically.",
            img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1470&auto=format&fit=crop"
        },
        {
            id: 4,
            title: "Unified Dashboard",
            content: "A single pane of glass for your SOC team. Visualize threats, monitor health, and audit automated defense actions in real-time.",
            img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"
        },
        {
            id: 5,
            title: "Self-Healing Infra",
            content: "The system learns from attacks. Automated recovery protocols ensure your services bounce back without human intervention.",
            img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop"
        }
    ];

    return (
        <section className="bg-[#050505] pt-24 pr-6 pb-24 pl-6" id="process">
            <div className="max-w-[1600px] mx-auto">
                <FadedContainer>
                    <span className="text-xs font-semibold tracking-widest text-neutral-500 uppercase block mb-20">The Architecture</span>

                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative items-start">
                        {/* Sticky Image Column */}
                        <div className="w-full lg:w-5/12 lg:sticky lg:top-32 h-[300px] lg:h-[500px] rounded-2xl overflow-hidden shadow-sm order-2 lg:order-1 hidden lg:block bg-white/5 border border-white/10">
                            <div className="relative w-full h-full">
                                {steps.map((step) => (
                                    <img
                                        key={step.id}
                                        src={step.img}
                                        alt={step.title}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out z-10 ${activeTab === step.id ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/50 to-transparent z-20 pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Accordion List Column */}
                        <div className="w-full lg:w-7/12 flex flex-col order-1 lg:order-2">
                            {steps.map((step) => (
                                <div
                                    key={step.id}
                                    className="border-b py-8 cursor-pointer border-white/10"
                                    onClick={() => setActiveTab(step.id)}
                                >
                                    <div className="flex items-start gap-6 md:gap-12">
                                        <span className={`text-xl font-mono transition-colors pt-2 ${activeTab === step.id ? 'text-white' : 'text-neutral-600'}`}>
                                            {String(step.id).padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 w-full">
                                            <div className="flex justify-between items-start w-full">
                                                <h3 className={`text-2xl md:text-3xl font-medium tracking-tight transition-colors mb-4 ${activeTab === step.id ? 'text-white' : 'text-neutral-500'}`}>
                                                    {step.title}
                                                </h3>
                                                <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ml-4 shrink-0 ${activeTab === step.id ? 'border-white bg-white text-black' : 'border-white/20 bg-transparent text-neutral-500'}`}>
                                                    {activeTab === step.id ? <Minus size={18} /> : <ArrowLeft size={18} className="-rotate-90 transition-transform duration-300" />}
                                                </div>
                                            </div>
                                            <div
                                                className={`grid transition-[grid-template-rows] duration-500 ease-out ${activeTab === step.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                            >
                                                <div className="overflow-hidden">
                                                    <div className={`transition-opacity duration-500 delay-100 ${activeTab === step.id ? 'pt-2 pb-4 opacity-100' : 'pt-0 pb-0 opacity-0'}`}>
                                                        <p className="text-neutral-400 leading-relaxed max-w-lg mb-6 text-base">
                                                            {step.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </FadedContainer>
            </div>
        </section>
    );
};

export default Process;
