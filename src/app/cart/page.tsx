"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronLeft, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { CartItemsList } from "@/components/client/cart/CartItemsList";
import { OrderSummary } from "@/components/client/cart/OrderSummary";
import { UpsellSection, type UpsellItem } from "@/components/client/cart/UpsellSection";
import { useCartUpsell } from "@/components/client/cart/useCartUpsell";
import { Price } from "@/components/client/Price";
import ConfirmModal from "@/components/ConfirmModal";
import { TablePrompt } from "@/components/client/TablePrompt";
import { readOrderHistory, writeOrderHistory, type HistoryOrder } from "@/lib/order-history";

/** Deux commandes identiques envoyées coup sur coup sont presque toujours un
 *  double-tap, pas une vraie deuxième commande. */
const ORDER_COOLDOWN_MS = 30_000;
const TABLE_PATTERN = /^[A-Z0-9-]{1,15}$/;
/** Marqueur pour une commande sans table exploitable : le service la rattache. */
const AUTO_TABLE = "AUTO-01";

const COPY = {
    title: { fr: "Votre commande", en: "Your order" },
    back: { fr: "Retour", en: "Go back" },
    clear: { fr: "Vider le panier", en: "Clear cart" },
    clearConfirm: {
        fr: "Tous les plats seront retirés. Cette action est définitive.",
        en: "Every dish will be removed. This cannot be undone.",
    },
    clearCta: { fr: "Vider", en: "Clear" },
    cancel: { fr: "Annuler", en: "Cancel" },
    table: { fr: "Table", en: "Table" },
    emptyTitle: { fr: "Votre panier est vide", en: "Your cart is empty" },
    emptyHint: {
        fr: "Parcourez la carte et ajoutez vos plats préférés.",
        en: "Browse the menu and add your favourite dishes.",
    },
    browse: { fr: "Voir la carte", en: "Browse the menu" },
    subtotal: { fr: "Sous-total", en: "Subtotal" },
    total: { fr: "Total", en: "Total" },
    submit: { fr: "Envoyer la commande", en: "Send order" },
    submitting: { fr: "Envoi…", en: "Sending…" },
    close: { fr: "Fermer", en: "Close" },
    decrease: { fr: "Diminuer la quantité", en: "Decrease quantity" },
    increase: { fr: "Augmenter la quantité", en: "Increase quantity" },
    remove: { fr: "Retirer du panier", en: "Remove from cart" },
} as const;

