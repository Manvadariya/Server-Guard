import React from 'react';
import { Shield, Activity, Server } from 'lucide-react';
import FadedContainer from './ui/FadedContainer';
import ProfileCard from './ui/ProfileCard';

const Fit = () => (
    <section id="defense" className="py-24 px-6 bg-[#050505]">
        <div className="max-w-[1600px] mx-auto">
            <FadedContainer>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-2 text-white">Defense Capabilities</h2>
                        <p className="text-neutral-400">Precision engineering for every threat vector.</p>
                    </div>
                    <button className="text-sm border-b pb-1 transition-colors border-neutral-700 hover:border-white text-left text-neutral-300">View Docs</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ProfileCard
                        type="THREAT VECTOR"
                        title="SQL Injection"
                        desc="Detects and blocks malicious SQL queries in real-time using advanced NLP models."
                        icon={<Shield size={16} />}
                        isTarget={true}
                    />
                    <ProfileCard
                        type="THREAT VECTOR"
                        title="DDoS Mitigation"
                        desc="Identifies volumetric attacks via flow analysis and automatically triggers traffic throttling."
                        icon={<Activity size={16} />}
                        isTarget={true}
                    />
                    <ProfileCard
                        type="THREAT VECTOR"
                        title="Resource Abuse"
                        desc="Monitors CPU/RAM spikes to detect runaway processes or crypto-mining malware."
                        icon={<Server size={16} />}
                        isTarget={true}
                    />

                    <div className="border-l pl-6 relative border-neutral-800 bg-white/5 rounded-r-2xl py-6 pr-6">
                        <span className="font-mono text-xs mb-4 block text-white">NEXT STEP</span>
                        <h3 className="text-3xl font-medium mb-1 text-white">Secure</h3>
                        <p className="text-sm font-medium mb-3 text-neutral-300">Your Infrastructure</p>
                        <p className="text-sm leading-relaxed text-neutral-400 mb-6">Start monitoring your servers in less than 5 minutes.</p>
                        <button className="text-xs px-4 py-2 rounded bg-white text-black hover:bg-neutral-200 transition-colors uppercase tracking-wide font-semibold">Get Access</button>
                    </div>
                </div>
            </FadedContainer>
        </div>
    </section>
);

export default Fit;
