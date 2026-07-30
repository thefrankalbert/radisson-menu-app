"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, Leaf, Flame, Check, X } from "lucide-react";
import Image from "next/image";
import { useCart, MAX_ITEM_QTY } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import { hasDietaryFlag } from "./dietary";
import { hasRealPhoto } from "./Photo";
import { PhotoPlaceholder } from "./PhotoPlaceholder";
import type { MenuItem, ItemPriceVariant } from "@/types/admin";

interface ItemDetailSheetProps {
    item: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    restaurantId: string;
    categoryName?: string;
}

const COPY = {
    close: { fr: "Fermer", en: "Close" },
    size: { fr: "Format", en: "Size" },
    options: { fr: "Choix", en: "Options" },
    required: { fr: "Obligatoire", en: "Required" },
    vegetarian: { fr: "Végétarien", en: "Vegetarian" },
    spicy: { fr: "Épicé", en: "Spicy" },
    addToCart: { fr: "Ajouter au panier", en: "Add to cart" },
    unavailable: { fr: "Indisponible", en: "Unavailable" },
    decrease: { fr: "Diminuer la quantité", en: "Decrease quantity" },
    increase: { fr: "Augmenter la quantité", en: "Increase quantity" },
} as const;

function GroupTitle({ title, requiredLabel }: { title: ReactNode; requiredLabel: string }) {
    return (
        <div className="mb-2.5 flex items-center gap-2">
            <span className="text-[14.5px] font-semibold tracking-[-0.3px] text-[var(--color-ink)]">
                {title}
            </span>
            <span className="inline-flex items-center rounded-[var(--radius-tag)] border border-[var(--color-divider)] px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.1px] text-[var(--color-ink-muted)]">
                {requiredLabel}
            </span>
        </div>
    );
}

