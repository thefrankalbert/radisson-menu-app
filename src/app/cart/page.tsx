"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, Coffee, IceCream } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number; option?: string; variant?: string }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

interface UpsellItem {
    id: string;
    name: string;
    name_en?: string;
    price: number;
    image_url?: string;
    category_name?: string;
}

// Helper pour générer la clé unique du panier
const getCartItemKey = (item: any): string => {
    let key = item.id;
    if (item.selectedOption) key += `-opt-${item.selectedOption.name_fr}`;
    if (item.selectedVariant) key += `-var-${item.selectedVariant.name_fr}`;
    return key;
};

// Tip step amount (in FCFA)
const TIP_STEP = 500;

export default function CartPage() {
    const { items, updateQuantity, removeFromCart, clearCart, totalPrice, currentRestaurantId, addToCart } = useCart();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [notes, setNotes] = useState("");
    const [tableNumber, setTableNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
    const [upsellType, setUpsellType] = useState<'drinks' | 'desserts' | null>(null);

    // Detect if cart has drinks or desserts
    const cartAnalysis = useMemo(() => {
        const hasDrinks = items.some(item =>
            item.name.toLowerCase().match(/coca|fanta|sprite|eau|water|jus|juice|bière|beer|vin|wine|cocktail|soda|café|coffee|thé|tea/)
        );
        const hasDesserts = items.some(item =>
            item.name.toLowerCase().match(/dessert|glace|ice cream|gâteau|cake|crème|cream|fruit|tarte|mousse|fondant|tiramisu/)
        );
        return { hasDrinks, hasDesserts };
    }, [items]);

    useEffect(() => {
        // Récupérer le numéro de table depuis l'URL ou localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromUrl = urlParams.get('table');
        const savedTable = tableFromUrl || localStorage.getItem('saved_table') || localStorage.getItem('table_number') || '';
        if (savedTable) setTableNumber(savedTable);
    }, []);

    // Fetch upsell suggestions
    useEffect(() => {
        const fetchUpsellItems = async () => {
            if (!currentRestaurantId || items.length === 0) return;

            try {
                // Determine what to suggest
                let categoryFilter = '';
                if (!cartAnalysis.hasDrinks) {
                    setUpsellType('drinks');
                    categoryFilter = 'boisson';
                } else if (!cartAnalysis.hasDesserts) {
                    setUpsellType('desserts');
                    categoryFilter = 'dessert';
                } else {
                    setUpsellType(null);
                    return;
                }

                // Fetch categories matching the filter
                const { data: categories } = await supabase
                    .from('categories')
                    .select('id, name')
                    .ilike('name', `%${categoryFilter}%`);

                if (!categories || categories.length === 0) return;

                const categoryIds = categories.map(c => c.id);

                // Fetch items from those categories
                const { data: menuItems } = await supabase
                    .from('menu_items')
                    .select('id, name, name_en, price, image_url')
                    .in('category_id', categoryIds)
                    .limit(6);

                if (menuItems) {
                    setUpsellItems(menuItems);
                }
            } catch (error) {
                console.error('Error fetching upsell items:', error);
            }
        };

        fetchUpsellItems();
    }, [currentRestaurantId, items.length, cartAnalysis]);

    const handleAddUpsellItem = async (item: UpsellItem) => {
        if (!currentRestaurantId) return;

        await addToCart({
            id: item.id,
            name: item.name,
            name_en: item.name_en,
            price: item.price,
            image_url: item.image_url,
            quantity: 1
        }, currentRestaurantId);

        toast.success(language === 'fr' ? 'Ajouté au panier' : 'Added to cart');
    };

    const finalTotal = totalPrice + tipAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const cleanedTableNumber = tableNumber.trim().toUpperCase();

        if (!cleanedTableNumber) {
            toast.error(t('table_required') || "Numéro de table requis");
            return;
        }

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
                    total_price: finalTotal,
                    tip_amount: tipAmount,
                    notes: notes,
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
                totalPrice: finalTotal,
                tableNumber: cleanedTableNumber,
                status: 'sent'
            };

            const currentHistJSON = localStorage.getItem('order_history');
            const currentHist = currentHistJSON ? JSON.parse(currentHistJSON) : [];
            const updatedHistory = [newOrder, ...currentHist];
            localStorage.setItem('order_history', JSON.stringify(updatedHistory));
            localStorage.setItem('last_order_time', now.toString());
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
        <main className="min-h-screen bg-[#F7F7F7] pb-32 animate-fade-in">
            {/* HEADER */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
                    <Link href="/" className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
                        <ChevronLeft size={24} />
                    </Link>
                    <div className="flex-1 text-center">
                        <h1 className="text-base font-bold text-gray-900">
                            {language === 'fr' ? 'Votre commande' : 'Your order'}
                        </h1>
                        {tableNumber && (
                            <p className="text-xs text-gray-500">Table {tableNumber}</p>
                        )}
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={() => {
                                if (confirm(language === 'fr' ? 'Vider le panier ?' : 'Clear cart?')) {
                                    clearCart();
                                }
                            }}
                            className="p-2 -mr-2 text-gray-400 hover:text-red-500"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pt-4">
                {items.length === 0 ? (
                    <div className="bg-white rounded-lg p-12 text-center border border-gray-200 mt-4">
                        <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">{t('cart_empty')}</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            {language === 'fr' ? 'Ajoutez des articles pour commencer' : 'Add items to get started'}
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-[#002C5F] text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-[#003B7A] transition-colors"
                        >
                            {language === 'fr' ? 'Parcourir le menu' : 'Browse menu'}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* SECTION: PANIER */}
                        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900">
                                    {language === 'fr' ? 'Panier' : 'Cart'}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {language === 'fr'
                                        ? 'Pour toute allergie alimentaire, veuillez contacter le restaurant'
                                        : 'For any food allergies, please contact the restaurant'}
                                </p>
                            </div>

                            <div className="divide-y divide-gray-100">
                                <AnimatePresence mode="popLayout">
                                    {items.map((item) => {
                                        const itemKey = getCartItemKey(item);
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
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                className="px-4 py-3 flex items-start gap-3"
                                            >
                                                {/* Quantity */}
                                                <span className="text-sm font-bold text-[#C5A065] min-w-[28px]">
                                                    {item.quantity}x
                                                </span>

                                                {/* Name & Options */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-900 leading-tight">
                                                        {item.name}
                                                    </h3>
                                                    {(optionLabel || variantLabel) && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {[variantLabel, optionLabel].filter(Boolean).join(' • ')}
                                                        </p>
                                                    )}

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                                                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="text-sm font-medium text-gray-700 w-6 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                                                            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(itemKey)}
                                                            className="ml-2 text-gray-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Price - aligned right */}
                                                <span className="text-sm font-bold text-gray-900 text-right min-w-[70px]">
                                                    {formatPrice(item.price * item.quantity)}
                                                </span>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            {/* Special Instructions - Inside cart section */}
                            <div className="px-4 py-3 border-t border-gray-100">
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder={language === 'fr' ? "Ajouter une remarque (optionnel)" : "Add a note (optional)"}
                                    className="w-full text-sm bg-transparent text-gray-500 placeholder:text-gray-400 focus:outline-none focus:text-gray-700 transition-colors cursor-text"
                                />
                            </div>
                        </section>

                        {/* SECTION: UPSELL SUGGESTIONS */}
                        {upsellType && upsellItems.length > 0 && (
                            <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                    {upsellType === 'drinks' ? (
                                        <Coffee size={16} className="text-[#C5A065]" />
                                    ) : (
                                        <IceCream size={16} className="text-[#C5A065]" />
                                    )}
                                    <h2 className="text-sm font-bold text-gray-900">
                                        {upsellType === 'drinks'
                                            ? (language === 'fr' ? 'Soif ?' : 'Thirsty?')
                                            : (language === 'fr' ? 'Une petite douceur ?' : 'Something sweet?')
                                        }
                                    </h2>
                                </div>

                                <div className="p-3 overflow-x-auto scrollbar-hide">
                                    <div className="flex gap-3 min-w-max">
                                        {upsellItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="w-[120px] flex-shrink-0 bg-white rounded-lg p-2 border border-gray-200"
                                            >
                                                <div className="w-full h-16 bg-gray-100 rounded-md mb-2 overflow-hidden relative">
                                                    {item.image_url ? (
                                                        <Image
                                                            src={item.image_url}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            {upsellType === 'drinks' ? <Coffee size={20} /> : <IceCream size={20} />}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight mb-1">
                                                    {language === 'en' && item.name_en ? item.name_en : item.name}
                                                </h3>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-[#C5A065]">
                                                        {formatPrice(item.price)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddUpsellItem(item)}
                                                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[#C5A065] hover:bg-[#C5A065] hover:text-white hover:border-[#C5A065] transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SECTION: POURBOIRE - Stepper Style */}
                        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {language === 'fr' ? 'Pourboire serveur(se)' : 'Server tip'}
                                    </span>
                                    <span className="text-base">😊</span>
                                </div>

                                {/* Stepper Control */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTipAmount(prev => prev === 1000 ? 0 : Math.max(0, prev - 500))}
                                        disabled={tipAmount === 0}
                                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${tipAmount === 0
                                                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Minus size={20} />
                                    </button>

                                    <span className="text-lg font-bold text-gray-900 min-w-[100px] text-center">
                                        {formatPrice(tipAmount)}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setTipAmount(prev => prev === 0 ? 1000 : prev + 500)}
                                        className="w-10 h-10 rounded-full border border-[#00CCBC] text-[#00CCBC] flex items-center justify-center hover:bg-[#00CCBC]/10 transition-all active:scale-90"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: RÉCAPITULATIF */}
                        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h2 className="text-sm font-bold text-gray-900">
                                    {language === 'fr' ? 'Récapitulatif' : 'Summary'}
                                </h2>
                            </div>

                            <div className="px-4 py-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        {language === 'fr' ? 'Sous-total' : 'Subtotal'}
                                    </span>
                                    <span className="text-gray-900">{formatPrice(totalPrice)}</span>
                                </div>

                                {tipAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#C5A065]">
                                            {language === 'fr' ? 'Pourboire' : 'Tip'}
                                        </span>
                                        <span className="text-[#C5A065] font-medium">{formatPrice(tipAmount)}</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-black text-gray-900">{formatPrice(finalTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </form>
                )}
            </div>

            {/* STICKY FOOTER CTA */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe">
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-500">
                                {language === 'fr' ? 'Total de la commande' : 'Order total'}
                            </span>
                            <span className="text-lg font-black text-gray-900">{formatPrice(finalTotal)}</span>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-[#00CCBC] text-white h-14 rounded-xl font-bold text-lg hover:bg-[#00B4A6] transition-all flex items-center justify-center shadow-lg shadow-[#00CCBC]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span>{language === 'fr' ? 'Finaliser la commande' : 'Finalize order'}</span>
                            )}
                        </motion.button>
                    </div>
                </div>
            )}
        </main>
    );
}
