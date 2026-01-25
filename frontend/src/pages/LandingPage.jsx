import React, { useEffect } from 'react';
import Navigation from '../components/Navigation';
import Hero from '../components/Hero';
import Methodology from '../components/Methodology';
import IntelligenceGrid from '../components/IntelligenceGrid';
import Process from '../components/Process';
import Trust from '../components/Trust';
import Fit from '../components/Fit';
import Footer from '../components/Footer';

const LandingPage = () => {
    useEffect(() => {
        // Inject Unicorn Studio Script
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
        script.async = true;
        script.onload = () => {
            if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
                window.UnicornStudio.init();
                window.UnicornStudio.isInitialized = true;
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="antialiased selection:bg-[#ccf655] selection:text-black bg-[#050505] text-neutral-200 font-inter">
            {/* Styles & Fonts */}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;500;600;700&family=Instrument+Serif:ital,wght@0,400;1,400&family=Space+Grotesk:wght@300;400;500;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; font-feature-settings: "cv11", "ss01"; background-color: #050505; }
        .font-playfair { font-family: 'Playfair Display', serif !important; }
        .font-instrument { font-family: 'Instrument Serif', serif !important; }
        .font-grotesk { font-family: 'Space Grotesk', sans-serif !important; }
        
        .beam-h { position: absolute; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.03); overflow: hidden; }
        .beam-h::after { content: ''; position: absolute; top: 0; left: 0; bottom: 0; right: 0; background: linear-gradient(to right, transparent, #FACC15, transparent); transform: translateX(-100%); animation: beam-slide 6s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        .stars {
            background-image: 
                radial-gradient(1px 1px at 20px 30px, #fff, rgba(0,0,0,0)),
                radial-gradient(1.5px 1.5px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 50px 160px, #fff, rgba(0,0,0,0)),
                radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.8), rgba(0,0,0,0)),
                radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 200px 200px;
            animation: stars-move 120s linear infinite;
            opacity: 0.15;
        }

        @keyframes beam-slide { 0% { transform: translateX(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        @keyframes stars-move { from { transform: translateY(0); } to { transform: translateY(-200px); } }
        
        .fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
        
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll-logos { animation: scroll 80s linear infinite; }
        .animate-scroll-logos:hover { animation-play-state: paused; }

        @keyframes reveal-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-node { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }
        @keyframes scale-loop { 0% { transform: scaleX(0); } 100% { transform: scaleX(1); } }
        @keyframes draw-chart-loop { 0% { stroke-dashoffset: 200; } 40%, 100% { stroke-dashoffset: 0; } }
        @keyframes draw-chart-dash-loop { 0% { stroke-dashoffset: 100; } 40%, 100% { stroke-dashoffset: 0; } }
        @keyframes type-loop-1 { 0% { opacity: 0; transform: translateY(5px); } 5%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes type-loop-2 { 0% { opacity: 0; transform: translateY(5px); } 15%, 20%, 100% { opacity: 1; transform: translateY(0); } }
        @keyframes type-loop-3 { 0% { opacity: 0; transform: translateY(5px); } 30%, 35%, 100% { opacity: 1; transform: translateY(0); } }
        .animate-dash { animation: dash 1s linear infinite; }
        @keyframes dash { to { stroke-dashoffset: -8; } }
      `}</style>

            <Navigation />
            <Hero />
            <Methodology />
            <IntelligenceGrid />
            <Process />
            <Trust />
            <Fit />
            <Footer />
        </div>
    );
};

export default LandingPage;
