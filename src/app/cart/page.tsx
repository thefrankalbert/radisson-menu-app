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
    const { items, totalPrice, totalItems, updateQuantity, clearCart, restaurantId, lastVisitedMenuUrl } = useCart();
    const { t } = useLanguage();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'cart' | 'history'>('cart');
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // Form State
    const [tableNumber, setTableNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load History logic
    useEffect(() => {
        const savedHistory = localStorage.getItem("radisson_order_history");
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                toast.error("Impossible de charger l'historique.");
            }
        }
    }, [activeTab]); // Refresh when tab changes

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDeleteOrder = (id: string) => {
        const newHistory = history.filter(order => order.id !== id);
        setHistory(newHistory);
        localStorage.setItem("radisson_order_history", JSON.stringify(newHistory));
    };

    const handleClearHistory = () => {
        if (window.confirm(t('confirm_clear_history') || "Effacer tout l'historique ?")) {
            setHistory([]);
            localStorage.removeItem("radisson_order_history");
        }
    };

    const [lastOrderTime, setLastOrderTime] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validation de base
        if (items.length === 0) return;

        if (!tableNumber || tableNumber.trim().length === 0) {
            toast.error("Veuillez renseigner votre numéro de table.");
            return;
        }

        // 2. Validation Format (Sécurité & Stabilité)
        const tableRegex = /^[a-zA-Z0-9\s-]+$/;
        if (!tableRegex.test(tableNumber)) {
            toast.error("Format de numéro de table invalide.");
            return;
        }

        if (tableNumber.length > 10) {
            toast.error("Le numéro de table est trop long.");
            return;
        }

        // 3. Rate Limiting (Sécurité anti-spam)
        const now = Date.now();
        if (now - lastOrderTime < 30000) { // 30 secondes entre deux commandes
            toast.error("Veuillez patienter avant de passer une nouvelle commande.");
            return;
        }

        if (!restaurantId) {
            toast.error("Erreur: Restaurant non identifié.");
            return;
        }

        setIsSubmitting(true);
        setLastOrderTime(now);

        try {
            const { data: order, error: orderError } = await supabase
                .from("orders")
                .insert([
                    {
                        restaurant_id: restaurantId,
                        table_number: tableNumber,
                        total_price: totalPrice,
                        status: "pending",
                    },
                ])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderItems = items.map((item) => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price_at_order: item.price,
            }));

            const { error: itemsError } = await supabase
                .from("order_items")
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // --- Save to Local History ---
            const historyJson = localStorage.getItem("radisson_order_history");
            const historyArr = historyJson ? JSON.parse(historyJson) : [];
            const newOrderHistoryEntry = {
                id: order.id,
                date: new Date().toISOString(),
                items: items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalPrice,
                tableNumber,
                status: "pending"
            };
            historyArr.unshift(newOrderHistoryEntry);
            localStorage.setItem("radisson_order_history", JSON.stringify(historyArr));
            // ----------------------------

            clearCart();
            toast.success("Votre commande a été envoyée avec succès !");
            router.push(`/order-confirmed?orderId=${order.id}`);
        } catch (error) {
            toast.error(t("error_sending_order") || "Une erreur est survenue lors de l'envoi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Logic
    return (
        <main className="min-h-screen bg-radisson-light pb-24 pt-32 animate-fade-in">
            <div className="max-w-2xl mx-auto px-4">

                {/* Tab Navigation */}
                <div className="flex p-1 bg-gray-100/80 rounded-xl mb-8 border border-gray-200">
                    <button
                        onClick={() => setActiveTab('cart')}
                        aria-label={`Voir mon panier (${totalItems} articles)`}
                        aria-selected={activeTab === 'cart'}
                        role="tab"
                        className={`flex-1 py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'cart'
                            ? "bg-white text-radisson-blue shadow-sm scale-[1.02]"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <ShoppingCart size={14} className={activeTab === 'cart' ? "text-radisson-gold" : ""} aria-hidden="true" />
                        {t('my_cart') || "PANIER"} ({totalItems})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        aria-label="Voir mon historique de commandes"
                        aria-selected={activeTab === 'history'}
                        role="tab"
                        className={`flex-1 py-3 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'history'
                            ? "bg-white text-radisson-blue shadow-sm scale-[1.02]"
                            : "text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        <Clock size={14} className={activeTab === 'history' ? "text-radisson-gold" : ""} aria-hidden="true" />
                        {t('my_orders') || "HISTORIQUE"}
                    </button>
                </div>

                {/* --- TAB CONTENT: CART --- */}
                {activeTab === 'cart' && (
                    <>
                        {totalItems === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-soft">
                                    <ShoppingBag size={32} className="text-gray-200" />
                                </div>
                                <h2 className="text-xl font-bold text-radisson-blue mb-2">{t('cart_empty')}</h2>
                                <Link href="/" className="text-radisson-gold font-bold text-sm uppercase tracking-widest hover:underline decoration-2 underline-offset-8">
                                    {t('discover_menus')}
                                </Link>
                            </div>
                        ) : (
                            <div className="animate-fade-in-up">
                                {/* Back Button */}
                                <Link
                                    href={lastVisitedMenuUrl || "/"}
                                    aria-label="Retourner au menu du restaurant"
                                    className="inline-flex items-center gap-2 text-radisson-blue font-bold text-[10px] tracking-[0.2em] mb-6 hover:text-radisson-gold transition-colors"
                                >
                                    <ArrowLeft size={14} aria-hidden="true" />
                                    {t('back_to_menu').toUpperCase()}
                                </Link>

                                {/* Item List */}
                                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden mb-6">
                                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                        <h2 className="text-xs font-black text-radisson-blue uppercase tracking-[0.2em]">{t('your_selection')}</h2>
                                        <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">{totalItems} ARTICLES</span>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-[40vh] overflow-y-auto">
                                        {items.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-radisson-blue text-sm mb-0.5">{item.name}</h3>
                                                    <p className="text-radisson-gold font-bold text-xs">
                                                        {item.price.toLocaleString()} FCFA
                                                    </p>
                                                </div>
                                                <div className="flex items-center bg-gray-50 rounded-xl p-0.5 border border-gray-100">
                                                    <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Retirer un exemplaire de ${item.name}`} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-radisson-blue hover:text-red-500 transition-colors shadow-sm active:scale-90">
                                                        {item.quantity === 1 ? <Trash2 size={14} aria-hidden="true" /> : <Minus size={14} aria-hidden="true" />}
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-radisson-blue text-xs" aria-live="polite">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Ajouter un exemplaire de ${item.name}`} className="w-8 h-8 rounded-lg bg-radisson-blue flex items-center justify-center text-white hover:bg-radisson-dark transition-colors shadow-sm active:scale-90">
                                                        <Plus size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-4 flex justify-between items-center border-t border-gray-50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('total_to_pay')}</span>
                                        <span className="text-lg font-black text-radisson-blue">
                                            {totalPrice.toLocaleString()} <span className="text-[10px] text-radisson-gold ml-0.5">FCFA</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="table" className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
                                                    {t('table_room_number')} <span className="text-radisson-gold">*</span>
                                                </label>
                                                <input
                                                    id="table"
                                                    type="text"
                                                    required
                                                    value={tableNumber}
                                                    onChange={(e) => setTableNumber(e.target.value)}
                                                    placeholder="Ex: 12, Table 5, Suite 304..."
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-radisson-gold/20 transition-all text-sm text-radisson-blue font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="notes" className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 ml-1">
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
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex gap-2">
                                                        <span className="font-black text-radisson-gold">x{item.quantity}</span>
                                                        <span className="text-radisson-blue font-medium">{item.name}</span>
                                                    </div>
                                                    <span className="text-gray-400 text-xs font-bold">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="p-4 border-t border-gray-50 flex justify-between items-end bg-gray-50/10">
                                            <div>
                                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Délivré à</span>
                                                <span className="text-radisson-blue font-black text-xs">{order.tableNumber}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total payé</span>
                                                <span className="text-lg font-black text-radisson-blue">
                                                    {order.totalPrice.toLocaleString()} <span className="text-[10px] text-radisson-gold ml-0.5">FCFA</span>
                                                </span>
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
