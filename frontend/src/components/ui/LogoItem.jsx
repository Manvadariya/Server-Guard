import React from 'react';

const LogoItem = ({ src }) => (
    <div className="h-48 px-16 border border-white/5 bg-white/[0.02] rounded-lg flex items-center justify-center shrink-0 hover:border-white/20 hover:bg-white/10 transition-all cursor-default group backdrop-blur-sm">
        <img loading="lazy" src={src} alt="Logo" className="max-h-16 w-auto opacity-60 group-hover:opacity-100 transition-all duration-300 brightness-0 invert" />
    </div>
);

export default LogoItem;
