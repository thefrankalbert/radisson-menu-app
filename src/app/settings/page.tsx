"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronLeft, Bell, Shield, Info, LifeBuoy, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
    SettingsSection,
    SettingsRow,
    SettingsChoice,
    SettingsSwitch,
} from "@/components/client/settings/SettingsPrimitives";
import { InfoSheet } from "@/components/client/settings/InfoSheet";
import { APP_CONFIG } from "@/lib/constants";

type Currency = "XAF" | "EUR" | "USD";
type Sheet = "about" | "privacy" | "help" | null;

const COPY = {
    title: { fr: "Compte et préférences", en: "Account and settings" },
    back: { fr: "Retour", en: "Go back" },
    close: { fr: "Fermer", en: "Close" },
    venue: { fr: "Établissement", en: "Venue" },
    table: { fr: "Table", en: "Table" },
    noTable: { fr: "Aucune table — scannez le QR", en: "No table — scan the QR code" },
    language: { fr: "Langue", en: "Language" },
    currency: { fr: "Devise", en: "Currency" },
    ratesLoading: { fr: "Mise à jour des taux…", en: "Updating rates…" },
    notifications: { fr: "Notifications", en: "Notifications" },
    orderUpdates: { fr: "Suivi de commande", en: "Order updates" },
    orderUpdatesToggle: {
        fr: "Activer le suivi de commande",
        en: "Enable order updates",
    },
    unsupported: { fr: "Non pris en charge", en: "Not supported" },
    about: { fr: "À propos", en: "About" },
    privacy: { fr: "Confidentialité", en: "Privacy" },
    help: { fr: "Aide", en: "Help" },
    information: { fr: "Informations", en: "Information" },
} as const;

const LANGUAGES = [
    { value: "fr" as const, label: "Français" },
    { value: "en" as const, label: "English" },
];

const CURRENCIES: { value: Currency; label: string; hint: string }[] = [
    { value: "XAF", label: "Franc CFA", hint: "FCFA · Tchad" },
    { value: "EUR", label: "Euro", hint: "€ · taux indicatif" },
    { value: "USD", label: "Dollar US", hint: "$ · taux indicatif" },
];

