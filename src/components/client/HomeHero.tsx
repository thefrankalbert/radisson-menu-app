"use client";

import { useState } from "react";
import { ArrowRight, Timer } from "lucide-react";
import { Photo, hasRealPhoto } from "./Photo";
import ItemDetailSheet from "./ItemDetailSheet";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import type { MenuItem } from "@/types/admin";

const COPY = {
    suggestion: { fr: "Suggestion du chef", en: "Chef's suggestion" },
    badge: { fr: "Plat du jour", en: "Dish of the day" },
    hours: { fr: "Servi 12h — 23h", en: "Served 12pm — 11pm" },
    order: { fr: "Commander", en: "Order" },
} as const;

/**
 * Bandeau « plat du jour » de l'accueil. Taper ouvre la fiche détail — comme les
 * cartes plats — plutôt que de renvoyer vers la carte : le convive veut voir le
 * plat, pas changer d'écran.
 */
export function HomeHero({
    item,
    name,
    photoUrl,
    restaurantId,
}: {
    item: MenuItem;
    name: string;
    photoUrl?: string | null;
    restaurantId: string;
}) {
    const { formatPriceParts } = useCurrency();
    const { language } = useLanguage();
    const lang = language === "en" ? "en" : "fr";
    const [open, setOpen] = useState(false);
    const { amount, unit } = formatPriceParts(item.price);

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="relative block h-[232px] cursor-pointer overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-ink)]"
                aria-label={name}
            >
                {/* Sans vraie photo on garde le fond encre : le visuel de repli
                    ivoire sous un dégradé sombre donnerait une bouillie grise. */}
                {hasRealPhoto(photoUrl) && (
                    <div className="absolute inset-0">
                        <Photo src={photoUrl} alt={name} kind="food" fill priority sizes="100vw" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[30%] to-black/85" />
                    </div>
                )}
                <div className="relative flex h-full flex-col justify-between p-[18px]">
                    <div className="flex items-start justify-between">
                        <span className="rounded-[var(--radius-tag)] bg-[var(--color-brand)] px-2.5 py-1 text-[11px] font-bold tracking-[0.2px] text-white">
                            {COPY.badge[lang]}
                        </span>
                        <span className="flex items-center gap-[5px] rounded-[var(--radius-tag)] bg-white/15 px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-[0.2px] text-white backdrop-blur-[10px]">
                            <Timer className="h-[11px] w-[11px]" />
                            {COPY.hours[lang]}
                        </span>
                    </div>
                    <div>
                        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-white/70">
                            {COPY.suggestion[lang]}
                        </div>
                        <div className="mt-[5px] line-clamp-2 break-words text-[25px] font-semibold leading-[1.05] tracking-[-0.9px] text-white">
                            {name}
                        </div>
                        <div className="mt-3.5 flex items-center gap-3.5">
                            <span className="text-[18px] font-semibold leading-none tracking-[-0.3px] tabular-nums text-white">
                                {amount}{" "}
                                <span className="font-mono text-[13px] font-medium text-white/60">{unit}</span>
                            </span>
                            <span className="inline-flex h-[38px] items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 text-[12.5px] font-semibold leading-none tracking-[-0.2px] text-white">
                                {COPY.order[lang]}
                                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <ItemDetailSheet
                item={open ? item : null}
                isOpen={open}
                onClose={() => setOpen(false)}
                restaurantId={restaurantId}
            />
        </>
    );
}
