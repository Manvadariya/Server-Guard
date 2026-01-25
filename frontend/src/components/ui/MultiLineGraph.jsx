import React from 'react';

const MultiLineGraph = ({ data, height = 180 }) => {
    if (!data || data.length < 2) return null;

    // Normalize data for display (NET is scaled down to 0-100 range relative to max 600Mbps)
    const normalize = (val, max) => 100 - (Math.min(val, max) / max) * 100;

    const getPoints = (key, maxScale) => {
        return data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = normalize(d[key], maxScale);
            return `${x},${y}`;
        }).join(' ');
    };

    const cpuPoints = getPoints('cpu', 100);
    const memPoints = getPoints('memory', 100);
    const netPoints = getPoints('net', 600); // Assuming 600Mbps max for visualization scaling

    return (
        <div className="w-full overflow-hidden relative" style={{ height: `${height}px` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

                {/* Network Line (Blue) */}
                <polyline points={netPoints} fill="none" stroke="#60a5fa" strokeWidth="1.5" vectorEffect="non-scaling-stroke" opacity="0.5" />

                {/* Memory Line (Purple) */}
                <polyline points={memPoints} fill="none" stroke="#c084fc" strokeWidth="1.5" vectorEffect="non-scaling-stroke" opacity="0.7" />

                {/* CPU Line (Lime - Primary) */}
                <defs>
                    <linearGradient id="grad-cpu" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ccf655" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ccf655" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={`M0,100 ${cpuPoints} 100,100 Z`} fill="url(#grad-cpu)" />
                <polyline points={cpuPoints} fill="none" stroke="#ccf655" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
};

export default MultiLineGraph;
