"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { Utensils, ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { getTranslatedContent } from "@/utils/translation";
import OrderReceiptCard, { OrderItem } from "@/components/OrderReceiptCard";

function OrderConfirmedContent() {
    const { lastVisitedMenuUrl, addToCart, clearCart } = useCart();
    const { language } = useLanguage();
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
            const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderData) setOrder(orderData);

            const { data: itemsData } = await supabase
                .from('order_items')
                .select(`id, quantity, price_at_order, menu_item_id, menu_item:menu_items ( name, name_en )`)
                .eq('order_id', orderId);

            if (itemsData) setOrderItems(itemsData);
        } catch (e) {
            toast.error(language === 'fr' ? "Erreur de chargement" : "Loading error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderDetails();

        const channel = supabase.channel(`order_sync_${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(payload.new);
                if (payload.new.status === 'ready') {
                    toast.success(language === 'fr' ? "Votre commande est prête !" : "Your order is ready!");
                } else if (payload.new.status === 'preparing') {
                    toast.success(language === 'fr' ? "La cuisine prépare votre commande" : "Kitchen is preparing your order");
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

        let timerRef: NodeJS.Timeout | null = null;

        const calculateTime = () => {
            const created = new Date(order.created_at).getTime();
            const now = Date.now();
            const elapsed = now - created;
            const remaining = Math.max(0, EDIT_WINDOW - elapsed);
            setTimeLeft(remaining);
            if (remaining <= 0 && timerRef) {
                clearInterval(timerRef);
            }
        };

        calculateTime();
        timerRef = setInterval(calculateTime, 1000);
        return () => {
            if (timerRef) clearInterval(timerRef);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    const handleModify = async () => {
        if (!order || order.status !== 'pending' || (timeLeft !== null && timeLeft <= 0)) {
            toast.error(language === 'fr' ? "Modification impossible" : "Cannot modify");
            return;
        }

        if (!confirm(language === 'fr'
            ? "Modifier la commande ? Elle sera renvoyée vers votre panier."
            : "Modify order? It will be sent back to your cart."
        )) return;

        setIsModifying(true);
        try {
            const { error: deleteError } = await supabase.from('orders').delete().eq('id', orderId);
            if (deleteError) throw deleteError;

            clearCart();

            for (const item of orderItems) {
                await addToCart({
                    id: item.menu_item_id,
                    name: item.menu_item.name,
                    name_en: item.menu_item.name_en,
                    price: item.price_at_order,
                    quantity: item.quantity
                }, order.restaurant_id, true);
            }

            toast.success(language === 'fr' ? "Commande récupérée dans le panier" : "Order restored to cart");
            router.push('/cart');
        } catch (e) {
            toast.error(language === 'fr' ? "Erreur lors de la modification" : "Error modifying order");
            setIsModifying(false);
        }
    };

    const isModifiable = order?.status === 'pending' && timeLeft !== null && timeLeft > 0;

    // Transform orderItems to OrderItem format
    const formattedItems: OrderItem[] = orderItems.map(item => ({
        name: getTranslatedContent(language, item.menu_item?.name, item.menu_item?.name_en),
        quantity: item.quantity,
        price: item.price_at_order
    }));

    const getOrderStatus = (): "pending" | "preparing" | "ready" | "delivered" | "sent" => {
        if (order?.status === 'ready') return 'ready';
        if (order?.status === 'preparing') return 'preparing';
        if (order?.status === 'pending') return 'pending';
        return 'sent';
    };

    return (
        <main className="min-h-screen bg-[#F7F7F7] flex flex-col items-center px-4 py-6 font-sans">
            {/* Header */}
            <div className="w-full max-w-md">
                <div className="flex items-center justify-center relative mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="absolute left-0 p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                        {order?.status === 'ready'
                            ? (language === 'fr' ? 'Commande Prête' : 'Order Ready')
                            : (language === 'fr' ? 'Commande Confirmée' : 'Order Confirmed')
                        }
                    </h1>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#003366] rounded-full animate-spin" />
                    </div>
                )}

                {/* Order Receipt Card */}
                {!loading && orderId && orderItems.length > 0 && (
                    <OrderReceiptCard
                        id={orderId}
                        tableNumber={order?.table_number || 'N/A'}
                        items={formattedItems}
                        totalPrice={order?.total_price || 0}
                        status={getOrderStatus()}
                        showModifyButton={isModifiable}
                        isModifying={isModifying}
                        onModify={handleModify}
                        className="mb-6"
                    />
                )}

                {/* CTA Button */}
                {!loading && (
                    <Link
                        href={lastVisitedMenuUrl || "/"}
                        className="w-full bg-[#003366] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#002545] transition-colors active:scale-[0.98] text-sm"
                    >
                        <Utensils size={18} />
                        {language === 'fr' ? 'Commander autre chose' : 'Order something else'}
                    </Link>
                )}
            </div>
        </main>
    );
}

export default function OrderConfirmedPage() {
    return (
        <Suspense fallback={
            <div className="h-screen bg-[#F7F7F7] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-[#003366] rounded-full animate-spin" />
            </div>
        }>
            <OrderConfirmedContent />
        </Suspense>
    );
}
