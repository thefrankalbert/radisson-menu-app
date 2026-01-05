"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "fr" | "en";

interface Translations {
    [key: string]: {
        fr: string;
        en: string;
    };
}

const translations: Translations = {
    select_menu: {
        fr: "Sélectionnez votre carte",
        en: "Select your menu",
    },
    view_menu: {
        fr: "Voir la carte",
        en: "View menu",
    },
    back: {
        fr: "Retour",
        en: "Back",
    },
    back_to_menu: {
        fr: "Retour au menu",
        en: "Back to menu",
    },
    add: {
        fr: "Ajouter",
        en: "Add",
    },
    my_cart: {
        fr: "Mon Panier",
        en: "My Cart",
    },
    checkout: {
        fr: "Valider la commande",
        en: "Checkout",
    },
    order_summary: {
        fr: "Récapitulatif de commande",
        en: "Order Summary",
    },
    your_selection: {
        fr: "Votre Sélection",
        en: "Your Selection",
    },
    total_to_pay: {
        fr: "Total à payer",
        en: "Total to pay",
    },
    delivery_info: {
        fr: "Informations de livraison",
        en: "Delivery Info",
    },
    table_room_number: {
        fr: "Table / Chambre",
        en: "Table / Room Number",
    },
    instructions: {
        fr: "Instructions (Facultatif)",
        en: "Instructions (Optional)",
    },
    send_order: {
        fr: "Envoyer la commande",
        en: "Send Order",
    },
    confirmed: {
        fr: "Confirmé.",
        en: "Confirmed.",
    },
    success_msg: {
        fr: "Nos équipes en cuisine s'activent pour vous servir.",
        en: "Our kitchen teams are busy preparing your order.",
    },
    complete_order: {
        fr: "Compléter ma commande",
        en: "Complete my order",
    },
    home: {
        fr: "Accueil",
        en: "Home",
    },
    cart_empty: {
        fr: "Votre panier est vide",
        en: "Your cart is empty",
    },
    discover_menus: {
        fr: "Découvrir les menus",
        en: "Discover menus",
    },
    my_orders: {
        fr: "Mes Commandes",
        en: "My Orders",
    },
    menu_empty: {
        fr: "Aucun plat disponible pour le moment.",
        en: "No dishes available at the moment."
    },
    installation_progress: {
        fr: "Carte en cours d'installation",
        en: "Menu setup in progress"
    },
    come_back_soon: {
        fr: "Revenez très bientôt pour découvrir nos sélections.",
        en: "Check back soon to discover our selections."
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>("fr");

    useEffect(() => {
        const savedLang = localStorage.getItem("radisson_lang") as Language;
        if (savedLang && (savedLang === "fr" || savedLang === "en")) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("radisson_lang", lang);
    };

    const t = (key: string) => {
        return translations[key]?.[language] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
