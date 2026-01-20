export default function Loading() {
    return (
        <div className="fixed inset-0 bg-radisson-light/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-fade-in">
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-16 h-16 rounded-full border-4 border-radisson-gold/20 border-t-radisson-gold animate-spin" />

                {/* Inner static logo or dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-radisson-blue rounded-full animate-pulse" />
                </div>
            </div>

            <p className="mt-6 text-[10px] font-black text-radisson-blue uppercase tracking-[0.4em] animate-pulse">
                Chargement...
            </p>
        </div>
    );
}
