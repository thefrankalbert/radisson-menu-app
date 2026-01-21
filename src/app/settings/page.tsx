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

    // Vérifier l'état des notifications au chargement
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
            toast.error(language === 'fr' ? "Notifications non supportées sur ce navigateur" : "Notifications not supported on this browser");
            return;
        }

        if (!notificationsEnabled) {
            // Demander la permission
            try {
                // Vérifier si on est en HTTPS ou localhost
                const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                
                if (!isSecureContext) {
                    toast.error(language === 'fr' ? "Les notifications nécessitent une connexion sécurisée (HTTPS)" : "Notifications require a secure connection (HTTPS)");
                    return;
                }

                const permission = await Notification.requestPermission();
                
                if (permission === "granted") {
                    setNotificationsEnabled(true);
                    // Envoyer une notification de test
                    try {
                        const notification = new Notification("Blu Table", {
                            body: language === 'fr' ? "Notifications activées !" : "Notifications enabled!",
                            icon: "/logo.png",
                            badge: "/logo.png",
                            tag: "blutable-notification",
                            requireInteraction: false
                        });
                        
                        // Fermer automatiquement après 3 secondes
                        setTimeout(() => {
                            notification.close();
                        }, 3000);
                        
                        toast.success(language === 'fr' ? "Notifications activées avec succès !" : "Notifications enabled successfully!");
                    } catch (notifError) {
                        console.error("Error showing notification:", notifError);
                        toast.error(language === 'fr' ? "Erreur lors de l'affichage de la notification" : "Error showing notification");
                    }
                } else if (permission === "denied") {
                    setNotificationsEnabled(false);
                    toast.error(language === 'fr' ? "Permission refusée. Veuillez autoriser les notifications dans les paramètres du navigateur." : "Permission denied. Please enable notifications in browser settings.");
                } else {
                    setNotificationsEnabled(false);
                    toast(language === 'fr' ? "Permission non accordée" : "Permission not granted", { icon: 'ℹ️' });
                }
            } catch (error) {
                console.error("Error requesting notification permission:", error);
                setNotificationsEnabled(false);
                toast.error(language === 'fr' ? "Erreur lors de la demande de permission" : "Error requesting permission");
            }
        } else {
            // Note: On ne peut pas révoquer les permissions programmatiquement
            // On désactive juste l'état local (les notifications seront ignorées côté app)
            setNotificationsEnabled(false);
            toast(language === 'fr' ? "Notifications désactivées localement" : "Notifications disabled locally", { icon: 'ℹ️' });
        }
    };

    return (
        <main className="min-h-screen bg-[#F8FAFC] pb-24 pt-4">
            <div className="max-w-md mx-auto px-6">

                <div className="space-y-6">
                    {/* SECTION: Préférences */}
                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">
                            {language === "fr" ? "Préférences" : "Preferences"}
                        </h2>
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            {/* Langue */}
                            <button
                                onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                                className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Globe className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {language === "fr" ? "Langue" : "Language"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {language === "fr" ? "Français" : "English"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
                                    <span className={`text-xs px-3 py-1.5 rounded-full transition-all ${language === 'fr' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-400'}`}>FR</span>
                                    <span className={`text-xs px-3 py-1.5 rounded-full transition-all ${language === 'en' ? 'bg-white shadow-sm font-bold text-gray-900' : 'text-gray-400'}`}>EN</span>
                                </div>
                            </button>

                            {/* Devise */}
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {language === "fr" ? "Devise" : "Currency"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {isLoadingRates ? (language === "fr" ? "Mise à jour..." : "Updating...") : (language === "fr" ? "Taux en temps réel" : "Real-time rates")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    {currencies.map((curr) => (
                                        <button
                                            key={curr.code}
                                            onClick={() => setCurrency(curr.code)}
                                            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${currency === curr.code
                                                ? 'bg-[#002C5F] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            <span className="mr-1">{curr.flag}</span> {curr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: Notifications & Support */}
                    <div className="space-y-3">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-2">
                            {language === "fr" ? "Support & Infos" : "Support & Info"}
                        </h2>
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                            {/* Notifications */}
                            <button
                                onClick={toggleNotifications}
                                disabled={!notificationsSupported}
                                className={`w-full flex items-center justify-between p-4 border-b border-gray-50 transition-colors ${notificationsSupported ? 'active:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                        <p className="text-xs text-gray-500">
                                            {!notificationsSupported
                                                ? (language === "fr" ? "Non supportées" : "Not supported")
                                                : notificationsEnabled
                                                    ? (language === "fr" ? "Activées" : "Enabled")
                                                    : (language === "fr" ? "Désactivées" : "Disabled")}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-12 h-7 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </button>

                            {/* Privacy Policy */}
                            <button
                                onClick={() => setShowPrivacyModal(true)}
                                className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {language === "fr" ? "Confidentialité" : "Privacy Policy"}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>

                            {/* About */}
                            <button
                                onClick={() => setShowAboutModal(true)}
                                className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                        <Info className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {language === "fr" ? "À propos de Blu Table" : "About Blu Table"}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Version */}
                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        Radisson Blu N&apos;Djamena v1.0
                    </p>
                </div>
            </div>

            {/* Modal Privacy Policy */}
            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowPrivacyModal(false)} />
                    <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 text-center flex-1">
                                {language === "fr" ? "Politique de Confidentialité" : "Privacy Policy"}
                            </h2>
                            <button onClick={() => setShowPrivacyModal(false)} className="p-2 hover:bg-gray-100 rounded-full ml-4">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 pb-24 overflow-y-auto max-h-[70vh] space-y-4 text-sm text-gray-600">
                            <h3 className="font-bold text-gray-900">{language === "fr" ? "Collecte des données" : "Data Collection"}</h3>
                            <p>
                                {language === "fr"
                                    ? "Blu Table collecte uniquement les informations nécessaires au traitement de vos commandes : numéro de table, articles commandés et préférences de langue."
                                    : "Blu Table only collects information necessary for processing your orders: table number, ordered items, and language preferences."}
                            </p>

                            <h3 className="font-bold text-gray-900">{language === "fr" ? "Utilisation des données" : "Data Usage"}</h3>
                            <p>
                                {language === "fr"
                                    ? "Vos données sont utilisées exclusivement pour le traitement de vos commandes et l'amélioration de nos services. Nous ne partageons jamais vos informations avec des tiers."
                                    : "Your data is used exclusively for processing your orders and improving our services. We never share your information with third parties."}
                            </p>

                            <h3 className="font-bold text-gray-900">{language === "fr" ? "Stockage" : "Storage"}</h3>
                            <p>
                                {language === "fr"
                                    ? "Les données de commande sont conservées pendant 30 jours maximum, puis automatiquement supprimées. Vos préférences sont stockées localement sur votre appareil."
                                    : "Order data is kept for a maximum of 30 days, then automatically deleted. Your preferences are stored locally on your device."}
                            </p>

                            <h3 className="font-bold text-gray-900">{language === "fr" ? "Vos droits" : "Your Rights"}</h3>
                            <p>
                                {language === "fr"
                                    ? "Vous pouvez demander la suppression de vos données à tout moment en contactant le personnel du Radisson Blu."
                                    : "You can request deletion of your data at any time by contacting Radisson Blu staff."}
                            </p>

                            <h3 className="font-bold text-gray-900">Contact</h3>
                            <p>
                                {language === "fr"
                                    ? "Pour toute question concernant vos données personnelles :"
                                    : "For any questions regarding your personal data:"}
                            </p>
                            <p className="text-[#002C5F] font-medium">
                                privacy@theblutable.com
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal About */}
            {showAboutModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowAboutModal(false)} />
                    <div className="relative bg-white w-full max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900 text-center flex-1">
                                {language === "fr" ? "À propos de Blu Table" : "About Blu Table"}
                            </h2>
                            <button onClick={() => setShowAboutModal(false)} className="p-2 hover:bg-gray-100 rounded-full ml-4">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 pb-24 overflow-y-auto max-h-[70vh] space-y-4">
                            <div className="text-center mb-6">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
                                    <img 
                                        src="/images/about.jpg" 
                                        alt="Blu Table" 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const fallback = document.createElement('span');
                                            fallback.className = 'text-3xl';
                                            fallback.textContent = '🍽️';
                                            target.parentElement?.appendChild(fallback);
                                        }}
                                    />
                                </div>
                                <p className="text-sm text-gray-500">by Radisson Blu N&apos;Djamena</p>
                            </div>

                            <div className="space-y-4 text-sm text-gray-600">
                                <p>
                                    {language === "fr"
                                        ? "Blu Table est l'application de menu digital du Radisson Blu N'Djamena. Elle vous permet de découvrir notre carte gastronomique et de passer vos commandes directement depuis votre table."
                                        : "Blu Table is the digital menu application of Radisson Blu N'Djamena. It allows you to discover our gastronomic menu and place orders directly from your table."}
                                </p>

                                <div className="bg-[#002C5F]/5 rounded-xl p-4">
                                    <h4 className="font-bold text-gray-900 mb-2">{language === "fr" ? "Nos espaces" : "Our Venues"}</h4>
                                    <ul className="space-y-2 text-gray-600">
                                        <li><strong>Panorama</strong> - {language === "fr" ? "Restaurant gastronomique avec vue sur le Chari" : "Fine dining with a view of the Chari"}</li>
                                        <li><strong>Lobby Bar</strong> - {language === "fr" ? "Bar & snacks dans un cadre élégant" : "Bar & snacks in an elegant setting"}</li>
                                        <li><strong>Pool</strong> - {language === "fr" ? "Détente au bord de la piscine" : "Relaxation by the pool"}</li>
                                    </ul>
                                </div>

                                <div className="text-center pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 mt-1">© {new Date().getFullYear()} Radisson Blu N&apos;Djamena</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
