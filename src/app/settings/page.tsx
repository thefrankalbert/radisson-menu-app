"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Globe, ChevronRight, Bell, Shield, Info, DollarSign, X } from "lucide-react";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
    const { language, setLanguage } = useLanguage();
    const { currency, setCurrency, isLoadingRates } = useCurrency();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationsSupported, setNotificationsSupported] = useState(true);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    const currencies = [
        { code: "XAF" as const, label: "F CFA", flag: "🇹🇩" },
        { code: "EUR" as const, label: "Euro", flag: "🇪🇺" },
        { code: "USD" as const, label: "Dollar", flag: "🇺🇸" }
    ];

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationsSupported(true);
            setNotificationsEnabled(Notification.permission === "granted");
        } else {
            setNotificationsSupported(false);
        }
    }, []);

    const toggleNotifications = async () => {
        if (!notificationsSupported) {
            toast.error(language === 'fr' ? "Notifications non supportées" : "Notifications not supported");
            return;
        }

        if (!notificationsEnabled) {
            try {
                const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
                if (!isSecureContext) {
                    toast.error(language === 'fr' ? "Requiert HTTPS" : "Requires HTTPS");
                    return;
                }

                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    setNotificationsEnabled(true);
                    toast.success(language === 'fr' ? "Activées !" : "Enabled!");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error");
            }
        } else {
            setNotificationsEnabled(false);
            toast.success(language === 'fr' ? "Désactivées" : "Disabled");
        }
    };

    return (
        <main className="min-h-screen bg-[#F7F7F7] pb-32 animate-fade-in font-jakarta">
            {/* STICKY HEADER */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => window.history.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <X size={24} strokeWidth={1.5} />
                </button>
                <h1 className="text-lg font-bold text-gray-900 uppercase tracking-widest text-center flex-1 pr-6">
                    {language === 'fr' ? 'Paramètres' : 'Settings'}
                </h1>
            </div>

            <div className="max-w-md mx-auto px-6 pt-8 space-y-10">
                {/* SECTION: PRÉFÉRENCES */}
                <div className="space-y-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 pl-1">
                        {language === "fr" ? "Préférences" : "Preferences"}
                    </h2>
                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                        {/* Langue */}
                        <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50/50 rounded-2xl flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-[#002C5F]" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">
                                        {language === "fr" ? "Langue" : "Language"}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                        {language === "fr" ? "Français" : "English"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
                                <button
                                    onClick={() => setLanguage('fr')}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${language === 'fr' ? 'bg-white shadow-sm text-[#002C5F]' : 'text-gray-400'}`}
                                >
                                    FR
                                </button>
                                <button
                                    onClick={() => setLanguage('en')}
                                    className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-sm text-[#002C5F]' : 'text-gray-400'}`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-gray-50 mx-5" />

                        {/* Devise */}
                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-10 h-10 bg-green-50/50 rounded-2xl flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-green-600" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">
                                        {language === "fr" ? "Devise" : "Currency"}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                        {isLoadingRates ? (language === "fr" ? "Mise à jour..." : "Updating...") : (language === "fr" ? "Taux en temps réel" : "Real-time rates")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {currencies.map((curr) => (
                                    <button
                                        key={curr.code}
                                        onClick={() => setCurrency(curr.code)}
                                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${currency === curr.code
                                            ? 'bg-[#002C5F] text-white border-[#002C5F] shadow-lg shadow-blue-900/10'
                                            : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                                            }`}
                                    >
                                        <span className="mr-1 opacity-70">{curr.flag}</span>
                                        {curr.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION: SUPPORT & INFOS */}
                <div className="space-y-4">
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400 pl-1">
                        {language === "fr" ? "Support & Infos" : "Support & Info"}
                    </h2>
                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                        {/* Notifications */}
                        <button
                            onClick={toggleNotifications}
                            disabled={!notificationsSupported}
                            className={`w-full flex items-center justify-between p-5 transition-colors ${notificationsSupported ? 'hover:bg-gray-50 active:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-orange-50/50 rounded-2xl flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-orange-500" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">Notifications</p>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                        {!notificationsSupported
                                            ? (language === "fr" ? "Non supportées" : "Not supported")
                                            : notificationsEnabled
                                                ? (language === "fr" ? "Activées" : "Enabled")
                                                : (language === "fr" ? "Désactivées" : "Disabled")}
                                    </p>
                                </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${notificationsEnabled ? 'bg-[#002C5F]' : 'bg-gray-200'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                            </div>
                        </button>

                        <div className="h-px bg-gray-50 mx-5" />

                        {/* Privacy Policy */}
                        <button
                            onClick={() => setShowPrivacyModal(true)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-purple-50/50 rounded-2xl flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">
                                        {language === "fr" ? "Confidentialité" : "Privacy Policy"}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                        {language === "fr" ? "Vos données" : "Your data"}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>

                        <div className="h-px bg-gray-50 mx-5" />

                        {/* About */}
                        <button
                            onClick={() => setShowAboutModal(true)}
                            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50/50 rounded-2xl flex items-center justify-center">
                                    <Info className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-gray-900">
                                        {language === "fr" ? "À propos" : "About"}
                                    </p>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                                        Radisson Blu
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </button>
                    </div>
                </div>

                {/* VERSION */}
                <div className="pt-10 pb-4 text-center">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em]">
                        Blu Table v1.2 • © {new Date().getFullYear()}
                    </p>
                </div>
            </div>

            {/* MODALS */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
                    <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl animate-slide-up">
                        <div className="p-6 flex items-center justify-between border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest text-center flex-1 ml-8">
                                {language === "fr" ? "Confidentialité" : "Privacy"}
                            </h2>
                            <button onClick={() => setShowPrivacyModal(false)} className="p-2 bg-gray-50 rounded-full">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="p-8 pb-32 overflow-y-auto max-h-[75vh] space-y-6">
                            <div className="space-y-4">
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">{language === "fr" ? "Collecte des données" : "Data Collection"}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {language === "fr"
                                            ? "Blu Table collecte uniquement les informations nécessaires au traitement de vos commandes : numéro de table, articles commandés et préférences."
                                            : "Blu Table only collects information necessary for processing your orders: table number, ordered items, and preferences."}
                                    </p>
                                </section>
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">{language === "fr" ? "Utilisation" : "Usage"}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {language === "fr"
                                            ? "Vos données servent exclusivement à la commande. Nous ne partageons jamais vos informations avec des tiers."
                                            : "Your data is used exclusively for ordering. We never share your information with third parties."}
                                    </p>
                                </section>
                                <section>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">{language === "fr" ? "Stockage" : "Storage"}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {language === "fr"
                                            ? "Les données sont conservées temporairement pour la durée de votre session au Radisson Blu."
                                            : "Data is kept temporarily for the duration of your session at Radisson Blu."}
                                    </p>
                                </section>
                            </div>
                            <div className="pt-8 border-t border-gray-50">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Radisson Blu Support • privacy@theblutable.com</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAboutModal && (
                <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAboutModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[40px] overflow-hidden shadow-2xl animate-slide-up">
                        <div className="p-6 flex items-center justify-between border-b border-gray-50">
                            <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-[0.2em] text-center flex-1 ml-8">
                                {language === "fr" ? "À propos" : "About"}
                            </h2>
                            <button onClick={() => setShowAboutModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="p-10 pb-20 overflow-y-auto max-h-[85vh]">
                            {/* NEW BRANDING HEADER */}
                            <div className="text-center mb-10">
                                <div className="mb-6 h-16 flex items-center justify-center">
                                    <img
                                        src="/logo.png"
                                        alt="Radisson Blu"
                                        className="h-full w-auto object-contain"
                                    />
                                </div>
                                <h3 className="text-[11px] font-black text-[#002C5F] uppercase tracking-[0.3em] font-sans">
                                    Radisson Blu N&apos;Djamena
                                </h3>
                            </div>

                            {/* PREMIUM DESCRIPTION */}
                            <div className="space-y-6 text-center max-w-[320px] mx-auto">
                                <p className="text-[15px] text-gray-900 font-bold leading-relaxed">
                                    {language === "fr"
                                        ? "Blu Table est l'application de menu digital exclusive du Radisson Blu N'Djamena."
                                        : "Blu Table is the exclusive digital menu application of Radisson Blu N'Djamena."}
                                </p>
                                <p className="text-[13px] text-gray-500 leading-relaxed">
                                    {language === "fr"
                                        ? "Elle vous permet d'explorer notre univers gastronomique et de commander avec élégance, directement depuis votre table."
                                        : "It allows you to explore our gastronomic universe and order with elegance, directly from your table."}
                                </p>
                            </div>

                            {/* SLOGAN & FOOTER */}
                            <div className="mt-16 text-center space-y-2">
                                <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-full mb-8"></div>
                                <p className="text-[11px] text-[#002C5F] font-black uppercase tracking-[0.4em] animate-pulse">
                                    Feel the Difference
                                </p>
                                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest pt-2">
                                    Managed by Radisson Blu • v1.2
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
