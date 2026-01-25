import React from 'react';

const ProfileCard = ({ type, title, desc, icon, isTarget }) => (
    <div className="border-l pl-6 relative border-neutral-800">
        <span className={`font-mono text-xs mb-4 block ${isTarget ? 'text-[#ccf655]' : 'text-neutral-600'}`}>{type}</span>
        <h3 className={`text-lg font-medium mb-3 ${isTarget ? 'text-white' : 'text-neutral-300'}`}>{title}</h3>
        <p className={`text-sm leading-relaxed mb-6 ${isTarget ? 'text-neutral-400' : 'text-neutral-500'}`}>{desc}</p>
        <div className={`w-8 h-8 rounded-full bg-white/10 flex items-center justify-center ${isTarget ? 'text-[#ccf655]' : 'text-neutral-600'}`}>
            {icon}
        </div>
    </div>
);

export default ProfileCard;
