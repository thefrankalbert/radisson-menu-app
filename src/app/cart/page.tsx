"use client";

import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { supabase } from "@/lib/supabase";
import { Minus, Plus, ShoppingBag, Trash2, ChevronLeft, Coffee, IceCream, Package, Utensils } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "@/components/EmptyState";
import ProductImage from "@/components/ui/ProductImage";
import { getTranslatedContent } from "@/utils/translation";

interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number; option?: string; variant?: string }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

interface CartRecommendation {
    type: 'drinks' | 'desserts' | 'mains';
    title: { fr: string; en: string };
    searchQuery: string;
    categorySlug?: string;
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
    const { items, updateQuantity, removeFromCart, clearCart, totalPrice, currentRestaurantId, addToCart, notes, setNotes } = useCart();
    const { t, language } = useLanguage();
    const { formatPrice } = useCurrency();
    const router = useRouter();
    const [tableNumber, setTableNumber] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
    const [activeRecommendation, setActiveRecommendation] = useState<CartRecommendation | null>(null);
    const [restoSlug, setRestoSlug] = useState<string | null>(null);

    // Detect cart content by category
    const cartAnalysis = useMemo(() => {
        const hasMain = items.some(item =>
            item.category_name?.toLowerCase().match(/plat|main|spécialité|grillade|burgers/) ||
            item.name.toLowerCase().match(/riz|brochette|burger|filet|entrecôte|poulet|poisson|braisé|pâtes|pasta/)
        );
        const hasDrinks = items.some(item =>
            item.category_name?.toLowerCase().match(/boisson|drink|cocktail|wine|vin|coffee|cafe|thé|tea|soft|soda|bière|beer/) ||
            item.name.toLowerCase().match(/coca|fanta|sprite|eau|water|jus|juice|bière|beer|vin|wine|cocktail|soda|café|coffee|thé|tea|tonic|ginger/)
        );
        const hasDesserts = items.some(item =>
            item.category_name?.toLowerCase().match(/dessert|glace|sucre|sweet|fruit|pâtisserie/) ||
            item.name.toLowerCase().match(/dessert|glace|ice cream|gâteau|cake|crème|cream|fruit|tarte|mousse|fondant|tiramisu|salade de fruit/)
        );
        const hasStarters = items.some(item =>
            item.category_name?.toLowerCase().match(/entrée|starter|snack|tapas|apéritif/) ||
            item.name.toLowerCase().match(/entrée|starter|salade|soup|velouté|nems|samoussa/)
        );

        return { hasMain, hasDrinks, hasDesserts, hasStarters };
    }, [items]);

    useEffect(() => {
        // Récupérer le numéro de table depuis l'URL ou localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const tableFromUrl = urlParams.get('table');
        const savedTable = tableFromUrl || localStorage.getItem('saved_table') || localStorage.getItem('table_number') || '';
        if (savedTable) setTableNumber(savedTable);
    }, []);

    const [isLoadingUpsell, setIsLoadingUpsell] = useState(false);

