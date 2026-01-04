"use client";
import { useState, useEffect } from "react";
import { Share, X, Download } from "lucide-react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [show, setShow] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed/standalone
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(isStandaloneMode);
        if (isStandaloneMode) return;

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Detect Installable (Android/Desktop)
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // For iOS, just show it (maybe with a delay or sessionStorage check to not annoy)
        // For demo/user request "Where is the link?", show immediately if iOS
        if (isIosDevice) {
            setShow(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShow(false);
        }
    };

    if (!show || isStandalone) return null;

    return (
        <div className="fixed bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[110] bg-radisson-blue text-white p-4 rounded-2xl shadow-2xl border border-white/20 animate-fade-in-up">
            <button onClick={() => setShow(false)} className="absolute top-2 right-2 text-white/60 hover:text-white p-1">
                <X size={16} />
            </button>

            <div className="flex items-center gap-4 pr-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-radisson-blue font-black text-xl">R</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">Installer l'Application</h3>
                    <p className="text-[10px] text-white/80 leading-tight mt-1">
                        Accédez au menu plus rapidement depuis votre écran d'accueil.
                    </p>
                </div>
            </div>

            {isIOS ? (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/90 space-y-2">
                    <p className="flex items-center gap-2">
                        1. Appuyez sur le bouton de partage <Share size={14} />
                    </p>
                    <p className="flex items-center gap-2">
                        2. Sélectionnez <span className="font-bold">"Sur l'écran d'accueil"</span>
                    </p>
                </div>
            ) : (
                <button
                    onClick={handleInstallClick}
                    className="mt-4 w-full bg-white text-radisson-blue py-2.5 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Download size={16} />
                    Installer maintenant
                </button>
            )}
        </div>
    );
}
