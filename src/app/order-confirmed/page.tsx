"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ChevronLeft, Utensils, CircleAlert } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { getTranslatedContent } from "@/utils/translation";
import { OrderStatusCard, type OrderStatus } from "@/components/client/OrderStatusCard";
import ConfirmModal from "@/components/ConfirmModal";
import { markOrderCancelledInHistory } from "@/lib/order-history";

/** Fenêtre pendant laquelle le convive peut renvoyer sa commande au panier.
 *  La base applique la même limite dans `cancel_order` — celle-ci n'est
 *  qu'un affichage, elle n'autorise rien à elle seule. */
const EDIT_WINDOW_MS = 7 * 60 * 1000;
/** Le rôle anon ne peut pas lire `orders` : on sonde via la RPC à jeton. */
const POLL_INTERVAL_MS = 8000;

interface OrderView {
    id: string;
    status: OrderStatus;
    created_at: string;
    table_number: string;
    total_price: number;
    restaurant_id: string;
}

interface OrderLine {
    menu_item_id: string;
    quantity: number;
    price_at_order: number;
    name: string;
    name_en?: string;
}

const COPY = {
    confirmed: { fr: "Commande confirmée", en: "Order confirmed" },
    ready: { fr: "Commande prête", en: "Order ready" },
    back: { fr: "Retour à l'accueil", en: "Back home" },
    orderMore: { fr: "Commander autre chose", en: "Order something else" },
    notFound: { fr: "Commande introuvable", en: "Order not found" },
    notFoundHint: {
        fr: "Le lien de suivi n'est plus valide sur cet appareil. Votre serveur peut retrouver la commande avec le numéro de table.",
        en: "The tracking link is no longer valid on this device. Your waiter can find the order from the table number.",
    },
    modifyTitle: { fr: "Modifier la commande", en: "Edit order" },
    modifyMessage: {
        fr: "La commande est annulée et ses plats reviennent dans votre panier. Il faudra la renvoyer pour qu'elle reparte en cuisine.",
        en: "The order is cancelled and its dishes return to your cart. You will need to send it again for the kitchen to receive it.",
    },
    modifyCta: { fr: "Renvoyer au panier", en: "Return to cart" },
    cancel: { fr: "Annuler", en: "Cancel" },
} as const;

