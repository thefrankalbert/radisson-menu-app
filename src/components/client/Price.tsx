"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface PriceProps {
    /** Montant en XAF (devise pivot de la base). */
    value: number;
    /** Taille du chiffre en px. L'unité suit à ~0.7x. */
    size?: number;
    className?: string;
    /** Classe appliquée à l'unité (FCFA / € / $). */
    unitClassName?: string;
}

/**
 * Prix convive : chiffre dominant + unité discrète en mono.
 * Deux niveaux typographiques valent mieux qu'une seule chaîne — le montant
 * porte l'information, l'unité n'est qu'un rappel.
 */
export function Price({
    value,
    size = 14.5,
    className = "text-[var(--color-ink)]",
    unitClassName = "text-[var(--color-ink-muted)]",
}: PriceProps) {
    const { formatPriceParts } = useCurrency();
    const { amount, unit } = formatPriceParts(value);

    return (
        <span
            className={`font-bold tabular-nums ${className}`}
            style={{ fontSize: size }}
        >
            {amount}{" "}
            <span
                className={`font-mono font-medium ${unitClassName}`}
                style={{ fontSize: Math.round(size * 0.7 * 10) / 10 }}
            >
                {unit}
            </span>
        </span>
    );
}
