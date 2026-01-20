"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

type Currency = "XAF" | "EUR" | "USD";

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    exchangeRates: { EUR: number; USD: number };
    convertPrice: (priceXAF: number) => number;
    formatPrice: (priceXAF: number) => string;
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

    // Charger la devise sauvegardée
    useEffect(() => {
        const savedCurrency = localStorage.getItem("radisson_currency") as Currency;
        if (savedCurrency && ["XAF", "EUR", "USD"].includes(savedCurrency)) {
            setCurrencyState(savedCurrency);
        }
    }, []);

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
        localStorage.setItem("radisson_currency", newCurrency);
    };

    // Convertir un prix de XAF vers la devise sélectionnée
    const convertPrice = useCallback((priceXAF: number): number => {
        if (currency === "XAF") return priceXAF;

        const rate = exchangeRates[currency];
        return Math.round((priceXAF / rate) * 100) / 100;
    }, [currency, exchangeRates]);

    // Formater le prix avec le symbole de devise
    const formatPrice = useCallback((priceXAF: number): string => {
        const converted = convertPrice(priceXAF);

        switch (currency) {
            case "EUR":
                return `${converted.toFixed(2)} €`;
            case "USD":
                return `$${converted.toFixed(2)}`;
            case "XAF":
            default:
                return `${priceXAF.toLocaleString('fr-FR')} F`;
        }
    }, [currency, convertPrice]);

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            exchangeRates,
            convertPrice,
            formatPrice,
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
