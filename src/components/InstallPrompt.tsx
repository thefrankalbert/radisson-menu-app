"use client";
import { useState, useEffect } from "react";
import { Share, X, Download, Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";

/** Le bandeau apparaît par-dessus une interface traduite : il doit suivre la
 *  langue choisie, sinon le convive anglophone lit du français. */
const COPY = {
    title: { fr: "Installer Blu Table", en: "Install Blu Table" },
    subtitle: {
        fr: "Accès rapide depuis l'écran d'accueil",
        en: "Quick access from your home screen",
    },
    install: { fr: "Installer", en: "Install" },
    installAria: { fr: "Installer l'application", en: "Install the app" },
    how: { fr: "Comment ?", en: "How?" },
    close: { fr: "Fermer", en: "Close" },
    howAria: {
        fr: "Voir les instructions d'installation",
        en: "See the installation steps",
    },
} as const;

export default function InstallPrompt() {
    const pathname = usePathname();
    const { language } = useLanguage();
    const say = (k: keyof typeof COPY) => COPY[k][language === "en" ? "en" : "fr"];
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [show, setShow] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        // ONLY show on home page
        if (pathname !== "/") return;

        // Check if user has already closed it (with 24h expiration)
        const dismissedTime = localStorage.getItem("install_prompt_dismissed");
        if (dismissedTime) {
            const dismissedDate = new Date(parseInt(dismissedTime));
            const now = new Date();
            const hoursDiff = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
            if (hoursDiff < 24) return; // Ne pas afficher pendant 24h
        }

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
            // Délai de 3 secondes avant d'afficher
            setTimeout(() => setShow(true), 3000);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // For iOS, show after delay
        if (isIosDevice) {
            setTimeout(() => setShow(true), 3000);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, [pathname]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem("install_prompt_dismissed", Date.now().toString());
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

    // Version compacte (bandeau discret)
    return (
        <div
            role="dialog"
            aria-labelledby="install-prompt-title"
            className="fixed bottom-20 left-2 right-2 md:left-auto md:right-4 md:max-w-sm z-[110] bg-[#003366] text-white rounded-xl shadow-lg border border-white/10 animate-fade-in-up overflow-hidden"
        >
            <div className="flex items-center gap-3 p-3">
                <Image
                    src="/logo.png"
                    alt="Blu Table"
                    width={36}
                    height={36}
                    className="object-contain rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                    <h3 id="install-prompt-title" className="font-bold text-xs truncate">{say("title")}</h3>
                    <p className="text-[10px] text-white/70 truncate">{say("subtitle")}</p>
                </div>

                {isIOS ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                        aria-label={say("howAria")}
                        className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold transition-colors flex-shrink-0"
                    >
                        {isExpanded ? say("close") : say("how")}
                    </button>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        aria-label={say("installAria")}
                        className="px-3 py-1.5 bg-white text-[#003366] rounded-lg text-[10px] font-bold active:scale-95 transition-transform flex items-center gap-1 flex-shrink-0"
                    >
                        <Download size={12} aria-hidden="true" />
                        {say("install")}
                    </button>
                )}

                <button
                    onClick={handleDismiss}
                    aria-label={say("close")}
                    className="text-white/50 hover:text-white p-1 flex-shrink-0"
                >
                    <X size={14} aria-hidden="true" />
                </button>
            </div>

            {/* Instructions iOS expandables */}
            {isIOS && isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-white/10 mt-0">
                    <div className="bg-white/10 rounded-lg p-2 space-y-1.5 text-[10px]">
                        <p className="flex items-center gap-2">
                            <Share size={12} className="text-white/80 flex-shrink-0" aria-hidden="true" />
                            <span>Appuyez sur <strong>Partager</strong></span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Plus size={12} className="text-white/80 flex-shrink-0" aria-hidden="true" />
                            <span>Puis <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong></span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
