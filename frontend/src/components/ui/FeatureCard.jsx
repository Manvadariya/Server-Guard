import React from 'react';

const FeatureCard = ({ icon, title, desc }) => (
    <div className="p-8 group transition-colors bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-6 bg-white/10 text-[#ccf655]">
            {icon}
        </div>
        <h3 className="text-lg font-medium tracking-tight mb-2 text-white">{title}</h3>
        <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
    </div>
);

export default FeatureCard;
