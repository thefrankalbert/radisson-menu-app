"use client";
import { useState, useEffect } from "react";
import { Share, X, Download } from "lucide-react";
import { usePathname } from "next/navigation";

export default function InstallPrompt() {
    const pathname = usePathname();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [show, setShow] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // ONLY show on home page
        if (pathname !== "/") return;

        // Check if user has already closed it
        const isDismissed = localStorage.getItem("install_prompt_dismissed");
        if (isDismissed) return;

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

        // For iOS, show if on home and not dismissed
        if (isIosDevice) {
            setShow(true);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [pathname]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("install_prompt_dismissed", "true");
    };

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            handleDismiss();
        }
    };

    if (!show || isStandalone || pathname !== "/") return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[110] bg-[#003366] text-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/10 animate-fade-in-up">
            <button onClick={handleDismiss} aria-label="Fermer la suggestion d'installation" className="absolute top-2 right-2 text-white/60 hover:text-white p-1">
                <X size={16} aria-hidden="true" />
            </button>

            <div className="flex items-center gap-4 pr-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[#003366] font-black text-xl">B</span>
                </div>
                <div>
                    <h3 className="font-bold text-sm">Installer Blu Table</h3>
                    <p className="text-[10px] text-white/80 leading-tight mt-1">
                        Accédez à la carte plus rapidement depuis votre écran d&apos;accueil.
                    </p>
                </div>
            </div>

            {isIOS ? (
                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-white/90 space-y-2">
                    <p className="flex items-center gap-2 text-[10px]">
                        1. Appuyez sur le bouton de partage <Share size={12} />
                    </p>
                    <p className="flex items-center gap-2 text-[10px]">
                        2. Sélectionnez <span className="font-bold">&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
                    </p>
                </div>
            ) : (
                <button
                    onClick={handleInstallClick}
                    aria-label="Installer l'application sur votre appareil"
                    className="mt-4 w-full bg-white text-[#003366] py-2.5 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Download size={16} aria-hidden="true" />
                    Installer l&apos;application
                </button>
            )}
        </div>
    );
}