export default function ItemDetailSheet({
    item,
    isOpen,
    onClose,
    restaurantId,
    categoryName = "",
}: ItemDetailSheetProps) {
    const { addToCart } = useCart();
    const { formatPrice } = useCurrency();
    const { language } = useLanguage();
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];
    const shouldReduceMotion = useReducedMotion();

    const [selectedVariant, setSelectedVariant] = useState<ItemPriceVariant | null>(null);
    const [selectedOption, setSelectedOption] = useState<{
        name_fr: string;
        name_en?: string;
    } | null>(null);
    const [quantity, setQuantity] = useState(1);
    // Une URL cassée ne retire que sa diapo, pas toute la galerie.
    const [erroredImages, setErroredImages] = useState<Set<string>>(new Set());
    const [activePhoto, setActivePhoto] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);

    // Réinitialise l'état à chaque changement de plat, en présélectionnant les
    // valeurs par défaut pour que le prix affiché soit toujours cohérent.
    useEffect(() => {
        if (!item) return;

        setQuantity(1);
        setErroredImages(new Set());
        setActivePhoto(0);
        setShowSuccess(false);

        if (item.price_variants?.length) {
            const sorted = [...item.price_variants].sort(
                (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
            );
            setSelectedVariant(sorted.find((v) => v.is_default) ?? sorted[0]);
        } else {
            setSelectedVariant(null);
        }

        if (item.options?.length) {
            const sorted = [...item.options].sort(
                (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
            );
            const def = sorted.find((o) => o.is_default) ?? sorted[0];
            setSelectedOption({ name_fr: def.name_fr, name_en: def.name_en });
        } else {
            setSelectedOption(null);
        }
    }, [item]);

    // Verrou de scroll + Échap pour fermer.
    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    const unitPrice = selectedVariant?.price ?? item?.price ?? 0;
    const currentPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

    const handleAddToCart = useCallback(() => {
        if (!item) return;
        // Point de passage unique : un plat indisponible n'entre jamais au panier,
        // quel que soit le chemin d'ouverture (liste, recherche, lien direct).
        if (item.is_available === false) return;

        void addToCart(
            {
                id: item.id,
                name: item.name,
                name_en: item.name_en,
                price: unitPrice,
                image_url: item.image_url,
                quantity,
                category_id: item.category_id,
                category_name: categoryName,
                selectedOption: selectedOption ?? undefined,
                selectedVariant: selectedVariant
                    ? {
                          name_fr: selectedVariant.variant_name_fr,
                          name_en: selectedVariant.variant_name_en,
                          price: selectedVariant.price,
                      }
                    : undefined,
            },
            restaurantId,
        );

        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);

        setShowSuccess(true);
        const timer = setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 400);
        return () => clearTimeout(timer);
    }, [
        item,
        unitPrice,
        selectedVariant,
        selectedOption,
        quantity,
        categoryName,
        addToCart,
        restaurantId,
        onClose,
    ]);

    if (!item) return null;

    // Galerie dédupliquée (clés React), privée des URLs qui ont échoué au
    // chargement. La base ne stocke aujourd'hui qu'une seule photo par plat, mais
    // le carrousel reste prêt à en afficher plusieurs.
    const galleryImages = [...new Set([item.image_url].filter(hasRealPhoto))].filter(
        (u) => !erroredImages.has(u),
    );
    const hasValidImage = galleryImages.length > 0;
    const isMultiPhoto = galleryImages.length > 1;

    const variants = item.price_variants ?? [];
    const options = item.options ?? [];
    const itemName = getTranslatedContent(lang, item.name, item.name_en);
    const isVegetarian = hasDietaryFlag(item, "vegetarian");
    const isSpicy = hasDietaryFlag(item, "spicy");

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-[60] bg-[rgba(20,24,29,0.5)]"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />

                    <motion.div
                        key="sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={itemName}
                        className="fixed inset-x-0 bottom-0 top-[46px] z-[61] mx-auto flex max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-modal)] bg-white shadow-[0_20px_25px_-5px_rgba(20,24,29,0.10),0_8px_10px_-6px_rgba(20,24,29,0.04)]"
                        initial={{ y: shouldReduceMotion ? 0 : "100%", opacity: shouldReduceMotion ? 0 : 1 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{
                            y: shouldReduceMotion ? 0 : "100%",
                            opacity: shouldReduceMotion ? 0 : 1,
                            transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                        }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0.15 }
                                : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }
                        }
                    >
                        <div className="absolute left-1/2 top-2 z-[3] h-1 w-10 -translate-x-1/2 rounded-full bg-white/85" />

                        <div className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain">
                            <div className="relative h-[250px] w-full bg-[var(--color-surface-alt)]">
                                {hasValidImage ? (
                                    <div
                                        className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto"
                                        onScroll={
                                            isMultiPhoto
                                                ? (e) => {
                                                      const el = e.currentTarget;
                                                      setActivePhoto(
                                                          Math.round(el.scrollLeft / el.clientWidth),
                                                      );
                                                  }
                                                : undefined
                                        }
                                    >
                                        {galleryImages.map((url, idx) => (
                                            <div
                                                key={url}
                                                className="relative h-full w-full min-w-full snap-start"
                                            >
                                                <Image
                                                    src={url}
                                                    alt={isMultiPhoto ? `${itemName} (${idx + 1})` : itemName}
                                                    fill
                                                    sizes="(max-width: 512px) 100vw, 512px"
                                                    className="object-cover"
                                                    onError={() =>
                                                        setErroredImages((prev) => new Set(prev).add(url))
                                                    }
                                                    priority={idx === 0}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <PhotoPlaceholder kind="food" />
                                )}

                                {isMultiPhoto && (
                                    <div className="absolute bottom-3.5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
                                        {galleryImages.map((url, idx) => (
                                            <span
                                                key={url}
                                                className={`h-1.5 rounded-full transition-all duration-200 ${
                                                    idx === activePhoto ? "w-4 bg-white" : "w-1.5 bg-white/60"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-[rgba(20,24,29,0.22)] to-transparent" />

                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label={say("close")}
                                    className="absolute right-3.5 top-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/90 shadow-[0_1px_3px_0_rgba(20,24,29,0.06)] backdrop-blur transition-transform duration-150 active:scale-95"
                                >
                                    <X className="h-[18px] w-[18px] text-[var(--color-ink)]" strokeWidth={2.2} />
                                </button>
                            </div>

                            <div className="px-[18px] pb-6 pt-5">
                                <h2 className="text-[22px] font-semibold leading-[1.2] tracking-[-0.7px] text-[var(--color-ink)]">
                                    {itemName}
                                </h2>

                                {(isVegetarian || isSpicy) && (
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                                        {isVegetarian && (
                                            <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-success)]">
                                                <Leaf className="h-3 w-3" />
                                                {say("vegetarian")}
                                            </span>
                                        )}
                                        {isVegetarian && isSpicy && (
                                            <span className="h-[3px] w-[3px] rounded-full bg-[var(--color-ink-soft)]" />
                                        )}
                                        {isSpicy && (
                                            <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--color-promo)]">
                                                <Flame className="h-3 w-3" />
                                                {say("spicy")}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {(item.description || item.description_en) && (
                                    <p className="mt-3 text-[14px] leading-[1.55] tracking-[-0.1px] text-[var(--color-ink-2)]">
                                        {getTranslatedContent(lang, item.description || "", item.description_en)}
                                    </p>
                                )}

                                {variants.length > 0 && (
                                    <div className="mt-6">
                                        <GroupTitle title={say("size")} requiredLabel={say("required")} />
                                        <div className="flex gap-2" role="radiogroup" aria-label={say("size")}>
                                            {[...variants]
                                                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                                .map((variant) => {
                                                    const isActive = selectedVariant?.id === variant.id;
                                                    return (
                                                        <button
                                                            key={variant.id}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isActive}
                                                            onClick={() => setSelectedVariant(variant)}
                                                            className={`flex-1 rounded-[var(--radius-card)] border-[1.5px] px-2 py-3 text-center transition-transform duration-150 active:scale-[0.98] ${
                                                                isActive
                                                                    ? "border-[var(--color-ink)] shadow-[0_0_0_1px_var(--color-ink)]"
                                                                    : "border-[var(--color-divider)]"
                                                            }`}
                                                        >
                                                            <div className="break-words text-[13.5px] font-semibold tracking-[-0.2px] text-[var(--color-ink)]">
                                                                {getTranslatedContent(
                                                                    lang,
                                                                    variant.variant_name_fr,
                                                                    variant.variant_name_en,
                                                                )}
                                                            </div>
                                                            <div className="mt-[3px] text-[12px] font-medium tabular-nums text-[var(--color-ink-2)]">
                                                                {formatPrice(variant.price)}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}

                                {options.length > 0 && (
                                    <div className="mt-6">
                                        <GroupTitle title={say("options")} requiredLabel={say("required")} />
                                        <div role="radiogroup" aria-label={say("options")}>
                                            {[...options]
                                                .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
                                                .map((option) => {
                                                    const isActive = selectedOption?.name_fr === option.name_fr;
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={isActive}
                                                            onClick={() =>
                                                                setSelectedOption({
                                                                    name_fr: option.name_fr,
                                                                    name_en: option.name_en,
                                                                })
                                                            }
                                                            className={`mb-[7px] flex w-full items-center justify-start gap-3 rounded-[var(--radius-search)] border px-3.5 py-[13px] text-left transition-colors duration-150 ${
                                                                isActive
                                                                    ? "border-[var(--color-ink)] bg-[var(--color-surface-alt)]"
                                                                    : "border-[var(--color-divider)] bg-white"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                                                                    isActive
                                                                        ? "border-[var(--color-ink)]"
                                                                        : "border-[var(--color-ink-soft)]"
                                                                }`}
                                                            >
                                                                {isActive && (
                                                                    <span className="h-[9px] w-[9px] rounded-full bg-[var(--color-ink)]" />
                                                                )}
                                                            </span>
                                                            <span className="flex-1 text-[14px] font-medium tracking-[-0.2px] text-[var(--color-ink-2)]">
                                                                {getTranslatedContent(lang, option.name_fr, option.name_en)}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="h-[90px]" />
                        </div>

                        <div
                            className="absolute inset-x-0 bottom-0 border-t border-[var(--color-divider)] bg-white/95 px-3.5 pt-3 backdrop-blur"
                            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex items-center rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-alt)] p-[3px]">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        aria-label={say("decrease")}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_0_rgba(20,24,29,0.04)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                                    >
                                        <Minus className="h-3.5 w-3.5 text-[var(--color-ink)]" strokeWidth={2.4} />
                                    </button>
                                    <span className="min-w-[30px] text-center text-[14px] font-semibold tabular-nums text-[var(--color-ink)]">
                                        {quantity}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(MAX_ITEM_QTY, q + 1))}
                                        disabled={quantity >= MAX_ITEM_QTY}
                                        aria-label={say("increase")}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-ink)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                                    >
                                        <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.4} />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={showSuccess || item.is_available === false}
                                    className="flex h-[54px] min-w-0 flex-1 items-center justify-between rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
                                >
                                    {showSuccess ? (
                                        <motion.span
                                            className="mx-auto"
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: "spring", stiffness: 600, damping: 15 }}
                                        >
                                            <Check className="h-5 w-5" />
                                        </motion.span>
                                    ) : item.is_available === false ? (
                                        <span className="mx-auto min-w-0 truncate">{say("unavailable")}</span>
                                    ) : (
                                        <>
                                            <span className="min-w-0 truncate">{say("addToCart")}</span>
                                            <span className="shrink-0 tabular-nums">{formatPrice(currentPrice)}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
