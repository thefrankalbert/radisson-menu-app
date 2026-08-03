"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeTableNumber } from "@/lib/venue-routing";

/**
 * Range le numéro de table apporté par le QR (`?table=`) dans localStorage.
 *
 * C'est la source de vérité ensuite : l'en-tête, la page réglages et l'envoi de
 * commande relisent tous `saved_table`. L'ancienne version réécrivait aussi
 * l'URL pour y réinjecter le paramètre, héritage du flux qui forçait un nouveau
 * scan — inutile désormais, et source de sauts dans l'historique de navigation.
 *
 * `table_number` reste écrit pour le code plus ancien qui le lit encore.
 */
export default function TableCapture() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const table = normalizeTableNumber(searchParams.get("table"));
        if (!table) return;
        try {
            localStorage.setItem("saved_table", table);
            localStorage.setItem("table_number", table);
        } catch {
            // navigation privée : la table reste dans l'URL le temps de la session
        }
    }, [searchParams]);

    return null;
}