function OrderConfirmedContent() {
    const { lastVisitedMenuUrl, addToCart, clearCart } = useCart();
    const { language } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("orderId");
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    const [order, setOrder] = useState<OrderView | null>(null);
    const [orderItems, setOrderItems] = useState<OrderLine[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isModifying, setIsModifying] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const statusRef = useRef<string | null>(null);

    const fetchOrderDetails = useCallback(async () => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        const token = localStorage.getItem(`order_token_${orderId}`);
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const { data, error } = await supabase.rpc("get_order", { p_id: orderId, p_token: token });
            if (error || !data) return;

            // Le sondage remplace le Realtime, indisponible en lecture anon.
            if (data.status !== statusRef.current) {
                if (data.status === "ready") {
                    toast.success(lang === "fr" ? "Votre commande est prête !" : "Your order is ready!");
                } else if (data.status === "preparing" && statusRef.current) {
                    toast.success(
                        lang === "fr" ? "La cuisine prépare votre commande" : "The kitchen is preparing your order",
                    );
                }
                statusRef.current = data.status;
            }

            setOrder({
                id: data.id,
                status: data.status,
                created_at: data.created_at,
                table_number: data.table_number,
                total_price: data.total_price,
                restaurant_id: data.restaurant_id,
            });
            setOrderItems(
                (data.items ?? []).map((i: Record<string, unknown>) => ({
                    menu_item_id: i.menu_item_id as string,
                    quantity: i.quantity as number,
                    price_at_order: i.price_at_order as number,
                    name: i.name as string,
                    name_en: i.name_en as string | undefined,
                })),
            );
        } finally {
            setLoading(false);
        }
    }, [orderId, lang]);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        void fetchOrderDetails();
        const interval = setInterval(fetchOrderDetails, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [orderId, fetchOrderDetails]);

    // Compte à rebours de la fenêtre de modification. Il ne tourne que tant que
    // la cuisine n'a pas pris la commande en main.
    useEffect(() => {
        if (!order || order.status !== "pending") {
            setTimeLeft(null);
            return;
        }
        const created = new Date(order.created_at).getTime();
        const tick = () => setTimeLeft(Math.max(0, EDIT_WINDOW_MS - (Date.now() - created)));
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [order]);

    const handleModify = async () => {
        setConfirmOpen(false);
        if (!order || order.status !== "pending" || timeLeft === null || timeLeft <= 0) {
            toast.error(lang === "fr" ? "Modification impossible" : "Cannot edit this order");
            return;
        }

        setIsModifying(true);
        try {
            // Annulation côté serveur (statut 'cancelled', fenêtre revérifiée en
            // base) — jamais un DELETE, la cuisine doit garder la trace.
            const token = localStorage.getItem(`order_token_${orderId}`);
            const { error } = await supabase.rpc("cancel_order", { p_id: orderId, p_token: token });
            if (error) throw error;

            // L'historique local est le journal du convive : sans cette mise à
            // jour, la commande qu'il vient d'annuler continuait d'y figurer
            // comme « Envoyée », juste à côté de son panier reconstitué.
            markOrderCancelledInHistory(orderId);

            clearCart();
            for (const item of orderItems) {
                await addToCart(
                    {
                        id: item.menu_item_id,
                        name: item.name,
                        name_en: item.name_en,
                        price: item.price_at_order,
                        quantity: item.quantity,
                    },
                    order.restaurant_id,
                    true,
                );
            }

            toast.success(lang === "fr" ? "Commande revenue au panier" : "Order returned to your cart");
            router.push("/cart");
        } catch {
            toast.error(lang === "fr" ? "Erreur lors de la modification" : "Could not edit the order");
            setIsModifying(false);
        }
    };

    const isReady = order?.status === "ready";
    const title = isReady ? say("ready") : say("confirmed");

    return (
        <div className="min-h-full bg-[var(--color-surface-alt)] pb-24">
            <div className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-white">
                <div className="flex items-center gap-2.5 px-[14px] py-3">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        aria-label={say("back")}
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-[var(--color-ink)]" />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                        {title}
                    </h1>
                </div>
            </div>

            <div className="space-y-3 px-4 pt-4">
                {loading ? (
                    <div className="h-[220px] animate-pulse rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white" />
                ) : order && orderItems.length > 0 ? (
                    <OrderStatusCard
                        reference={order.id.slice(-6).toUpperCase()}
                        tableNumber={order.table_number || "—"}
                        status={order.status}
                        items={orderItems.map((i) => ({
                            name: getTranslatedContent(lang, i.name, i.name_en),
                            quantity: i.quantity,
                            price: i.price_at_order,
                        }))}
                        totalPrice={order.total_price}
                        lang={lang}
                        timeLeftMs={timeLeft}
                        onModify={() => setConfirmOpen(true)}
                        isModifying={isModifying}
                    />
                ) : (
                    // Sans jeton local, la commande n'est pas lisible depuis cet
                    // appareil : le dire, plutôt que d'afficher une page nue.
                    <div className="rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white px-5 py-8 text-center">
                        <div className="mx-auto mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-[var(--radius-modal)] bg-[var(--color-surface-alt)]">
                            <CircleAlert className="h-6 w-6 text-[var(--color-ink-soft)]" strokeWidth={1.8} />
                        </div>
                        <h2 className="text-[16px] font-semibold tracking-[-0.3px] text-[var(--color-ink)]">
                            {say("notFound")}
                        </h2>
                        <p className="mt-1.5 text-[13px] leading-[1.5] text-[var(--color-ink-muted)]">
                            {say("notFoundHint")}
                        </p>
                    </div>
                )}

                {!loading && (
                    <Link
                        href={lastVisitedMenuUrl || "/"}
                        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] text-[14.5px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
                    >
                        <Utensils className="h-[18px] w-[18px]" strokeWidth={2} />
                        {say("orderMore")}
                    </Link>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleModify}
                title={say("modifyTitle")}
                message={say("modifyMessage")}
                confirmText={say("modifyCta")}
                cancelText={say("cancel")}
                variant="warning"
            />
        </div>
    );
}

export default function OrderConfirmedPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-full bg-[var(--color-surface-alt)] px-4 pt-16">
                    <div className="h-[220px] animate-pulse rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white" />
                </div>
            }
        >
            <OrderConfirmedContent />
        </Suspense>
    );
}
