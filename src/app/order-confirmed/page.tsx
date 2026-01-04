"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { Utensils, Home, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

export default function OrderConfirmedPage() {
    const { lastVisitedMenuUrl } = useCart();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [orderItems, setOrderItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        if (orderId) {
            const fetchOrderDetails = async () => {
                try {
                    // First fetch order to verify status and get total
                    const { data: orderData, error: orderError } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', orderId)
                        .single();

                    if (orderData) setTotalPrice(orderData.total_price);

                    // Fetch Items
                    const { data: items, error: itemsError } = await supabase
                        .from('order_items')
                        .select(`
                    id, 
                    quantity,
                    price_at_order,
                    menu_item:menu_items ( name )
                `)
                        .eq('order_id', orderId);

                    if (items) setOrderItems(items);
                } catch (e) {
                    toast.error("Une erreur est survenue lors de la récupération des détails de la commande.");
                } finally {
                    setLoading(false);
                }
            };
            fetchOrderDetails();
        } else {
            setLoading(false);
        }
    }, [orderId]);

    return (
        <main className="h-screen bg-radisson-light flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent opacity-50 pointer-events-none" />

            {/* Success Animation */}
            <div className="mb-8 relative z-10">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-bounce-in">
                    <CheckCircle2 size={48} className="text-green-500 animate-scale-up" strokeWidth={3} />
                </div>
                <div className="absolute -bottom-2 w-24 h-4 bg-green-500/20 blur-xl rounded-full" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-radisson-blue mb-4 tracking-tight z-10">
                {t('confirmed')}
            </h1>

            <p className="text-gray-500 mb-8 max-w-[300px] leading-relaxed text-sm font-medium z-10">
                {t('success_msg')}
            </p>

            {/* Order Receipt / Summary */}
            {orderId && !loading && orderItems.length > 0 && (
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-soft border border-gray-100 p-6 mb-8 text-left relative z-10 animate-fade-in-up">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">
                        {t('order_summary')}
                    </div>
                    <div className="space-y-3 mb-4">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-radisson-blue font-bold">
                                    {item.quantity}x {item.menu_item?.name}
                                </span>
                                <span className="text-gray-500">
                                    {(item.price_at_order * item.quantity).toLocaleString()} <span className="text-[10px]">FCFA</span>
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-50 pt-2 flex justify-between items-center">
                        <span className="font-bold text-radisson-blue uppercase text-xs">{t('total_to_pay')}</span>
                        <span className="font-black text-radisson-gold text-lg">
                            {totalPrice.toLocaleString()} <span className="text-xs text-radisson-blue">FCFA</span>
                        </span>
                    </div>
                    {/* Receipt Visuals */}
                    <div className="absolute -bottom-1 left-0 w-full h-2 bg-radial-tooth bg-[length:16px_16px] opacity-10" />
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-[280px] relative z-10">
                <Link
                    href={lastVisitedMenuUrl || "/"}
                    className="bg-radisson-blue text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-radisson-dark transition-all active:scale-95 shadow-md text-sm border border-transparent"
                >
                    <Utensils size={18} />
                    {t('complete_order')}
                </Link>

                <Link
                    href="/"
                    className="bg-white text-gray-400 py-3 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 hover:text-radisson-blue transition-all active:scale-95 border border-gray-100 text-xs tracking-widest uppercase"
                >
                    <Home size={16} />
                    {t('home')}
                </Link>
            </div>
        </main>
    );
}
