"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import Link from "next/link";
import { Utensils, Home, CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";



function OrderConfirmedContent() {
    const { lastVisitedMenuUrl } = useCart();
    const { t } = useLanguage();
    const { formatPrice } = useCurrency();
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

            {/* Success Animation */}
            <div className="mb-8 relative z-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-soft border-4 border-gray-50/50 animate-bounce-in">
                    <CheckCircle2 size={48} className="text-green-500 animate-scale-up" strokeWidth={3} aria-hidden="true" />
                </div>
                <div className="absolute -bottom-2 w-24 h-4 bg-green-500/20 blur-xl rounded-full" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-radisson-blue mb-4 tracking-tight z-10">
                {t('confirmed')}
            </h1>

            <p className="text-gray-500 mb-8 max-w-[300px] leading-relaxed text-sm font-medium z-10">
                {t('success_msg')}
            </p>

            {/* Order Receipt / Summary - TICKET STYLE */}
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
                        paddingBottom: '30px'
                    }}
                >
                    <div className="text-center border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter mb-1">BLU TABLE</h2>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {t('order_summary')}
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 font-mono text-sm text-gray-800">
                        {orderItems.map((item) => (
                            <div key={item.id} className="flex flex-col">
                                <div className="flex justify-between items-baseline w-full">
                                    <div className="flex items-baseline gap-2">
                                        <span className="font-bold">{item.quantity}x</span>
                                        <span className="uppercase text-xs md:text-sm">{item.menu_item?.name}</span>
                                    </div>
                                    <div className="flex-1 border-b border-dotted border-gray-300 mx-2 relative top-[-4px] opacity-30"></div>
                                    <span className="font-bold">{formatPrice(item.price_at_order * item.quantity)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 pt-4 flex justify-between items-end">
                        <span className="font-bold text-gray-400 uppercase text-xs tracking-widest">{t('total_to_pay')}</span>
                        <span className="font-black text-gray-900 text-xl font-mono">
                            {formatPrice(totalPrice)}
                        </span>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-[280px] relative z-10">
                <Link
                    href={lastVisitedMenuUrl || "/"}
                    aria-label="Poursuivre la commande"
                    className="bg-radisson-blue text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-radisson-dark transition-all active:scale-95 shadow-soft text-sm border border-transparent"
                >
                    <Utensils size={18} aria-hidden="true" />
                    {t('complete_order')}
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
