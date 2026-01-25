const FadedContainer = ({ children, className = "" }) => (
    <div className={`bg-zinc-900/60 border border-white/10 ring-1 ring-white/5 rounded-3xl shadow-2xl backdrop-blur-xl p-8 md:p-12 lg:p-16 ${className}`}>
        {children}
    </div>
);

export default FadedContainer;