    // Fetch upsell suggestions
    useEffect(() => {
        const fetchUpsellItems = async () => {
            if (!currentRestaurantId || items.length === 0) {
                setActiveRecommendation(null);
                setUpsellItems([]);
                return;
            }

            setIsLoadingUpsell(true);
            try {
                let recommendation: CartRecommendation | null = null;

                // Decision logic
                if (cartAnalysis.hasMain && !cartAnalysis.hasDrinks) {
                    recommendation = {
                        type: 'drinks',
                        title: { fr: 'Une boisson fraîche ?', en: 'A fresh drink?' },
                        searchQuery: 'boisson',
                        categorySlug: 'Boissons'
                    };
                } else if (cartAnalysis.hasMain && cartAnalysis.hasDrinks && !cartAnalysis.hasDesserts) {
                    recommendation = {
                        type: 'desserts',
                        title: { fr: 'Une petite douceur ?', en: 'Something sweet?' },
                        searchQuery: 'dessert',
                        categorySlug: 'Desserts'
                    };
                } else if (cartAnalysis.hasStarters && !cartAnalysis.hasMain) {
                    recommendation = {
                        type: 'mains',
                        title: { fr: 'Un plat de résistance ?', en: 'A main course?' },
                        searchQuery: 'plat',
                        categorySlug: 'Plats'
                    };
                } else if (cartAnalysis.hasMain && cartAnalysis.hasDrinks && cartAnalysis.hasDesserts) {
                    // Fallback to drinks (specific types like Wine/Cocktails if exists, or just boisson)
                    recommendation = {
                        type: 'drinks',
                        title: { fr: 'Un dernier verre ?', en: 'One last drink?' },
                        searchQuery: 'boisson',
                        categorySlug: 'Boissons'
                    };
                }

                if (!recommendation) {
                    setActiveRecommendation(null);
                    setUpsellItems([]);
                    setIsLoadingUpsell(false);
                    return;
                }

                setActiveRecommendation(recommendation);

                // Determine restaurant IDs to search in (handle Panorama/Lobby + Drinks)
                let searchRestaurantIds = [currentRestaurantId];

                // Fetch current restaurant slug if not already known to check for compatibility
                let effectiveRestoSlug = restoSlug;
                if (!effectiveRestoSlug) {
                    const { data: currentResto } = await supabase
                        .from('restaurants')
                        .select('slug')
                        .eq('id', currentRestaurantId)
                        .single();
                    if (currentResto) {
                        effectiveRestoSlug = currentResto.slug;
                        setRestoSlug(effectiveRestoSlug);
                    }
                }

                // If Panorama or Lobby, also look in Drinks restaurant
                if (effectiveRestoSlug && (effectiveRestoSlug.includes('panorama') || effectiveRestoSlug.includes('lobby'))) {
                    const { data: drinksResto } = await supabase
                        .from('restaurants')
                        .select('id')
                        .eq('slug', 'carte-des-boissons')
                        .single();
                    if (drinksResto && !searchRestaurantIds.includes(drinksResto.id)) {
                        searchRestaurantIds.push(drinksResto.id);
                    }
                }

                // Fetch categories with improved search terms
                let categoryQuery = supabase
                    .from('categories')
                    .select('id, name, name_en, restaurants!inner(id, slug)')
                    .in('restaurants.id', searchRestaurantIds);

                // More inclusive search filter
                if (recommendation.type === 'drinks') {
                    categoryQuery = categoryQuery.or('name.ilike.%boisson%,name.ilike.%soda%,name.ilike.%jus%,name.ilike.%bière%,name.ilike.%vin%,name.ilike.%cocktail%,name.ilike.%spiritueux%');
                } else if (recommendation.type === 'desserts') {
                    categoryQuery = categoryQuery.or('name.ilike.%dessert%,name.ilike.%douceur%,name.ilike.%glace%,name.ilike.%fruit%');
                } else {
                    categoryQuery = categoryQuery.ilike('name', `%${recommendation.searchQuery}%`);
                }

                const { data: categories } = await categoryQuery;

                if (!categories || categories.length === 0) {
                    setIsLoadingUpsell(false);
                    return;
                }

                // Update categorySlug with the first category name (case-sensitive) for accurate navigation
                recommendation.categorySlug = categories[0].name;

                const categoryIds = categories.map(c => c.id);

                // Fetch items with category name for cart analysis
                const { data: menuItems } = await supabase
                    .from('menu_items')
                    .select('id, name, name_en, price, image_url, category_id, categories(name)')
                    .in('category_id', categoryIds)
                    .eq('is_available', true)
                    .limit(6);

                if (menuItems) {
                    setUpsellItems(menuItems.map((mi: any) => ({
                        id: mi.id,
                        name: mi.name,
                        name_en: mi.name_en,
                        price: mi.price,
                        image_url: mi.image_url,
                        category_name: mi.categories?.name
                    })));
                }

                // Also fetch the restaurant slug for navigation
                if (currentRestaurantId) {
                    const { data: resto } = await supabase
                        .from('restaurants')
                        .select('slug')
                        .eq('id', currentRestaurantId)
                        .single();
                    if (resto) setRestoSlug(resto.slug);
                }
            } catch (error) {
                console.error('Error fetching upsell items:', error);
            } finally {
                setIsLoadingUpsell(false);
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
            category_name: item.category_name,
            quantity: 1
        }, currentRestaurantId);

        toast.success(language === 'fr' ? 'Ajouté au panier' : 'Added to cart');
    };

    const finalTotal = totalPrice + tipAmount;

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault();

        // Auto-assign table number if not provided (Dev mode / QR not scanned)
        let cleanedTableNumber = tableNumber.trim().toUpperCase();

        if (!cleanedTableNumber) {
            // Fallback: Check localStorage again or use default
            const savedTable = localStorage.getItem('saved_table') || localStorage.getItem('table_number');
            if (savedTable) {
                cleanedTableNumber = savedTable.trim().toUpperCase();
            } else {
                // Dev/Auto fallback - don't block the user
                cleanedTableNumber = 'AUTO-01';
                console.log('Table number auto-assigned:', cleanedTableNumber);
            }
        }

        // Validate format only if it looks like a real table number (not auto-assigned)
        if (!cleanedTableNumber.startsWith('AUTO')) {
            const tableRegex = /^[A-Z0-9-]{1,15}$/;
            if (!tableRegex.test(cleanedTableNumber)) {
                // Silently fix invalid format
                cleanedTableNumber = cleanedTableNumber.replace(/[^A-Z0-9-]/g, '').slice(0, 15) || 'AUTO-01';
            }
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
            // Essayer d'abord avec les colonnes minimales requises
            const baseOrderData = {
                restaurant_id: currentRestaurantId,
                table_number: cleanedTableNumber,
                total_price: finalTotal,
                status: 'pending'
            };

            let order: any = null;
            let orderError: any = null;

            // Première tentative: avec notes et tip_amount
            const fullOrderData = {
                ...baseOrderData,
                notes: notes || null,
                ...(tipAmount > 0 ? { tip_amount: tipAmount } : {})
            };

            const result1 = await supabase
                .from('orders')
                .insert(fullOrderData)
                .select()
                .single();

            order = result1.data;
            orderError = result1.error;

            // Si erreur, réessayer sans les colonnes optionnelles
            if (orderError) {
                console.warn('First attempt failed:', orderError.message || orderError.code);

                // Deuxième tentative: sans tip_amount
                const result2 = await supabase
                    .from('orders')
                    .insert({ ...baseOrderData, notes: notes || null })
                    .select()
                    .single();

                if (!result2.error) {
                    order = result2.data;
                    orderError = null;
                } else {
                    // Troisième tentative: colonnes minimales seulement
                    const result3 = await supabase
                        .from('orders')
                        .insert(baseOrderData)
                        .select()
                        .single();

                    if (!result3.error) {
                        order = result3.data;
                        orderError = null;
                    } else {
                        orderError = result3.error;
                    }
                }
            }

            if (orderError || !order) {
                console.error('All order insert attempts failed:', orderError);
                throw new Error(
                    orderError?.message ||
                    orderError?.details ||
                    orderError?.hint ||
                    'Impossible de créer la commande. Vérifiez votre connexion.'
                );
            }

            const orderItems = items.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price_at_order: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Order items insert error:', itemsError);
                throw new Error(itemsError.message || 'Erreur lors de l\'ajout des articles');
            }

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
        } catch (error: any) {
            console.error('Error submitting order:', error?.message || error);
            const errorMsg = error?.message || error?.details || "Une erreur est survenue";
            toast.error(language === 'fr'
                ? `Erreur: ${errorMsg}`
                : `Error: ${errorMsg}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F7F7F7] pb-44 animate-fade-in">
            {/* HEADER - Only show if items > 0 */}
            {items.length > 0 && (
                <div className="sticky top-0 z-40 bg-white border-b border-gray-200 animate-fade-in-down">
                    <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex-1 text-center">
                            <h1 className="text-base font-bold text-gray-900">
                                {language === 'fr' ? 'Votre commande' : 'Your order'}
                            </h1>
                            {tableNumber && (
                                <p className="text-xs text-gray-500">Table {tableNumber}</p>
                            )}
                        </div>
                        <button
                            onClick={() => {
                                if (confirm(language === 'fr' ? 'Vider le panier ?' : 'Clear cart?')) {
                                    clearCart();
                                }
                            }}
                            className="p-2 -mr-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Title for Empty State (Standardized with History) */}
            {items.length === 0 && (
                <div className="max-w-lg mx-auto px-4 pt-10 pb-2 relative flex items-center justify-center">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-4 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 uppercase tracking-widest">
                        {language === 'fr' ? 'Votre commande' : 'Your order'}
                    </h1>
                </div>
            )}

            <div className="max-w-lg mx-auto px-4 pt-4">
                {items.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title={language === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
                        subtitle={language === 'fr'
                            ? 'Découvrez nos délices et commencez votre festin !'
                            : 'Explore our menu and start your feast!'}
                        actionLabel={language === 'fr' ? 'Voir le menu' : 'Browse menu'}
                        actionHref="/"
                    />
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
                                                        {getTranslatedContent(language, item.name, item.name_en)}
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
                        <AnimatePresence>
                            {(isLoadingUpsell || (activeRecommendation && upsellItems.length > 0)) && (
                                <motion.section
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-gradient-to-br from-white to-gray-50/50 rounded-lg border border-gray-200 overflow-hidden shadow-sm"
                                >
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {activeRecommendation?.type === 'drinks' ? (
                                                <Coffee size={16} className="text-[#C5A065]" />
                                            ) : activeRecommendation?.type === 'desserts' ? (
                                                <IceCream size={16} className="text-[#C5A065]" />
                                            ) : (
                                                <Utensils size={16} className="text-[#C5A065]" />
                                            )}
                                            <h2 className="text-sm font-bold text-gray-900">
                                                {isLoadingUpsell ? (
                                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                                                ) : (
                                                    language === 'fr' ? activeRecommendation?.title.fr : activeRecommendation?.title.en
                                                )}
                                            </h2>
                                        </div>
                                        {!isLoadingUpsell && activeRecommendation && (
                                            <Link
                                                href={restoSlug && activeRecommendation.categorySlug ? `/menu/${restoSlug}?section=${encodeURIComponent(activeRecommendation.categorySlug)}` : '/'}
                                                className="text-[11px] font-bold text-[#00CCBC] hover:underline uppercase tracking-wider"
                                            >
                                                {language === 'fr' ? 'Voir tout →' : 'See all →'}
                                            </Link>
                                        )}
                                    </div>

                                    <div className="p-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                                        <div className="flex gap-3 min-w-max px-1">
                                            {isLoadingUpsell ? (
                                                // Loading State for Carousel
                                                [1, 2, 3].map((i) => (
                                                    <div key={i} className="w-[130px] flex-shrink-0 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm animate-pulse">
                                                        <div className="w-full h-20 bg-gray-100 rounded-lg mb-2" />
                                                        <div className="h-3 w-3/4 bg-gray-100 rounded mb-1" />
                                                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                                    </div>
                                                ))
                                            ) : (
                                                upsellItems.map((item) => (
                                                    <motion.div
                                                        key={item.id}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="w-[130px] flex-shrink-0 bg-white rounded-xl p-2.5 border border-gray-100 shadow-sm snap-start"
                                                    >
                                                        <div className="w-full h-20 rounded-lg mb-2.5 overflow-hidden relative">
                                                            <ProductImage
                                                                src={item.image_url}
                                                                alt={item.name}
                                                                className="w-full h-full rounded-lg"
                                                                iconSize={20}
                                                            />
                                                            <div className="absolute top-1 right-1 z-10">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleAddUpsellItem(item)}
                                                                    className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#C5A065] hover:bg-[#C5A065] hover:text-white transition-all active:scale-90"
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <h3 className="text-[11px] font-bold text-gray-800 line-clamp-2 leading-tight mb-2 h-7">
                                                            {getTranslatedContent(language, item.name, item.name_en)}
                                                        </h3>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-black text-[#C5A065]">
                                                                {formatPrice(item.price)}
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* SECTION: POURBOIRE (carte séparée) */}
                        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900">
                                        {language === 'fr' ? 'Pourboire' : 'Tip'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTipAmount(prev => prev === 1000 ? 0 : Math.max(0, prev - 500))}
                                            disabled={tipAmount === 0}
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${tipAmount === 0
                                                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 active:scale-95'
                                                }`}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="text-sm font-bold text-gray-900 min-w-[80px] text-center">
                                            {formatPrice(tipAmount)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setTipAmount(prev => prev === 0 ? 1000 : prev + 500)}
                                            className="w-8 h-8 rounded-full border border-[#C5A065] text-[#C5A065] flex items-center justify-center hover:bg-[#C5A065]/10 transition-all active:scale-95"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* SECTION: RÉCAPITULATIF */}
                        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 space-y-3">
                                {/* Sous-total */}
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">
                                        {language === 'fr' ? 'Sous-total' : 'Subtotal'}
                                    </span>
                                    <span className="text-gray-900 font-medium">{formatPrice(totalPrice)}</span>
                                </div>

                                {/* Pourboire (affichage seulement si > 0) */}
                                {tipAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">
                                            {language === 'fr' ? 'Pourboire' : 'Tip'}
                                        </span>
                                        <span className="text-gray-900 font-medium">{formatPrice(tipAmount)}</span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t border-gray-200 pt-3">
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

            {/* STICKY FOOTER CTA - Au-dessus du BottomNav */}
            {items.length > 0 && (
                <div className="fixed bottom-[64px] left-0 right-0 z-[60] bg-white border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                    <div className="max-w-lg mx-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full bg-[#14b8a6] text-white h-14 rounded-lg font-bold text-lg hover:bg-[#0d9488] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