export default function SettingsPage() {
    const router = useRouter();
    const { language, setLanguage } = useLanguage();
    const { currency, setCurrency, isLoadingRates } = useCurrency();
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationsSupported, setNotificationsSupported] = useState(false);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [sheet, setSheet] = useState<Sheet>(null);

    useEffect(() => {
        const supported = typeof window !== "undefined" && "Notification" in window;
        setNotificationsSupported(supported);
        if (supported) setNotificationsEnabled(Notification.permission === "granted");
        try {
            setTableNumber(localStorage.getItem("saved_table"));
        } catch {
            // stockage indisponible (navigation privée)
        }
    }, []);

    const toggleNotifications = async () => {
        if (!notificationsSupported) {
            toast.error(lang === "fr" ? "Notifications non prises en charge" : "Notifications not supported");
            return;
        }

        if (notificationsEnabled) {
            // Le navigateur ne permet pas de révoquer une permission par script :
            // on ne coupe que l'affichage côté app, et on le dit.
            setNotificationsEnabled(false);
            toast.success(lang === "fr" ? "Notifications désactivées" : "Notifications disabled");
            return;
        }

        const isSecureContext =
            window.isSecureContext ||
            window.location.protocol === "https:" ||
            window.location.hostname === "localhost";
        if (!isSecureContext) {
            toast.error(lang === "fr" ? "Requiert une connexion HTTPS" : "Requires an HTTPS connection");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                setNotificationsEnabled(true);
                toast.success(lang === "fr" ? "Notifications activées" : "Notifications enabled");
            } else {
                toast.error(lang === "fr" ? "Permission refusée" : "Permission denied");
            }
        } catch {
            toast.error(lang === "fr" ? "Impossible d'activer les notifications" : "Could not enable notifications");
        }
    };

    return (
        <div className="bg-[var(--color-surface-alt)] pb-24">
            <div className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-white">
                <div className="flex items-center gap-2.5 px-[14px] py-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label={say("back")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-[var(--color-ink)]" />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                        {say("title")}
                    </h1>
                </div>
            </div>

            <div className="px-4 pt-4">
                <SettingsSection title={say("venue")}>
                    <SettingsRow icon={<MapPin className="h-4 w-4" />} label={APP_CONFIG.hotel} />
                    <SettingsRow
                        label={say("table")}
                        value={tableNumber ?? say("noTable")}
                    />
                </SettingsSection>

                <SettingsSection title={say("language")}>
                    <SettingsChoice
                        options={LANGUAGES}
                        active={lang}
                        onSelect={setLanguage}
                        ariaLabel={say("language")}
                    />
                </SettingsSection>

                <SettingsSection
                    title={isLoadingRates ? `${say("currency")} · ${say("ratesLoading")}` : say("currency")}
                >
                    <SettingsChoice
                        options={CURRENCIES}
                        active={currency}
                        onSelect={setCurrency}
                        ariaLabel={say("currency")}
                    />
                </SettingsSection>

                <SettingsSection title={say("notifications")}>
                    <SettingsRow
                        icon={<Bell className="h-4 w-4" />}
                        label={say("orderUpdates")}
                        value={notificationsSupported ? undefined : say("unsupported")}
                        trailing={
                            <SettingsSwitch
                                checked={notificationsEnabled}
                                onChange={toggleNotifications}
                                disabled={!notificationsSupported}
                                ariaLabel={say("orderUpdatesToggle")}
                            />
                        }
                    />
                </SettingsSection>

                <SettingsSection title={say("information")}>
                    <SettingsRow
                        icon={<Info className="h-4 w-4" />}
                        label={say("about")}
                        onClick={() => setSheet("about")}
                    />
                    <SettingsRow
                        icon={<Shield className="h-4 w-4" />}
                        label={say("privacy")}
                        onClick={() => setSheet("privacy")}
                    />
                    <SettingsRow
                        icon={<LifeBuoy className="h-4 w-4" />}
                        label={say("help")}
                        onClick={() => setSheet("help")}
                    />
                </SettingsSection>

                <p className="pb-4 text-center font-mono text-[11px] uppercase tracking-[0.4px] text-[var(--color-ink-soft)]">
                    {APP_CONFIG.name}
                </p>
            </div>

            <InfoSheet
                isOpen={sheet === "about"}
                onClose={() => setSheet(null)}
                title={say("about")}
                closeLabel={say("close")}
            >
                <div className="space-y-3 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">
                    <p>
                        {lang === "fr"
                            ? `${APP_CONFIG.name} est la carte digitale du ${APP_CONFIG.hotel}. Parcourez les cartes des restaurants et bars de l'hôtel et commandez depuis votre table.`
                            : `${APP_CONFIG.name} is the digital menu of the ${APP_CONFIG.hotel}. Browse the hotel's restaurant and bar menus and order from your table.`}
                    </p>
                    <p>
                        {lang === "fr"
                            ? "Scannez le QR code posé sur votre table pour que votre commande parte au bon endroit."
                            : "Scan the QR code on your table so your order reaches the right place."}
                    </p>
                </div>
            </InfoSheet>

            <InfoSheet
                isOpen={sheet === "privacy"}
                onClose={() => setSheet(null)}
                title={say("privacy")}
                closeLabel={say("close")}
            >
                <div className="space-y-3 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">
                    <p>
                        {lang === "fr"
                            ? "Aucun compte n'est requis et aucune donnée personnelle n'est demandée. Votre panier, votre langue, votre devise et votre numéro de table restent stockés sur votre appareil."
                            : "No account is required and no personal data is requested. Your cart, language, currency and table number stay stored on your device."}
                    </p>
                    <p>
                        {lang === "fr"
                            ? "Seuls les plats commandés et le numéro de table sont transmis à la cuisine, le temps du service."
                            : "Only the ordered dishes and the table number are sent to the kitchen, for the duration of service."}
                    </p>
                    <p className="text-[13px] text-[var(--color-ink-muted)]">privacy@theblutable.com</p>
                </div>
            </InfoSheet>

            <InfoSheet
                isOpen={sheet === "help"}
                onClose={() => setSheet(null)}
                title={say("help")}
                closeLabel={say("close")}
            >
                <div className="space-y-3 text-[14px] leading-[1.55] text-[var(--color-ink-2)]">
                    <p>
                        {lang === "fr"
                            ? "Un plat manque, une commande n'arrive pas ? Appelez votre serveur : il voit vos commandes en cours et peut les corriger immédiatement."
                            : "A dish missing, an order not arriving? Call your waiter: they can see your open orders and fix them right away."}
                    </p>
                    <p>
                        {lang === "fr"
                            ? "Le suivi de vos commandes se trouve dans l'onglet Commandes."
                            : "You can follow your orders in the Orders tab."}
                    </p>
                </div>
            </InfoSheet>
        </div>
    );
}
