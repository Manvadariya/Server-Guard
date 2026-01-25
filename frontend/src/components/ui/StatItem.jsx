import React from 'react';

const StatItem = ({ icon, value, label, isText = false }) => (
    <div className="group flex flex-col gap-3 items-center lg:items-start px-8 transition-all duration-300 hover:bg-white/[0.02] py-4 rounded-xl lg:rounded-none">
        <div className="p-2 rounded-md bg-white/5 text-neutral-500 group-hover:text-[#FACC15] group-hover:bg-[#FACC15]/10 transition-colors mb-2">
            {icon}
        </div>
        <span className={`text-4xl ${isText ? 'lg:text-4xl text-3xl mt-2 lg:mt-3 tracking-tight' : 'lg:text-6xl tracking-tighter'} font-light text-white group-hover:text-[#FACC15] transition-colors duration-300`}>{value}</span>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{label}</span>
    </div>
);

export default StatItem;