export default function CartPage() {
    const {
        items,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalPrice,
        currentRestaurantId,
        addToCart,
    } = useCart();
    const { t, language } = useLanguage();
    const router = useRouter();
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    const [tableNumber, setTableNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [tablePromptOpen, setTablePromptOpen] = useState(false);

    const { upsellItems, recommendation } = useCartUpsell(items, currentRestaurantId);

    useEffect(() => {
        const tableFromUrl = new URLSearchParams(window.location.search).get("table");
        const savedTable =
            tableFromUrl ||
            localStorage.getItem("saved_table") ||
            localStorage.getItem("table_number") ||
            "";
        if (savedTable) setTableNumber(savedTable);
    }, []);

    const handleAddUpsellItem = async (item: UpsellItem) => {
        if (!currentRestaurantId) return;
        await addToCart(
            {
                id: item.id,
                name: item.name,
                name_en: item.name_en,
                price: item.price,
                image_url: item.image_url,
                category_name: item.category_name,
                quantity: 1,
            },
            currentRestaurantId,
        );
        toast.success(lang === "fr" ? "Ajouté au panier" : "Added to cart");
    };

    /**
     * @param forcedTable table saisie dans la demande, `null` si le convive a
     *   explicitement choisi d'envoyer sans, `undefined` pour l'envoi normal.
     */
    const handleSubmit = async (forcedTable?: string | null) => {
        const rawTable = (
            forcedTable ??
            tableNumber.trim() ??
            ""
        )
            .toString()
            .trim()
            .toUpperCase();

        // Le numéro vient de l'URL (`?table=`) : entièrement contrôlé par
        // l'appelant, il finit en base puis sur les écrans du personnel. On le
        // valide donc systématiquement, sans exception.
        const validTable = TABLE_PATTERN.test(rawTable)
            ? rawTable
            : rawTable.replace(/[^A-Z0-9-]/g, "").slice(0, 15);

        // Sans table exploitable, on demande plutôt que d'envoyer « AUTO-01 » en
        // silence : sur juillet, 37 % des commandes arrivaient en cuisine sans
        // qu'on sache où les servir. Le convive peut toujours passer outre, mais
        // c'est alors un choix explicite (forcedTable === null).
        if (!validTable && forcedTable !== null) {
            setTablePromptOpen(true);
            return;
        }

        const cleanedTableNumber = validTable || AUTO_TABLE;

        const lastOrderTime = localStorage.getItem("last_order_time");
        const now = Date.now();
        if (lastOrderTime && now - Number.parseInt(lastOrderTime, 10) < ORDER_COOLDOWN_MS) {
            toast.error(
                lang === "fr"
                    ? "Veuillez attendre 30 secondes entre chaque commande."
                    : "Please wait 30 seconds between orders.",
            );
            return;
        }

        if (!currentRestaurantId) {
            toast.error(
                lang === "fr" ? "Erreur : restaurant non identifié." : "Error: restaurant not identified.",
            );
            return;
        }

        setIsSubmitting(true);
        try {
            // Création via RPC : chaque prix est confronté au prix réel de
            // l'article et le total est recalculé côté serveur — le client ne
            // peut pas imposer un montant.
            // En revanche, la quantité n'est PAS plafonnée côté serveur, et le
            // délai de 30s ci-dessus vit dans localStorage : ce sont des
            // garde-fous d'interface, pas des protections. Voir
            // supabase/migrations/20260730_cap_order_quantity_and_tip.sql.
            const { data: rpcData, error: rpcError } = await supabase.rpc("create_order", {
                p_restaurant_id: currentRestaurantId,
                p_table_number: cleanedTableNumber,
                p_payment_method: "cash",
                p_items: items.map((item) => ({
                    menu_item_id: item.id,
                    quantity: item.quantity,
                    price_at_order: item.price,
                })),
            });

            if (rpcError || !rpcData) {
                throw new Error(
                    rpcError?.message || "Impossible de créer la commande. Vérifiez votre connexion.",
                );
            }

            // Jeton d'accès (anti-IDOR) : requis pour relire et suivre la commande.
            if (rpcData.access_token) {
                localStorage.setItem(`order_token_${rpcData.id}`, rpcData.access_token as string);
            }

            const newOrder: HistoryOrder = {
                id: rpcData.id as string,
                date: new Date().toISOString(),
                items: items.map((i) => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    option: i.selectedOption?.name_fr,
                    variant: i.selectedVariant?.name_fr,
                })),
                // Le total qui fait foi est celui recalculé par la RPC, pas la
                // somme côté client : afficher un autre montant dans l'historique
                // que celui réellement enregistré serait trompeur.
                totalPrice: (rpcData.total_price as number) ?? totalPrice,
                tableNumber: cleanedTableNumber,
                status: "sent",
            };

            writeOrderHistory([newOrder, ...readOrderHistory()]);
            localStorage.setItem("last_order_time", now.toString());
            localStorage.setItem("saved_table", cleanedTableNumber);

            clearCart();
            toast.success(t("order_sent_success"));
            router.push(`/order-confirmed?orderId=${rpcData.id}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Une erreur est survenue";
            toast.error(lang === "fr" ? `Erreur : ${message}` : `Error: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="flex min-h-full flex-col items-center justify-center px-8 py-24 text-center">
                <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[var(--radius-modal)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                    <ShoppingBag className="h-8 w-8 text-[var(--color-ink-soft)]" strokeWidth={1.6} />
                </div>
                <h1 className="text-[18px] font-semibold tracking-[-0.4px] text-[var(--color-ink)]">
                    {say("emptyTitle")}
                </h1>
                <p className="mt-1.5 max-w-[260px] text-[13px] text-[var(--color-ink-muted)]">
                    {say("emptyHint")}
                </p>
                <Link
                    href="/"
                    className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--color-brand)] px-6 text-[14px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
                >
                    {say("browse")}
                </Link>
            </div>
        );
    }

    return (
        <div
            className="bg-[var(--color-surface-alt)]"
            style={{ paddingBottom: "calc(9rem + env(safe-area-inset-bottom, 0px))" }}
        >
            <div className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-white">
                <div className="flex items-center gap-2.5 px-[14px] py-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label={say("back")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-[var(--color-ink)]" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                            {say("title")}
                        </h1>
                        {tableNumber && (
                            <p className="text-[11.5px] text-[var(--color-ink-muted)]">
                                {say("table")} {tableNumber}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setClearConfirmOpen(true)}
                        aria-label={say("clear")}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
                    >
                        <Trash2 className="h-[18px] w-[18px] text-[var(--color-ink-muted)]" strokeWidth={2} />
                    </button>
                </div>
            </div>

            <div className="space-y-3 px-4 pt-4">
                <CartItemsList
                    items={items}
                    lang={lang}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                    labels={{
                        decrease: say("decrease"),
                        increase: say("increase"),
                        remove: say("remove"),
                    }}
                />

                {recommendation && (
                    <UpsellSection
                        title={recommendation.title[lang]}
                        items={upsellItems}
                        lang={lang}
                        onAdd={handleAddUpsellItem}
                        addLabel={(name) => (lang === "en" ? `Add ${name}` : `Ajouter ${name}`)}
                    />
                )}

                <OrderSummary
                    subtotal={totalPrice}
                    labels={{ subtotal: say("subtotal"), total: say("total") }}
                />
            </div>

            <div
                className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-lg border-t border-[var(--color-divider)] bg-white/95 px-4 pt-3 backdrop-blur"
                style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))" }}
            >
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="flex h-[54px] w-full items-center justify-between rounded-full bg-[var(--color-brand)] px-5 text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-60"
                >
                    <span className="min-w-0 truncate">
                        {isSubmitting ? say("submitting") : say("submit")}
                    </span>
                    <Price
                        value={totalPrice}
                        size={15}
                        className="shrink-0 text-white"
                        unitClassName="text-white/60"
                    />
                </button>
            </div>

            <TablePrompt
                isOpen={tablePromptOpen}
                lang={lang}
                onClose={() => setTablePromptOpen(false)}
                onConfirm={(table) => {
                    setTablePromptOpen(false);
                    if (table) setTableNumber(table);
                    void handleSubmit(table);
                }}
            />

            <ConfirmModal
                isOpen={clearConfirmOpen}
                onClose={() => setClearConfirmOpen(false)}
                onConfirm={() => {
                    clearCart();
                    setClearConfirmOpen(false);
                }}
                title={say("clear")}
                message={say("clearConfirm")}
                confirmText={say("clearCta")}
                cancelText={say("cancel")}
                variant="danger"
            />
        </div>
    );
}
