"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Minus, Plus, ShoppingBag, Send, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";



interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

export default function CartPage() {
    const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems, currentRestaurantId } = useCart();
    const { t } = useLanguage();
    const router = useRouter();
    const [notes, setNotes] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Try to load saved table number
        const savedTable = localStorage.getItem('saved_table') || localStorage.getItem('table_number');
        if (savedTable) setTableNumber(savedTable);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tableNumber.trim()) {
            toast.error(t('table_required') || "Numéro de table requis");
            return;
        }

        const lastOrderTime = localStorage.getItem('last_order_time');
        const now = Date.now();
        if (lastOrderTime && now - parseInt(lastOrderTime) < 30000) {
            toast.error("Veuillez attendre 30 secondes entre chaque commande.");
            return;
        }

        const tableRegex = /^[a-zA-Z0-9\s-]{1,10}$/;
        if (!tableRegex.test(tableNumber)) {
            toast.error("Numéro de table invalide (max 10 caractères, alphanumérique).");
            return;
        }

        if (!currentRestaurantId) {
            toast.error("Erreur: Restaurant non identifié.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    restaurant_id: currentRestaurantId,
                    table_number: tableNumber,
                    total_price: totalPrice,
                    status: 'pending'
                })
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price_at_order: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            const newOrder: HistoryItem = {
                id: order.id,
                date: new Date().toISOString(),
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice: totalPrice,
                tableNumber: tableNumber,
                status: 'sent'
            };

            const currentHistJSON = localStorage.getItem('order_history');
            const currentHist = currentHistJSON ? JSON.parse(currentHistJSON) : [];
            const updatedHistory = [newOrder, ...currentHist];
            localStorage.setItem('order_history', JSON.stringify(updatedHistory));
            localStorage.setItem('last_order_time', now.toString());
            // Save Table Number for future convenience
            localStorage.setItem('saved_table', tableNumber);

            clearCart();
            toast.success(t('order_sent_success'));
            router.push(`/order-confirmed?orderId=${order.id}`);
        } catch (error) {
            console.error('Error submitting order:', error);
            toast.error(t("error_sending_order") || "Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F5F5F5] pb-24 animate-fade-in pt-20">
            <div className="max-w-md mx-auto px-4">

                {/* TITRE REDUIT */}
                <h1 className="text-lg font-bold text-gray-800 mb-6 text-center uppercase tracking-widest">
                    {t('my_cart')}
                </h1>

                {items.length === 0 ? (
                    <div className="bg-white rounded-sm p-12 text-center shadow-sm border border-gray-200">
                        <ShoppingBag size={32} className="text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">{t('cart_empty')}</h2>
                        {/* BOUTON RETOUR SUPPRIME */}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="pb-10">
                        {/* TICKET DE CAISSE REALISTE + ZIGZAG CSS */}
                        {/* On combine un background blanc pour le haut et le radial gradient pour le bas */}
                        <div
                            className="shadow-sm drop-shadow-sm p-6 relative mx-auto mb-0"
                            style={{
                                background: `
                                    linear-gradient(to bottom, white 0%, white calc(100% - 10px), transparent calc(100% - 10px)),
                                    radial-gradient(circle at 10px bottom, transparent 10px, white 10.5px)
                                `,
                                backgroundSize: '100% 100%, 20px 20px',
                                backgroundPosition: '0 0, bottom left',
                                backgroundRepeat: 'no-repeat, repeat-x',
                                paddingBottom: '30px',
                                // filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' // Optionnel pour l'ombre réaliste qui suit la découpe
                            }}
                        >

                            {/* HEADER TICKET */}
                            <div className="text-center border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                                <h2 className="text-xl font-black text-gray-900 tracking-tighter mb-1">BLU TABLE</h2>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em]">Radisson Blu N&apos;Djamena</p>
                                <div className="mt-3 flex justify-between text-[10px] font-mono text-gray-500">
                                    <span>{new Date().toLocaleDateString('fr-FR')}</span>
                                    <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            {/* LISTE COMPACTE */}
                            <div className="space-y-3 font-mono text-xs md:text-sm text-gray-800">
                                {items.map((item) => (
                                    <div key={item.id} className="flex flex-col">
                                        <div className="flex justify-between items-baseline w-full">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold">{item.quantity}x</span>
                                                <span className="uppercase">{item.name}</span>
                                            </div>
                                            <div className="flex-1 border-b border-dotted border-gray-300 mx-2 relative top-[-4px] opacity-30"></div>
                                            <span className="font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>

                                        {/* OPTION CONTROLS (DISCRET) */}
                                        <div className="flex items-center gap-3 mt-1 pl-6 opacity-60 hover:opacity-100 transition-opacity">
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-[10px] font-bold">{item.quantity}</span>
                                            <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">
                                                <Plus size={12} />
                                            </button>
                                            <button type="button" onClick={() => removeFromCart(item.id)} className="ml-2 text-red-400 hover:text-red-600">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTAL */}
                            <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Total</span>
                                    <span className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                                        {totalPrice.toLocaleString()} <span className="text-xs text-gray-400 font-sans">FCFA</span>
                                    </span>
                                </div>
                            </div>

                            {/* INPUT TABLE MINIMALISTE INTERNE AU TICKET */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex items-end gap-4">
                                    <label htmlFor="table" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap pb-2">
                                        Table / Chambre
                                    </label>
                                    <input
                                        type="text"
                                        id="table"
                                        required
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        placeholder="N°"
                                        className="w-full border-b border-gray-300 bg-transparent py-1 text-center font-mono font-bold text-gray-900 focus:border-black focus:outline-none transition-colors rounded-none placeholder:text-gray-200"
                                    />
                                </div>
                                <div className="mt-4">
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Instructions (optionnel)..."
                                        className="w-full text-xs border-b border-gray-200 bg-transparent py-1 text-gray-600 focus:border-black focus:outline-none transition-colors rounded-none italic"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BOUTON VALIDER - DANS LE FLUX NORMAL (mt-6) */}
                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#002C5F] text-white h-14 rounded-xl shadow-lg font-black text-sm uppercase tracking-widest hover:bg-[#003B7A] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle size={18} className="text-[#C8A882]" />
                                        <span>Valider la commande</span>
                                        <Send size={16} className="ml-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}
