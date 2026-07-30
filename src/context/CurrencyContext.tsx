"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

type Currency = "XAF" | "EUR" | "USD";

// Clés de stockage isolées pour Admin et Client
const STORAGE_KEYS = {
    admin: "admin_prefs_currency",
    client: "client_prefs_currency"
} as const;

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRates: { EUR: number; USD: number };
    convertPrice: (priceXAF: number) => number;
    formatPrice: (priceXAF: number) => string;
    formatPriceParts: (priceXAF: number) => { amount: string; unit: string };
    isLoadingRates: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Taux de base (fallback si l'API échoue)
const DEFAULT_RATES = {
    EUR: 655.957, // 1 EUR = 655.957 XAF (taux fixe FCFA/EUR)
    USD: 600 // Approximatif, sera mis à jour par l'API
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>("XAF");
    const [exchangeRates, setExchangeRates] = useState(DEFAULT_RATES);
    const [isLoadingRates, setIsLoadingRates] = useState(false);
    const pathname = usePathname();

    // Déterminer le contexte (Admin ou Client)
    const isAdmin = pathname?.startsWith('/admin');
    const storageKey = isAdmin ? STORAGE_KEYS.admin : STORAGE_KEYS.client;

    // Charger la devise sauvegardée selon le contexte
    useEffect(() => {
        const savedCurrency = localStorage.getItem(storageKey) as Currency;
        if (savedCurrency && ["XAF", "EUR", "USD"].includes(savedCurrency)) {
            setCurrencyState(savedCurrency);
        }
    }, [storageKey]);

    // Récupérer les taux de change
    const fetchExchangeRates = useCallback(async () => {
        setIsLoadingRates(true);
        try {
            // Utiliser l'API Exchange Rate (gratuite)
            const response = await fetch(
                "https://api.exchangerate-api.com/v4/latest/XAF"
            );

            if (response.ok) {
                const data = await response.json();
                // L'API retourne XAF -> autres devises, nous voulons l'inverse
                // Pour convertir de XAF vers EUR: prix_XAF * taux_XAF_EUR
                setExchangeRates({
                    EUR: 1 / (data.rates?.EUR || (1 / DEFAULT_RATES.EUR)),
                    USD: 1 / (data.rates?.USD || (1 / DEFAULT_RATES.USD))
                });
            }
        } catch (error) {
            console.log("Using default exchange rates");
            // Garder les taux par défaut
        } finally {
            setIsLoadingRates(false);
        }
    }, []);

    // Charger les taux au démarrage
    useEffect(() => {
        fetchExchangeRates();
        // Rafraîchir toutes les heures
        const interval = setInterval(fetchExchangeRates, 3600000);
        return () => clearInterval(interval);
    }, [fetchExchangeRates]);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        // Sauvegarder avec la clé spécifique au contexte
        localStorage.setItem(storageKey, newCurrency);
    };

    // Convertir un prix de XAF vers la devise sélectionnée
    const convertPrice = useCallback((priceXAF: number): number => {
        if (currency === "XAF") return priceXAF;

        const rate = exchangeRates[currency];
        return Math.round((priceXAF / rate) * 100) / 100;
    }, [currency, exchangeRates]);

    // Montant et symbole séparés : l'UI convive les compose avec deux styles
    // typographiques distincts (chiffre en gras, unité en mono plus discrète).
    const formatPriceParts = useCallback((priceXAF: number): { amount: string; unit: string } => {
        const converted = convertPrice(priceXAF);

        switch (currency) {
            case "EUR":
                return { amount: converted.toFixed(2), unit: "€" };
            case "USD":
                return { amount: converted.toFixed(2), unit: "$" };
            case "XAF":
            default:
                return { amount: priceXAF.toLocaleString('fr-FR'), unit: "FCFA" };
        }
    }, [currency, convertPrice]);

    // Formater le prix avec le symbole de devise
    const formatPrice = useCallback((priceXAF: number): string => {
        const { amount, unit } = formatPriceParts(priceXAF);
        return currency === "USD" ? `${unit}${amount}` : `${amount} ${unit}`;
    }, [currency, formatPriceParts]);

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            exchangeRates,
            convertPrice,
            formatPrice,
            formatPriceParts,
            isLoadingRates
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error("useCurrency must be used within a CurrencyProvider");
    }
    return context;
}
