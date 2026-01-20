"use client";

import { useEffect, useState, useMemo } from "react";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    X,
    Printer,
    CreditCard,
    Banknote,
    QrCode,
    Clock,
    ChevronDown,
    Receipt,
    StickyNote,
    Calculator,
    ArrowRight,
    Utensils,
    FileText,
    RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import PaymentModal from "@/components/admin/PaymentModal";

type MenuItem = {
    id: string;
    name: string;
    name_en?: string;
    price: number;
    image_url?: string;
    category_id: string;
    is_available: boolean;
};

type Category = {
    id: string;
    name: string;
    name_en?: string;
    restaurant_id: string;
};

type CartItem = MenuItem & {
    quantity: number;
    notes?: string;
};

type Restaurant = {
    id: string;
    name: string;
    slug: string;
};

export default function POSPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>("all");
    const [selectedTable, setSelectedTable] = useState<string>("");

    // Modals
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesText, setNotesText] = useState("");

    // Order number
    const [orderNumber, setOrderNumber] = useState(() => {
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('pos_order_number');
        if (stored) {
            const { date, number } = JSON.parse(stored);
            if (date === today) return number;
        }
        return 1;
    });

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load restaurants
            const { data: restosData } = await supabase
                .from('restaurants')
                .select('id, name, slug')
                .eq('is_active', true);
            setRestaurants(restosData || []);

            // Load categories
            const { data: catsData } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });
            setCategories(catsData || []);

            // Load menu items
            const { data: itemsData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('is_available', true)
                .order('name');
            setMenuItems(itemsData || []);

        } catch (error) {
            console.error('Erreur chargement données:', error);
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        let items = menuItems;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.name_en?.toLowerCase().includes(query)
            );
        }

        if (selectedCategory !== "all") {
            items = items.filter(item => item.category_id === selectedCategory);
        }

        if (selectedRestaurant !== "all") {
            const restaurantCats = categories.filter(c => c.restaurant_id === selectedRestaurant).map(c => c.id);
            items = items.filter(item => restaurantCats.includes(item.category_id));
        }

        return items;
    }, [menuItems, searchQuery, selectedCategory, selectedRestaurant, categories]);

    // Filtered categories based on selected restaurant
    const filteredCategories = useMemo(() => {
        if (selectedRestaurant === "all") return categories;
        return categories.filter(c => c.restaurant_id === selectedRestaurant);
    }, [categories, selectedRestaurant]);

    // Cart functions
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId);
            if (!item) return prev;

            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                return prev.filter(i => i.id !== itemId);
            }
            return prev.map(i =>
                i.id === itemId ? { ...i, quantity: newQty } : i
            );
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prev => prev.filter(i => i.id !== itemId));
    };

    const clearCart = () => {
        if (cart.length === 0) return;
        if (confirm('Vider le panier ?')) {
            setCart([]);
        }
    };

    const saveNotes = (itemId: string) => {
        setCart(prev => prev.map(i =>
            i.id === itemId ? { ...i, notes: notesText } : i
        ));
        setEditingNotes(null);
        setNotesText("");
    };

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = 0; // TODO: Implement discount logic
    const total = subtotal - discount;

    // Send to Kitchen (KOT)
    const sendToKitchen = async () => {
        if (cart.length === 0) {
            toast.error('Le panier est vide');
            return;
        }

        if (!selectedTable) {
            toast.error('Veuillez sélectionner une table');
            return;
        }

        try {
            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    table_number: selectedTable,
                    status: 'pending',
                    total_price: total
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                menu_item_id: item.id,
                quantity: item.quantity,
                price_at_order: item.price,
                notes: item.notes || null
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            toast.success(`Commande #${orderNumber} envoyée en cuisine !`);

            // Increment order number
            const newNumber = orderNumber + 1;
            setOrderNumber(newNumber);
            localStorage.setItem('pos_order_number', JSON.stringify({
                date: new Date().toISOString().split('T')[0],
                number: newNumber
            }));

            // Clear cart
            setCart([]);

        } catch (error) {
            console.error('Erreur envoi commande:', error);
            toast.error('Erreur lors de l\'envoi');
        }
    };

    // Open payment
    const openPayment = () => {
        if (cart.length === 0) {
            toast.error('Le panier est vide');
            return;
        }
        setShowPaymentModal(true);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <CreditCard className="w-12 h-12 text-[#C5A065] mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600 font-medium">Chargement de la caisse...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-80px)] flex gap-4">
            {/* Left: Products Grid */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Point of Sale (POS)</h1>
                        <p className="text-sm text-gray-500">Dashboard › Caisse</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium text-sm">
                            <Plus className="w-4 h-4" />
                            Nouveau
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                            <QrCode className="w-4 h-4" />
                            QR Commandes
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm">
                            <FileText className="w-4 h-4" />
                            Brouillons
                        </button>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un produit..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#003058]/20 focus:border-[#003058] outline-none transition-all"
                        />
                    </div>

                    {/* Restaurant Filter */}
                    <div className="relative">
                        <select
                            value={selectedRestaurant}
                            onChange={(e) => {
                                setSelectedRestaurant(e.target.value);
                                setSelectedCategory("all");
                            }}
                            className="appearance-none px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-[#003058]/20 focus:border-[#003058] outline-none cursor-pointer"
                        >
                            <option value="all">Toutes les cartes</option>
                            {restaurants.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedCategory === "all"
                                ? "bg-orange-500 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        Tout
                    </button>
                    {filteredCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                selectedCategory === cat.id
                                    ? "bg-orange-500 text-white"
                                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {filteredItems.map(item => {
                            const inCart = cart.find(i => i.id === item.id);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10 transition-all text-left"
                                >
                                    {/* Image */}
                                    <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Utensils className="w-8 h-8 text-gray-300" />
                                        </div>
                                        {inCart && (
                                            <div className="absolute top-2 right-2 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                {inCart.quantity}
                                            </div>
                                        )}
                                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <Plus className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-3">
                                        <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        <p className="text-orange-500 font-bold text-sm">
                                            {item.price.toLocaleString()} <span className="text-xs font-normal">FCFA</span>
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {filteredItems.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Utensils className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Cart Panel */}
            <div className="w-[360px] flex-shrink-0 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden shadow-sm">
                {/* Cart Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher client existant..."
                                className="text-sm text-gray-600 bg-transparent outline-none w-full"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Dining Selection */}
                        <select className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none">
                            <option>Sur place</option>
                            <option>À emporter</option>
                            <option>Livraison</option>
                        </select>

                        {/* Table Selection */}
                        <input
                            type="text"
                            placeholder="Table..."
                            value={selectedTable}
                            onChange={(e) => setSelectedTable(e.target.value)}
                            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {/* Order Number */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">Commande #{orderNumber}</span>
                    <button
                        onClick={clearCart}
                        className="ml-auto text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                        Vider
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <Receipt className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">Panier vide</p>
                            <p className="text-gray-400 text-sm">Cliquez sur un produit pour l'ajouter</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                                <div className="flex items-start gap-3">
                                    {/* Image placeholder */}
                                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <Utensils className="w-5 h-5 text-gray-400" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</h4>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-orange-500 font-bold text-sm mt-0.5">
                                            {item.price.toLocaleString()} × {item.quantity} = {(item.price * item.quantity).toLocaleString()} FCFA
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center bg-white rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-700"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="px-3 font-bold text-sm text-gray-900">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="p-1.5 text-gray-500 hover:text-gray-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    setEditingNotes(item.id);
                                                    setNotesText(item.notes || "");
                                                }}
                                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-lg border border-gray-200"
                                            >
                                                <StickyNote className="w-3 h-3" />
                                                {item.notes ? "Modifier note" : "Ajouter note"}
                                            </button>
                                        </div>

                                        {/* Notes */}
                                        {item.notes && !editingNotes && (
                                            <p className="text-xs text-gray-500 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                📝 {item.notes}
                                            </p>
                                        )}

                                        {/* Notes Editor */}
                                        {editingNotes === item.id && (
                                            <div className="mt-2">
                                                <textarea
                                                    value={notesText}
                                                    onChange={(e) => setNotesText(e.target.value)}
                                                    placeholder="Note pour la cuisine..."
                                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => saveNotes(item.id)}
                                                        className="flex-1 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingNotes(null);
                                                            setNotesText("");
                                                        }}
                                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200"
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Cart Summary */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sous-total</span>
                            <span className="font-medium text-gray-900">{subtotal.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Réduction</span>
                            <span className="font-medium text-emerald-600 cursor-pointer hover:underline">✏️ {discount.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span className="text-orange-500">{total.toLocaleString()} FCFA</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={sendToKitchen}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-[#003058] text-white font-bold rounded-xl hover:bg-[#002040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            KOT & Imprimer
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => {/* Save as draft */}}
                                disabled={cart.length === 0}
                                className="py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                <FileText className="w-4 h-4" />
                                Brouillon
                            </button>
                            <button
                                onClick={openPayment}
                                disabled={cart.length === 0}
                                className="py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                                <CreditCard className="w-4 h-4" />
                                Paiement
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                orderNumber={orderNumber}
                total={total}
                items={cart}
                onPaymentComplete={() => {
                    setCart([]);
                    const newNumber = orderNumber + 1;
                    setOrderNumber(newNumber);
                    localStorage.setItem('pos_order_number', JSON.stringify({
                        date: new Date().toISOString().split('T')[0],
                        number: newNumber
                    }));
                }}
            />
        </div>
    );
}
