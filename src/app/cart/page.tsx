"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Send, Clock, Calendar, CheckCircle, Package, XCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export const runtime = 'edge';

// Interface from OrdersPage
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
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');

    // Load History
    useEffect(() => {
        const savedHistory = localStorage.getItem('order_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to load history");
                toast.error("Impossible de charger l'historique.");
            }
        }
    }, []);

    const handleClearHistory = () => {
        if (window.confirm(t('confirm_clear_history') || "Effacer tout l'historique ?")) {
            localStorage.removeItem('order_history');
            setHistory([]);
            toast.success("Historique effacé");
        }
    };

    const handleDeleteOrder = (id: string) => {
        const newHistory = history.filter(o => o.id !== id);
        setHistory(newHistory);
        localStorage.setItem('order_history', JSON.stringify(newHistory));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tableNumber.trim()) {
            toast.error(t('table_required') || "Numéro de table requis");
            return;
        }

        // --- VALIDATION & RATE LIMITING ---
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
                    notes: notes,
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

            // Save to local history
            const newOrder: HistoryItem = {
                id: order.id,
                date: new Date().toISOString(),
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice: totalPrice,
                tableNumber: tableNumber,
                status: 'sent'
            };

            const updatedHistory = [newOrder, ...history];
            localStorage.setItem('order_history', JSON.stringify(updatedHistory));
            localStorage.setItem('last_order_time', now.toString());

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

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="min-h-screen bg-radisson-light pb-32 animate-fade-in pt-20">
            <div className="max-w-3xl mx-auto px-6">

                {/* --- TABS --- */}
                <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-gray-100 mb-8 shadow-soft">
                    <button
                        onClick={() => setActiveTab('cart')}
                        aria-selected={activeTab === 'cart'}
                        className={`flex-1 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'cart'
                            ? "bg-radisson-blue text-white shadow-lg scale-[1.02]"
                            : "text-gray-400 hover:text-radisson-blue hover:bg-white/50"}`}
                    >
                        <ShoppingCart size={14} className={activeTab === 'cart' ? "text-radisson-gold" : ""} aria-hidden="true" />
                        {t('my_cart') || "PANIER"} ({totalItems})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        aria-selected={activeTab === 'history'}
                        className={`flex-1 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'history'
                            ? "bg-radisson-blue text-white shadow-lg scale-[1.02]"
                            : "text-gray-400 hover:text-radisson-blue hover:bg-white/50"}`}
                    >
                        <Clock size={14} className={activeTab === 'history' ? "text-radisson-gold" : ""} aria-hidden="true" />
                        {t('my_orders') || "HISTORIQUE"}
                    </button>
                </div>

                {/* --- TAB CONTENT: CART --- */}
                {activeTab === 'cart' && (
                    <>
                        {items.length === 0 ? (
                            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-soft animate-fade-in-up">
                                <div className="w-20 h-20 bg-radisson-light rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag size={40} className="text-gray-200" />
                                </div>
                                <h2 className="text-xl font-bold text-radisson-blue mb-2">{t('cart_empty')}</h2>
                                <p className="text-gray-400 mb-8 text-sm italic">{t('discover_menus')}</p>
                                <Link
                                    href="/"
                                    className="inline-block bg-radisson-blue text-white px-8 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-radisson-dark transition-all active:scale-95 shadow-md"
                                >
                                    {t('back_to_menu').toUpperCase()}
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xs font-black text-radisson-blue uppercase tracking-[0.2em]">{t('your_selection')}</h2>
                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{totalItems} ARTICLES</span>
                                </div>

                                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden">
                                    <div className="divide-y divide-gray-50">
                                        {items.map((item) => (
                                            <div key={item.id} className="p-4 md:p-6 flex items-center justify-between gap-4 group hover:bg-gray-50/50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-radisson-blue text-sm mb-0.5">{item.name}</h3>
                                                    <p className="text-radisson-gold font-black text-xs">{item.price.toLocaleString()} <span className="text-[8px] opacity-70">FCFA</span></p>
                                                </div>
                                                <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-radisson-blue hover:text-red-500 transition-colors active:scale-90"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-radisson-blue text-xs" aria-live="polite">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-radisson-blue hover:text-green-600 transition-colors active:scale-90"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-radisson-blue p-6 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{t('total_to_pay')}</span>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-white">{totalPrice.toLocaleString()}</span>
                                            <span className="text-[10px] text-radisson-gold font-bold ml-1 uppercase">FCFA</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Formulaire de commande */}
                                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                                    <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
                                        <div className="space-y-5">
                                            <div>
                                                <label htmlFor="table" className="block text-[10px] font-black text-radisson-blue uppercase tracking-widest mb-2">
                                                    {t('table_room_number')} <span className="text-radisson-gold">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id="table"
                                                    required
                                                    value={tableNumber}
                                                    onChange={(e) => setTableNumber(e.target.value)}
                                                    placeholder="Ex: 12 ou Terrasse-1"
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-radisson-blue/20 transition-all text-sm text-radisson-blue font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="notes" className="block text-[10px] font-black text-radisson-blue uppercase tracking-widest mb-2">
                                                    {t('instructions')}
                                                </label>
                                                <textarea
                                                    id="notes"
                                                    rows={2}
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Allergies, cuisson, etc..."
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-radisson-gold/20 transition-all text-sm text-radisson-blue font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-radisson-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-glow hover:bg-radisson-dark transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {t('checkout')}
                                                <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}

                {/* --- TAB CONTENT: HISTORY --- */}
                {activeTab === 'history' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-end mb-4">
                            {history.length > 0 && (
                                <button
                                    onClick={handleClearHistory}
                                    className="text-[10px] font-bold text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} />
                                    Tout effacer
                                </button>
                            )}
                        </div>

                        {history.length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-soft">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Package size={32} className="text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-medium italic text-xs md:text-sm">
                                    Aucune commande dans l&apos;historique.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {history.map((order) => (
                                    <div key={order.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden animate-fade-in-up group relative">
                                        <button
                                            onClick={() => handleDeleteOrder(order.id)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1 z-10"
                                        >
                                            <XCircle size={18} />
                                        </button>
                                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30 pr-12">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-radisson-gold" />
                                                <span className="text-[10px] font-bold text-radisson-blue uppercase tracking-widest">
                                                    {formatDate(order.date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-green-100">
                                                <CheckCircle size={10} />
                                                ENVOYÉE
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-radisson-gold">x{item.quantity}</span>
                                                        <span className="text-radisson-blue font-medium">{item.name}</span>
                                                    </div>
                                                    <span className="text-gray-400 text-xs font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 bg-gray-50/50 flex justify-between items-center border-t border-gray-50">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">TABLE</span>
                                                <span className="text-radisson-blue font-black text-xs">{order.tableNumber}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-radisson-blue">{order.totalPrice.toLocaleString()} FCFA</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
