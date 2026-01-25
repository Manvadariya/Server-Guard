import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import FadedContainer from './ui/FadedContainer';

const Trust = () => (
    <section className="py-24 px-6 bg-[#050505]">
        <div className="max-w-[1600px] mx-auto">
            <FadedContainer>
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="lg:w-1/2">
                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden relative bg-white/5 border border-white/10">
                            <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop" alt="Server Rack" className="w-full h-full object-cover grayscale opacity-80 hover:scale-105 transition-transform duration-700" />
                            <div className="absolute bottom-6 left-6 backdrop-blur px-4 py-2 rounded-md border bg-black/50 border-white/20">
                                <p className="text-xs font-medium text-white">Secure Infrastructure</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-medium tracking-tighter mb-6 text-white">
                            Why automate your <span className="text-neutral-500">server defense?</span>
                        </h2>
                        <div className="space-y-6 text-sm md:text-base leading-relaxed max-w-lg text-neutral-400">
                            <p>
                                Human reaction time is measured in minutes. Automated attacks happen in milliseconds. To survive modern threats, your defense must be faster than the attacker.
                            </p>
                            <p>
                                Server Guard bridges the gap between monitoring and action. We don't just tell you something is wrong; we fix it before your users even notice.
                            </p>
                        </div>
                        <div className="mt-10 flex gap-4">
                            {["Zero Latency", "AI Powered", "Self Healing"].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white">
                                    <CheckCircle2 size={16} className="text-[#ccf655]" /> {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </FadedContainer>
        </div>
    </section>
);

export default Trust;
