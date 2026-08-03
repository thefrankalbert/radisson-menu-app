"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, Utensils } from "lucide-react";
import { getCartItemKey, MAX_ITEM_QTY, type CartItem } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getTranslatedContent } from "@/utils/translation";
import { hasRealPhoto } from "../Photo";

interface Props {
    items: CartItem[];
    lang: "fr" | "en";
    updateQuantity: (itemKey: string, quantity: number) => void;
    removeFromCart: (itemKey: string) => void;
    labels: { decrease: string; increase: string; remove: string };
}

export function CartItemsList({ items, lang, updateQuantity, removeFromCart, labels }: Props) {
    const { formatPrice } = useCurrency();

    return (
        <section className="rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white px-4 py-1">
            <AnimatePresence mode="popLayout">
                {items.map((item) => {
                    const itemKey = getCartItemKey(item);
                    const optionLabel = item.selectedOption
                        ? getTranslatedContent(lang, item.selectedOption.name_fr, item.selectedOption.name_en)
                        : null;
                    const variantLabel = item.selectedVariant
                        ? getTranslatedContent(lang, item.selectedVariant.name_fr, item.selectedVariant.name_en)
                        : null;
                    const subParts = [variantLabel, optionLabel].filter(Boolean);
                    const hasValidImage = hasRealPhoto(item.image_url);

                    return (
                        <motion.div
                            key={itemKey}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                            className="flex items-center gap-3 border-b border-[var(--color-divider)] py-[13px] last:border-b-0"
                        >
                            <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                                {hasValidImage ? (
                                    <Image
                                        src={item.image_url!}
                                        alt={item.name}
                                        fill
                                        sizes="58px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Utensils className="h-5 w-5 text-[var(--color-ink-soft)]" />
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="line-clamp-2 text-[13.5px] font-semibold leading-[1.3] tracking-[-0.2px] text-[var(--color-ink)]">
                                    {getTranslatedContent(lang, item.name, item.name_en)}
                                </div>
                                {subParts.length > 0 && (
                                    <div className="mt-0.5 text-[11.5px] leading-[1.35] text-[var(--color-ink-muted)]">
                                        {subParts.join(" · ")}
                                    </div>
                                )}
                                <div className="mt-1.5 text-[13px] font-bold tabular-nums text-[var(--color-ink)]">
                                    {formatPrice(item.price * item.quantity)}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-alt)] p-[3px]">
                                <button
                                    type="button"
                                    onClick={() =>
                                        item.quantity <= 1
                                            ? removeFromCart(itemKey)
                                            : updateQuantity(itemKey, item.quantity - 1)
                                    }
                                    aria-label={item.quantity <= 1 ? labels.remove : labels.decrease}
                                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white shadow-[0_1px_2px_0_rgba(20,24,29,0.04)] transition-transform duration-150 active:scale-95"
                                >
                                    {item.quantity <= 1 ? (
                                        <Trash2 className="h-3 w-3 text-[var(--color-promo)]" strokeWidth={2.2} />
                                    ) : (
                                        <Minus className="h-3 w-3 text-[var(--color-ink)]" strokeWidth={2.4} />
                                    )}
                                </button>
                                <span className="min-w-[24px] text-center text-[13px] font-semibold tabular-nums text-[var(--color-ink)]">
                                    {item.quantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        item.quantity < MAX_ITEM_QTY && updateQuantity(itemKey, item.quantity + 1)
                                    }
                                    disabled={item.quantity >= MAX_ITEM_QTY}
                                    aria-label={labels.increase}
                                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--color-ink)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                                >
                                    <Plus className="h-3 w-3 text-white" strokeWidth={2.4} />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </section>
    );
}
