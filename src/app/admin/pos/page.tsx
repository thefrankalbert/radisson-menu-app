"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
    Search,
    Plus,
    Minus,
    Trash2,
    X,
    Printer,
    CreditCard,
    QrCode,
    ChevronDown,
    Receipt,
    StickyNote,
    Utensils,
    FileText,
    ArrowRight,
    SearchX,
    ShoppingBag,
    History
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import PaymentModal from "@/components/admin/PaymentModal";
import { cn } from "@/lib/utils";
import { POSSkeleton } from "@/components/admin/Skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const [serviceType, setServiceType] = useState<string>("Sur place");

    // Modals
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesText, setNotesText] = useState("");

    // Order number logic
    const [orderNumber, setOrderNumber] = useState(1);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const today = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('pos_order_number');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (parsed.date === today) setOrderNumber(parsed.number || 1);
                } catch (e) { /* ignore */ }
            }
        }
    }, []);

    const updateOrderNumber = useCallback((newNum: number) => {
        setOrderNumber(newNum);
        localStorage.setItem('pos_order_number', JSON.stringify({
            date: new Date().toISOString().split('T')[0],
            number: newNum
        }));
    }, []);

    // Load Data
    const loadData = async () => {
        try {
            const [restosRes, catsRes, itemsRes] = await Promise.all([
                supabase.from('restaurants').select('id, name, slug').eq('is_active', true),
                supabase.from('categories').select('*').order('display_order', { ascending: true }),
                supabase.from('menu_items').select('*').eq('is_available', true).order('name')
            ]);

            if (restosRes.data) setRestaurants(restosRes.data);
            if (catsRes.data) setCategories(catsRes.data);
            if (itemsRes.data) setMenuItems(itemsRes.data);
        } catch (e) {
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Real-time sync: écoute les changements sur menu_items et categories
        const channel = supabase.channel('pos_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                loadData(); // Recharge quand un plat est modifié
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                loadData(); // Recharge quand une catégorie est modifiée
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Filtering
    const filteredItems = useMemo(() => {
        let items = menuItems;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(q) || i.name_en?.toLowerCase().includes(q));
        }
        if (selectedCategory !== "all") {
            items = items.filter(i => i.category_id === selectedCategory);
        }
        if (selectedRestaurant !== "all") {
            const restaurantCats = categories.filter(c => c.restaurant_id === selectedRestaurant).map(c => c.id);
            items = items.filter(i => restaurantCats.includes(i.category_id));
        }
        return items;
    }, [menuItems, searchQuery, selectedCategory, selectedRestaurant, categories]);

    const filteredCategories = useMemo(() => {
        if (selectedRestaurant === "all") return categories;
        return categories.filter(c => c.restaurant_id === selectedRestaurant);
    }, [categories, selectedRestaurant]);

    // Cart Logic
    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, delta: number) => {
        setCart(prev => {
            const item = prev.find(i => i.id === itemId);
            if (!item) return prev;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return prev.filter(i => i.id !== itemId);
            return prev.map(i => i.id === itemId ? { ...i, quantity: newQty } : i);
        });
    };

    const saveNotes = (itemId: string) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, notes: notesText } : i));
        setEditingNotes(null);
        setNotesText("");
    };

    const clearCart = () => {
        if (cart.length > 0 && confirm("Vider le panier ?")) setCart([]);
    };

    // Totals
    const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    // Database Actions
    const createOrderRecord = async (status: 'pending' | 'preparing' | 'ready' | 'delivered') => {
        if (cart.length === 0) throw new Error("Panier vide");

        let finalRestaurantId = selectedRestaurant;
        if (finalRestaurantId === "all" && cart.length > 0) {
            const cat = categories.find(c => c.id === cart[0].category_id);
            if (cat) finalRestaurantId = cat.restaurant_id;
        }

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                table_number: selectedTable || 'POS',
                status: status,
                total_price: total,
                restaurant_id: finalRestaurantId !== "all" ? finalRestaurantId : null,
                service_type: serviceType
            })
            .select().single();

        if (orderError) throw orderError;

        const orderItems = cart.map(item => ({
            order_id: order.id,
            menu_item_id: item.id,
            quantity: item.quantity,
            price_at_order: item.price,
            notes: item.notes || null
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        return order;
    };

    const handleKOT = async () => {
        try {
            await createOrderRecord('pending');
            toast.success("Envoyé en cuisine !");
            updateOrderNumber(orderNumber + 1);
            setCart([]);
        } catch (e) {
            toast.error("Erreur d'envoi");
        }
    };

    const handlePaymentComplete = async () => {
        try {
            await createOrderRecord('delivered');
            toast.success("Vente réussie !");
            updateOrderNumber(orderNumber + 1);
            setCart([]);
            setShowPaymentModal(false);
        } catch (e) {
            toast.error("Erreur finale");
        }
    };

    if (loading) return <POSSkeleton />;

    return (
        <div className="h-[calc(100vh-6rem)] flex bg-muted/30 overflow-hidden font-sans">
            {/* Left side: Search and Items */}
            <div className="flex-1 flex flex-col p-6 min-w-0">
                {/* Search & Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un plat..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 bg-card border border-border rounded-md text-sm font-semibold text-foreground focus:ring-1 focus:ring-ring transition-all outline-none"
                        />
                    </div>
                    <Select value={selectedRestaurant} onValueChange={(value) => { setSelectedRestaurant(value); setSelectedCategory("all"); }}>
                        <SelectTrigger className="h-12 w-[180px] text-xs font-bold uppercase tracking-wider">
                            <SelectValue placeholder="Tout Radisson" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tout Radisson</SelectItem>
                            {restaurants.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Categories Flow */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-4 scrollbar-hide shrink-0">
                    {[{ id: 'all', name: 'Tout' }, ...filteredCategories].map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                "h-9 px-6 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0 max-w-[140px] truncate",
                                selectedCategory === cat.id
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card text-muted-foreground border-border hover:border-muted-foreground/30 hover:text-foreground"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
                            {filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item)}
                                    className="group bg-card border border-border rounded-md p-3 transition-all hover:bg-muted/50 hover:border-muted-foreground/30 active:scale-95 space-y-3 flex flex-col items-start"
                                >
                                    <div className="w-full aspect-square bg-muted/30 rounded-md border border-border/50 flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-colors relative overflow-hidden">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                        ) : (
                                            <Utensils className="w-6 h-6 stroke-1" />
                                        )}
                                        {cart.find(i => i.id === item.id) && (
                                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-black border border-white/20">
                                                {cart.find(i => i.id === item.id)?.quantity}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-left w-full">
                                        <p className="text-[10px] font-bold text-foreground uppercase tracking-tight line-clamp-2 h-7 leading-tight">{item.name}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-[11px] font-black text-foreground tabular-nums">{item.price.toLocaleString()} <span className="text-[8px] font-bold opacity-40">F</span></p>
                                            <div className="p-1 rounded-sm bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="w-2.5 h-2.5 text-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20">
                            <SearchX className="w-12 h-12 mb-2 stroke-1" />
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Aucun plat disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right side: Cart */}
            <div className="w-[420px] flex flex-col bg-card border-l border-border m-6 rounded-md overflow-hidden outline outline-1 outline-border">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4 text-muted-foreground/60" /> Panier Global
                        </h2>
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-70">Séquence #{orderNumber}</p>
                    </div>
                    <button onClick={clearCart} className="p-2 text-muted-foreground/40 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>

                <div className="p-4 bg-muted/30 flex gap-2 mx-6 mt-6 rounded-md border border-border items-center">
                    <Select value={serviceType} onValueChange={setServiceType}>
                        <SelectTrigger className="flex-1 h-8 border-none bg-transparent text-[9px] font-black uppercase tracking-widest">
                            <SelectValue placeholder="Sur place" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Sur place">Sur place</SelectItem>
                            <SelectItem value="À emporter">À emporter</SelectItem>
                            <SelectItem value="Livraison">Livraison</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="w-px h-3 bg-border" />
                    <input
                        type="text"
                        placeholder="Table..."
                        value={selectedTable}
                        onChange={e => setSelectedTable(e.target.value)}
                        className="w-16 bg-transparent border-none text-[9px] font-black uppercase text-center text-foreground outline-none placeholder:text-muted-foreground/30"
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.map(item => (
                        <div key={item.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0 flex-1 pr-4">
                                    <p className="text-[11px] font-bold text-foreground uppercase truncate tracking-tight">{item.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-[10px] text-muted-foreground font-bold tabular-nums">{item.price.toLocaleString()} F</p>
                                        {item.notes && <span className="text-[8px] text-red-600 font-black uppercase tracking-tighter bg-red-50 border border-red-100 px-1.5 rounded-sm">{item.notes}</span>}
                                    </div>
                                </div>
                                <p className="text-[11px] font-black text-foreground tabular-nums">{(item.price * item.quantity).toLocaleString()} F</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 bg-background border border-border rounded flex items-center justify-center hover:bg-muted transition-all text-muted-foreground active:scale-95"><Minus className="w-3 h-3" /></button>
                                    <span className="w-8 text-center text-[10px] font-black text-foreground tabular-nums">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 bg-background border border-border rounded flex items-center justify-center hover:bg-muted transition-all text-muted-foreground active:scale-95"><Plus className="w-3 h-3" /></button>
                                </div>
                                <button
                                    onClick={() => { setEditingNotes(item.id); setNotesText(item.notes || ""); }}
                                    className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 hover:text-foreground px-2 py-1 rounded-sm hover:bg-muted transition-all"
                                >
                                    {item.notes ? 'Modifier' : 'Note Cuisine'}
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 pt-20">
                            <ShoppingBag className="w-12 h-12 mb-4 stroke-1" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Panier Vide</p>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-muted/10 border-t border-border mt-auto sticky bottom-0 bg-card z-10">
                    <div className="flex justify-between items-baseline mb-8">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Total à régler</span>
                        <div className="text-right">
                            <span className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{total.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">XAF</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <button
                            onClick={handleKOT}
                            disabled={cart.length === 0}
                            className="bg-card border border-border rounded-md h-12 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 disabled:opacity-20"
                            title="Imprimer KOT / Envoyer Cuisine"
                        >
                            <Printer className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            disabled={cart.length === 0}
                            className="col-span-3 bg-primary text-primary-foreground rounded-md h-12 font-black uppercase tracking-[0.2em] text-[10px] hover:opacity-90 transition-all active:scale-95 disabled:opacity-30 shadow-sm flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-4 h-4" />
                            <span>Régler la note</span>
                        </button>
                    </div>
                </div>
            </div>

            {editingNotes && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-md w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
                        <div className="space-y-1 text-center mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Note Cuisine</h3>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Spécifications pour le chef</p>
                        </div>
                        <textarea
                            autoFocus
                            value={notesText}
                            onChange={e => setNotesText(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-md p-4 text-xs font-bold text-foreground outline-none focus:ring-1 focus:ring-ring transition-all min-h-[120px] resize-none"
                            placeholder="Ex: Sans oignon, cuisson à point..."
                        />
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingNotes(null)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
                            <button onClick={() => saveNotes(editingNotes)} className="flex-1 py-3 bg-primary text-primary-foreground rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                orderNumber={orderNumber}
                total={total}
                items={cart}
                onPaymentComplete={handlePaymentComplete}
            />
        </div>
    );
}
