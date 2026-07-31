"use client";

import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart, getCartItemKey, MAX_ITEM_QTY } from "@/context/CartContext";
import type { MenuItem } from "@/types/admin";

const PLUS_SHADOW =
    "shadow-[0_4px_6px_-1px_rgba(20,24,29,0.06),0_2px_4px_-2px_rgba(20,24,29,0.04)]";

/**
 * Affordance « + » des cartes plat :
 * - plat avec options ou variantes → « + » ouvre la fiche détail (il faut choisir).
 * - plat simple → « + » ajoute directement, puis se transforme en stepper
 *   quantité ancré au coin de la photo. À qty 1 le « − » devient une suppression.
 */
export function CardAddControl({
    item,
    restaurantId,
    onOpen,
    placement,
    addLabel,
    decreaseLabel,
    increaseLabel,
    removeLabel,
}: {
    item: MenuItem;
    restaurantId: string;
    onOpen: () => void;
    placement: "photo" | "corner";
    addLabel: string;
    decreaseLabel: string;
    increaseLabel: string;
    removeLabel: string;
}) {
    const { items, addToCart, updateQuantity, removeFromCart } = useCart();

    const isSimple = !(item.options?.length || item.price_variants?.length);
    // Un plat simple n'a ni option ni variante : sa clé de panier est son id.
    const qty = isSimple ? (items.find((l) => getCartItemKey(l) === item.id)?.quantity ?? 0) : 0;

    const pos = placement === "photo" ? "bottom-2 right-2" : "-bottom-1.5 -right-1.5";

    if (isSimple && qty > 0) {
        return (
            <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute ${pos} flex items-center rounded-full bg-white p-[3px] ${PLUS_SHADOW}`}
            >
                <button
                    type="button"
                    aria-label={qty === 1 ? removeLabel : decreaseLabel}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (qty === 1) removeFromCart(item.id);
                        else updateQuantity(item.id, qty - 1);
                    }}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                >
                    {qty === 1 ? (
                        <Trash2 className="h-[13px] w-[13px] text-[var(--color-promo)]" strokeWidth={2.2} />
                    ) : (
                        <Minus className="h-[13px] w-[13px] text-[var(--color-ink)]" strokeWidth={2.4} />
                    )}
                </button>
                <span className="min-w-[22px] text-center text-[13.5px] font-bold tabular-nums text-[var(--color-ink)]">
                    {qty}
                </span>
                <button
                    type="button"
                    aria-label={increaseLabel}
                    disabled={qty >= MAX_ITEM_QTY}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (qty < MAX_ITEM_QTY) updateQuantity(item.id, qty + 1);
                    }}
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[var(--color-ink)] transition-transform duration-150 active:scale-95 disabled:opacity-40"
                >
                    <Plus className="h-[13px] w-[13px] text-white" strokeWidth={2.6} />
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            aria-label={addLabel}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Second point de passage, en plus de la fiche détail : un plat
                // indisponible glissé dans le panier ferait échouer la commande
                // ENTIÈRE au moment de l'envoi (la RPC rejette l'article).
                if (item.is_available === false) return;
                if (isSimple) {
                    void addToCart(
                        {
                            id: item.id,
                            name: item.name,
                            name_en: item.name_en,
                            price: item.price,
                            image_url: item.image_url,
                            category_id: item.category_id,
                            quantity: 1,
                        },
                        restaurantId,
                    );
                } else {
                    onOpen();
                }
            }}
            /* Le disque reste à 34px pour ne pas écraser la photo, mais la zone
               tactile est étendue à 44px par un pseudo-élément invisible : c'est
               le bouton le plus sollicité de l'application, et 34px se rate au
               pouce. Seul ce bouton isolé est agrandi — étendre de la même façon
               le « − » et le « + » du stepper les ferait se chevaucher. */
            className={`absolute ${pos} flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white transition-transform duration-150 before:absolute before:-inset-[5px] before:content-[''] active:scale-95 ${PLUS_SHADOW}`}
        >
            <Plus className="h-[18px] w-[18px] text-[var(--color-ink)]" strokeWidth={2.6} />
        </button>
    );
}
