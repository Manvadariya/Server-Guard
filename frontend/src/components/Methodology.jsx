import React from 'react';
import { Activity, Layers, Lock } from 'lucide-react';
import FadedContainer from './ui/FadedContainer';
import FeatureCard from './ui/FeatureCard';

const Methodology = () => (
    <section className="bg-[#050505] pt-24 pr-6 pb-24 pl-6" id="features">
        <div className="max-w-[1600px] mx-auto">
            <FadedContainer>
                <div className="mb-16 md:flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-4 text-white">The Security Gap</h2>
                        <p className="text-neutral-400 max-w-md">Traditional monitoring is passive. You need active defense.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FeatureCard
                        icon={<Activity size={24} />}
                        title="Reactive Failures"
                        desc="Traditional tools alert you only after the CPU spikes or the database crashes. By then, the damage is already done."
                    />
                    <FeatureCard
                        icon={<Layers size={24} />}
                        title="Tool Fragmentation"
                        desc="Running Prometheus for metrics and Splunk for logs creates blind spots. Unified telemetry is the only way to see the full attack surface."
                    />
                    <FeatureCard
                        icon={<Lock size={24} />}
                        title="Slow Response"
                        desc="Manual intervention takes minutes. Attacks take milliseconds. Automated SOAR playbooks are essential for survival."
                    />
                </div>
            </FadedContainer>
        </div>
    </section>
);

export default Methodology;
