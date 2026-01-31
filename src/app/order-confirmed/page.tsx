"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { Utensils, CheckCircle2, Clock, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { getTranslatedContent } from "@/utils/translation";

function OrderConfirmedContent() {
    const { lastVisitedMenuUrl, items, addToCart, clearCart } = useCart();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState<any>(null);
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isModifying, setIsModifying] = useState(false);

    const EDIT_WINDOW = 7 * 60 * 1000; // 7 minutes

    const fetchOrderDetails = async () => {
        if (!orderId) return;
        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderData) setOrder(orderData);

            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select(`id, quantity, price_at_order, menu_item_id, menu_item:menu_items ( name, name_en )`)
                .eq('order_id', orderId);

            if (itemsData) setOrderItems(itemsData);
        } catch (e) {
            toast.error("Erreur de récupération");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();

        // Real-time subscription to catch status changes (Preparing/Ready/etc)
        const channel = supabase.channel(`order_sync_${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(payload.new);
                if (payload.new.status !== 'pending') {
                    toast.success(payload.new.status === 'ready' ? "Votre commande est prête !" : "La cuisine prépare votre commande");
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    // Timer Logic (Background)
    useEffect(() => {
        if (!order || order.status !== 'pending') {
            setTimeLeft(null);
            return;
        }

        const calculateTime = () => {
            const created = new Date(order.created_at).getTime();
            const now = Date.now();
            const elapsed = now - created;
            const remaining = Math.max(0, EDIT_WINDOW - elapsed);
            setTimeLeft(remaining);

            if (remaining <= 0) clearInterval(timer);
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    const handleModify = async () => {
        if (!order || order.status !== 'pending' || (timeLeft !== null && timeLeft <= 0)) {
            toast.error("Modification impossible");
            return;
        }

        if (!confirm("Modifier la commande ? Elle sera renvoyée vers votre panier.")) return;

        setIsModifying(true);
        try {
            // 1. Cancel order in DB
            const { error: deleteError } = await supabase.from('orders').delete().eq('id', orderId);
            if (deleteError) throw deleteError;

            // 2. Clear current cart to avoid mixing (standard safety)
            clearCart();

            // 3. Restore items to cart
            for (const item of orderItems) {
                await addToCart({
                    id: item.menu_item_id,
                    name: item.menu_item.name,
                    price: item.price_at_order,
                    quantity: item.quantity
                }, order.restaurant_id, true);
            }

            toast.success("Commande récupérée dans le panier");
            router.push('/cart');
        } catch (e) {
            toast.error("Erreur lors de la modification");
            setIsModifying(false);
        }
    };

    const isModifiable = order?.status === 'pending' && timeLeft !== null && timeLeft > 0;

    return (
        <main className="min-h-screen bg-radisson-light flex flex-col items-center p-6 pt-12 relative overflow-hidden font-sans">

            {/* Header / Modification */}
            <div className="w-full max-w-sm flex justify-between items-start mb-6 z-20">
                <Link
                    href="/"
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>

                {isModifiable && (
                    <button
                        onClick={handleModify}
                        disabled={isModifying}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-radisson-blue flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-radisson-blue/30 transition-all bg-white shadow-sm"
                    >
                        {isModifying ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                <RotateCcw className="w-3 h-3" />
                                Modifier ma commande
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Success Animation & Status */}
            <div className="text-center mb-8 z-10 w-full max-w-sm">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-green-500/20">
                    <CheckCircle2 size={32} strokeWidth={3} />
                </div>

                <h1 className="text-xl font-bold text-gray-900 mb-1">
                    {order?.status === 'ready' ? "Commande Prête !" : t('confirmed')}
                </h1>
                <p className="text-sm text-gray-500">
                    Séquence #{orderId?.slice(-6).toUpperCase()}
                </p>
            </div>

            {/* Order Receipt Summary */}
            {orderId && !loading && orderItems.length > 0 && (
                <div
                    className="w-full max-w-sm bg-white p-6 mb-8 text-left relative z-10 shadow-sm border border-gray-100 rounded-2xl"
                >
                    <div className="text-center border-b border-gray-100 pb-4 mb-4">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                            <span>TABLE {order?.table_number}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 font-medium text-sm text-gray-800">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-start w-full">
                                <div className="flex gap-3">
                                    <span className="font-bold text-radisson-blue w-5">{item.quantity}x</span>
                                    <span className="text-gray-700">{getTranslatedContent(language, item.menu_item?.name, item.menu_item?.name_en)}</span>
                                </div>
                                <span className="text-gray-900 font-semibold tabular-nums ml-4">
                                    {formatPrice(item.price_at_order * item.quantity)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                        <span className="font-bold text-gray-500 text-xs uppercase tracking-widest">Total</span>
                        <span className="font-bold text-gray-900 text-xl tracking-tight">
                            {formatPrice(order?.total_price || 0)}
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <Link
                href={lastVisitedMenuUrl || "/"}
                className="w-full max-w-sm bg-radisson-blue text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002545] transition-colors shadow-lg active:scale-95 text-sm"
            >
                <Utensils size={18} />
                Commander autre chose
            </Link>
        </main>
    );
}

export default function OrderConfirmedPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-radisson-light flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-radisson-gold/20 border-t-radisson-gold rounded-full animate-spin" />
        </div>}>
            <OrderConfirmedContent />
        </Suspense>
    );
}
