"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/** Regroupe les rafales d'événements : la cuisine bascule souvent plusieurs
 *  plats d'affilée, une seule régénération suffit. */
const REFRESH_DEBOUNCE_MS = 1500;

/**
 * Rafraîchit la carte rendue côté serveur quand un plat ou une catégorie change.
 *
 * La page est mise en cache ; sans ce fil temps réel, un plat passé indisponible
 * resterait commandable jusqu'à la prochaine régénération. `router.refresh()`
 * relit les données du serveur sans recharger la page ni perdre le panier, la
 * position de défilement ou une fiche ouverte.
 */
export function MenuRealtimeRefresh({ slug }: { slug: string }) {
    const router = useRouter();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const scheduleRefresh = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => router.refresh(), REFRESH_DEBOUNCE_MS);
        };

        const channel = supabase
            .channel(`menu-sync-${slug}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, scheduleRefresh)
            .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, scheduleRefresh)
            .subscribe();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            void supabase.removeChannel(channel);
        };
    }, [slug, router]);

    return null;
}
