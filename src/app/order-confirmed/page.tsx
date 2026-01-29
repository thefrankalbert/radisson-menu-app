"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { Utensils, Home, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";



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
                .select(`id, quantity, price_at_order, menu_item_id, menu_item:menu_items ( name )`)
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

    // Timer Logic
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

    const formatCountdown = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleModify = async () => {
        if (!order || order.status !== 'pending' || (timeLeft !== null && timeLeft <= 0)) {
            toast.error("Modification impossible");
            return;
        }

        if (!confirm("Annuler et modifier la commande ? Elle sera renvoyée vers votre panier.")) return;

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
        <main className="h-screen bg-radisson-light flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden font-sans">
            {/* Success Animation */}
            <div className={`mb-8 relative z-10 transition-all duration-700 ${isModifiable ? 'scale-90 opacity-80' : 'scale-100'}`}>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-soft border-4 border-gray-50/50 animate-bounce-in">
                    <CheckCircle2 size={40} className="text-green-500 animate-scale-up" strokeWidth={3} />
                </div>
                <div className="absolute -bottom-2 w-20 h-4 bg-green-500/20 blur-xl rounded-full" />
            </div>

            <div className="z-10 space-y-2 mb-6">
                <h1 className="text-xl md:text-2xl font-black text-radisson-blue tracking-tight">
                    {order?.status === 'ready' ? "Commande Prête !" : t('confirmed')}
                </h1>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] opacity-80">
                    SÉQUENCE #{orderId?.slice(-6).toUpperCase()}
                </p>
            </div>

            {/* Timer Banner - Nova Style */}
            {isModifiable && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="z-10 mb-6 bg-white border border-blue-100 rounded-md p-4 shadow-sm max-w-sm w-full"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-900">Fenêtre d'édition</span>
                        </div>
                        <span className="font-mono text-sm font-black text-blue-600 tabular-nums">{formatCountdown(timeLeft!)}</span>
                    </div>
                    <button
                        onClick={handleModify}
                        disabled={isModifying}
                        className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isModifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Modifier la commande"}
                    </button>
                    <p className="text-[8px] text-gray-400 font-bold uppercase mt-2 tracking-tighter">
                        L'édition sera verrouillée si la cuisine commence à préparer
                    </p>
                </motion.div>
            )}

            {/* Order Receipt Summary */}
            {orderId && !loading && orderItems.length > 0 && (
                <div
                    className="w-full max-w-sm shadow-sm drop-shadow-sm p-6 mb-8 text-left relative z-10 animate-fade-in-up mx-auto"
                    style={{
                        background: `
                            linear-gradient(to bottom, white 0%, white calc(100% - 10px), transparent calc(100% - 10px)),
                            radial-gradient(circle at 10px bottom, transparent 10px, white 10.5px)
                        `,
                        backgroundSize: '100% 100%, 20px 20px',
                        backgroundPosition: '0 0, bottom left',
                        backgroundRepeat: 'no-repeat, repeat-x',
                        paddingBottom: '35px'
                    }}
                >
                    <div className="text-center border-b border-dashed border-gray-200 pb-4 mb-4">
                        <h2 className="text-lg font-black text-gray-900 tracking-tighter mb-0.5">RADISSON BLU</h2>
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            <span>REÇU DE COMMANDE</span>
                            <span className="w-1 h-1 bg-gray-200 rounded-full" />
                            <span>TABLE {order?.table_number}</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 font-mono text-xs text-gray-800">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-baseline w-full">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-black opacity-40">{item.quantity}x</span>
                                    <span className="uppercase text-[11px] font-bold">{item.menu_item?.name}</span>
                                </div>
                                <div className="flex-1 border-b border-dotted border-gray-200 mx-1.5 opacity-30 h-1" />
                                <span className="font-black text-[11px] tabular-nums">{formatPrice(item.price_at_order * item.quantity)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-end">
                        <span className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Total Net</span>
                        <span className="font-black text-gray-900 text-lg font-mono tracking-tighter">
                            {formatPrice(order?.total_price || 0)}
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-[280px] relative z-10">
                <Link
                    href={lastVisitedMenuUrl || "/"}
                    className="bg-radisson-blue text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-lg text-[10px] uppercase tracking-[0.2em]"
                >
                    <Utensils size={14} />
                    Poursuivre la Carte
                </Link>
                <Link
                    href="/"
                    className="text-gray-400 py-2 font-bold text-[9px] uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                    Retour à l'accueil
                </Link>
            </div>
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
