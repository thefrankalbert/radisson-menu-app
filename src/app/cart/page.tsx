"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { Minus, Plus, ShoppingBag, Send, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";



interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number; option?: string; variant?: string }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

// Helper pour générer la clé unique du panier
const getCartItemKey = (item: any): string => {
    let key = item.id;
    if (item.selectedOption) key += `-opt-${item.selectedOption.name_fr}`;
    if (item.selectedVariant) key += `-var-${item.selectedVariant.name_fr}`;
    return key;
};

export default function CartPage() {
    const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems, currentRestaurantId } = useCart();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [notes, setNotes] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Récupérer le numéro de table depuis l'URL ou localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromUrl = urlParams.get('table');
        const savedTable = tableFromUrl || localStorage.getItem('saved_table') || localStorage.getItem('table_number') || '';
        if (savedTable) setTableNumber(savedTable);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Nettoyer et valider le numéro de table
        const cleanedTableNumber = tableNumber.trim().toUpperCase();

        if (!cleanedTableNumber) {
            toast.error(t('table_required') || "Numéro de table requis");
            return;
        }

        // Regex: lettres, chiffres et tirets uniquement (pas d'espaces), 1-10 caractères
        const tableRegex = /^[A-Z0-9-]{1,10}$/;
        if (!tableRegex.test(cleanedTableNumber)) {
            toast.error(language === 'fr'
                ? "Numéro de table invalide (ex: P01, L05, PE03)"
                : "Invalid table number (e.g., P01, L05, PE03)");
            return;
        }

        const lastOrderTime = localStorage.getItem('last_order_time');
        const now = Date.now();
        if (lastOrderTime && now - parseInt(lastOrderTime) < 30000) {
            toast.error(language === 'fr'
                ? "Veuillez attendre 30 secondes entre chaque commande."
                : "Please wait 30 seconds between orders.");
            return;
        }

        if (!currentRestaurantId) {
            toast.error(language === 'fr'
                ? "Erreur: Restaurant non identifié."
                : "Error: Restaurant not identified.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    restaurant_id: currentRestaurantId,
                    table_number: cleanedTableNumber,
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
                items: items.map(i => ({
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    option: i.selectedOption?.name_fr,
                    variant: i.selectedVariant?.name_fr
                })),
                totalPrice: totalPrice,
                tableNumber: cleanedTableNumber,
                status: 'sent'
            };

            const currentHistJSON = localStorage.getItem('order_history');
            const currentHist = currentHistJSON ? JSON.parse(currentHistJSON) : [];
            const updatedHistory = [newOrder, ...currentHist];
            localStorage.setItem('order_history', JSON.stringify(updatedHistory));
            localStorage.setItem('last_order_time', now.toString());
            // Sauvegarder le numéro de table nettoyé pour la prochaine fois
            localStorage.setItem('saved_table', cleanedTableNumber);

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
        <main className="min-h-screen bg-[#F5F5F5] pb-24 animate-fade-in pt-4">
            <div className="max-w-md mx-auto px-4">

                {/* TITRE REDUIT */}
                <h1 className="text-lg font-bold text-gray-800 mb-6 text-center uppercase tracking-widest">
                    {language === 'fr' ? 'Ma Commande' : 'My Order'}
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
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{
                                background: `
                                    linear-gradient(to bottom, white 0%, white calc(100% - 10px), transparent calc(100% - 10px)),
                                    radial-gradient(circle at 10px bottom, transparent 10px, white 10.5px)
                                `,
                                backgroundSize: '100% 100%, 20px 20px',
                                backgroundPosition: '0 0, bottom left',
                                backgroundRepeat: 'no-repeat, repeat-x',
                                paddingBottom: '30px',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                            className="shadow-sm drop-shadow-sm p-6 relative mx-auto mb-0 scrollbar-hide"
                        >

                            {/* HEADER TICKET */}
                            <div className="border-b-2 border-dashed border-gray-200 pb-4 mb-4">
                                <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <span>{new Date().toLocaleDateString('fr-FR')}</span>
                                        <span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    {tableNumber && (
                                        <span className="text-gray-400 font-bold">
                                            {language === 'fr' ? `N° de table ${tableNumber}` : `Table N° ${tableNumber}`}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* LISTE COMPACTE */}
                            <div className="space-y-3 font-mono text-xs md:text-sm text-gray-800">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => {
                                        const itemKey = getCartItemKey(item);
                                        // Affichage option/variante selon la langue
                                        const optionLabel = item.selectedOption
                                            ? (language === 'en' && item.selectedOption.name_en ? item.selectedOption.name_en : item.selectedOption.name_fr)
                                            : null;
                                        const variantLabel = item.selectedVariant
                                            ? (language === 'en' && item.selectedVariant.name_en ? item.selectedVariant.name_en : item.selectedVariant.name_fr)
                                            : null;

                                        return (
                                            <motion.div
                                                key={itemKey}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="flex flex-col"
                                            >
                                                <div className="flex justify-between items-baseline w-full">
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="font-bold">{item.quantity}x</span>
                                                        <span className="uppercase">{item.name}</span>
                                                    </div>
                                                    <div className="flex-1 border-b border-dotted border-gray-300 mx-2 relative top-[-4px] opacity-30"></div>
                                                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                                                </div>

                                                {/* Afficher option/variante si présente */}
                                                {(optionLabel || variantLabel) && (
                                                    <div className="pl-8 text-[10px] text-gray-500 mt-0.5">
                                                        {variantLabel && <span className="mr-2">({variantLabel})</span>}
                                                        {optionLabel && <span className="italic">{optionLabel}</span>}
                                                    </div>
                                                )}

                                                {/* OPTION CONTROLS (DISCRET) */}
                                                <div className="flex items-center gap-3 mt-1 pl-6 opacity-60 hover:opacity-100 transition-opacity">
                                                    <motion.button whileTap={{ scale: 0.8 }} type="button" onClick={() => updateQuantity(itemKey, item.quantity - 1)} className="p-1 hover:bg-gray-100 rounded">
                                                        <Minus size={12} />
                                                    </motion.button>
                                                    <span className="text-[10px] font-bold">{item.quantity}</span>
                                                    <motion.button whileTap={{ scale: 0.8 }} type="button" onClick={() => updateQuantity(itemKey, item.quantity + 1)} className="p-1 hover:bg-gray-100 rounded">
                                                        <Plus size={12} />
                                                    </motion.button>
                                                    <motion.button whileTap={{ scale: 0.8 }} type="button" onClick={() => removeFromCart(itemKey)} className="ml-2 text-red-400 hover:text-red-600">
                                                        <Trash2 size={12} />
                                                    </motion.button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* TOTAL */}
                            <div className="border-t-2 border-dashed border-gray-200 mt-6 pt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Total</span>
                                    <span className="text-2xl font-black font-mono text-gray-900 tracking-tight">
                                        {formatPrice(totalPrice)}
                                    </span>
                                </div>
                            </div>

                            {/* INPUT TABLE MINIMALISTE INTERNE AU TICKET */}
                            {/* SOUHAITS PARTICULIERS (NOTE) -> TABLE */}
                            <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                                <div>
                                    <label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">
                                        {language === 'fr' ? 'Suppléments' : 'Supplements'}
                                    </label>
                                    <input
                                        type="text"
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder={language === 'fr' ? "Une préférence, une allergie..." : "Preferences, allergies..."}
                                        className="w-full text-sm border-b border-gray-200 bg-transparent py-2 text-gray-600 focus:border-radisson-blue focus:outline-none transition-colors rounded-none italic placeholder:text-gray-200"
                                    />
                                </div>

                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-6"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#002C5F] text-white h-14 rounded-xl shadow-lg font-black text-sm uppercase tracking-widest hover:bg-[#003B7A] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <span>Valider</span>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                )}
            </div>
        </main>
    );
}
