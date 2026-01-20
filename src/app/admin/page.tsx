"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ShoppingBag,
    Banknote,
    UtensilsCrossed,
    Users,
    ArrowRight,
    Clock,
    ChefHat,
    TrendingUp,
    Bell,
    Calendar,
    MoreVertical,
    Eye,
    CheckCircle2,
    XCircle,
    Timer,
    Utensils
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import StatsCard from "@/components/admin/StatsCard";
import { StatsCardSkeleton } from "@/components/admin/Skeleton";
import { Order, DashboardStats, PopularItem } from "@/types/admin";
import { toast } from "react-hot-toast";

// Mini chart component (simplified bar chart)
function MiniChart({ data, color }: { data: number[]; color: string }) {
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-1 h-12">
            {data.map((value, i) => (
                <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-500 ${color}`}
                    style={{ height: `${(value / max) * 100}%`, minHeight: '4px' }}
                />
            ))}
        </div>
    );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
        pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "En attente" },
        preparing: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", label: "Préparation" },
        ready: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Prêt" },
        delivered: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: "Livré" },
        cancelled: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Annulé" },
    };
    const c = config[status] || config.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// Time ago helper
function timeAgo(date: string) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return new Date(date).toLocaleDateString('fr-FR');
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        ordersToday: 0,
        revenueToday: 0,
        activeItems: 0,
        activeCards: 0
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartData] = useState([4, 7, 5, 9, 12, 8, 15, 10, 18, 14, 20, 16]);

    // Get current time greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Bonjour";
        if (hour < 18) return "Bon après-midi";
        return "Bonsoir";
    };

    // Charger les statistiques
    const loadStats = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // Commandes du jour
            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, total_price')
                .gte('created_at', today.toISOString());

            // Plats actifs
            const { count: itemsCount } = await supabase
                .from('menu_items')
                .select('id', { count: 'exact', head: true })
                .eq('is_available', true);

            // Tables actives (count restaurants for now as proxy)
            const { count: tablesCount } = await supabase
                .from('restaurants')
                .select('id', { count: 'exact', head: true });

            const ordersToday = ordersData?.length || 0;
            const revenueToday = ordersData?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

            setStats({
                ordersToday,
                revenueToday,
                activeItems: itemsCount || 0,
                activeCards: tablesCount || 0
            });
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    // Charger les commandes récentes
    const loadRecentOrders = async () => {
        try {
            const { data: orders, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    table_number,
                    status,
                    total_price,
                    created_at,
                    order_items (
                        id,
                        quantity,
                        price_at_order,
                        menu_items (
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;

            const formattedOrders: Order[] = (orders || []).map(order => ({
                id: order.id,
                table_number: order.table_number || 'N/A',
                status: order.status || 'pending',
                total_price: order.total_price || 0,
                created_at: order.created_at,
                items: order.order_items?.map((item: any) => ({
                    id: item.id,
                    name: item.menu_items?.name || 'Item inconnu',
                    quantity: item.quantity,
                    price: item.price_at_order
                })) || []
            }));

            setRecentOrders(formattedOrders);
        } catch (error) {
            console.error('Erreur chargement commandes:', error);
        }
    };

    // Charger les plats populaires
    const loadPopularItems = async () => {
        try {
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    menu_item_id,
                    quantity,
                    menu_items (
                        id,
                        name,
                        image_url
                    )
                `)
                .not('menu_item_id', 'is', null);

            if (error) throw error;

            const itemCounts: Record<string, PopularItem> = {};
            (data || []).forEach((item: any) => {
                if (item.menu_items) {
                    const id = item.menu_item_id;
                    if (!itemCounts[id]) {
                        itemCounts[id] = {
                            id,
                            name: item.menu_items.name,
                            image_url: item.menu_items.image_url,
                            order_count: 0
                        };
                    }
                    itemCounts[id].order_count += item.quantity;
                }
            });

            const sorted = Object.values(itemCounts)
                .sort((a, b) => b.order_count - a.order_count)
                .slice(0, 5);

            setPopularItems(sorted);
        } catch (error) {
            console.error('Erreur chargement plats populaires:', error);
        }
    };

    // Changer le statut d'une commande
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            toast.success('Statut mis à jour');
            loadRecentOrders();
            loadStats();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                loadStats(),
                loadRecentOrders(),
                loadPopularItems()
            ]);
            setLoading(false);
        };

        loadData();

        // Subscription temps réel pour les nouvelles commandes
        const channel = supabase
            .channel('dashboard-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    loadStats();
                    loadRecentOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const formatPrice = (price: number) => {
        if (price >= 1000000) {
            return `${(price / 1000000).toFixed(1)}M`;
        } else if (price >= 1000) {
            return `${(price / 1000).toFixed(0)}K`;
        }
        return price.toString();
    };

    if (loading) {
        return (
            <div className="space-y-8 pb-10">
                <div className="animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-100 rounded mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <StatsCardSkeleton key={i} />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header avec date et actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {getGreeting()} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date().toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <Link
                        href="/admin/pos"
                        className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                    >
                        <Banknote className="w-5 h-5" />
                        Ouvrir Caisse
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Commandes"
                    value={stats.ordersToday}
                    icon={ShoppingBag}
                    color="blue"
                    subtitle="Aujourd'hui"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatsCard
                    title="Revenus"
                    value={`${formatPrice(stats.revenueToday)} FCFA`}
                    icon={Banknote}
                    color="green"
                    subtitle="Aujourd'hui"
                    trend={{ value: 8, isPositive: true }}
                />
                <StatsCard
                    title="Plats actifs"
                    value={stats.activeItems}
                    icon={UtensilsCrossed}
                    color="purple"
                    subtitle="Sur le menu"
                />
                <StatsCard
                    title="Points de vente"
                    value={stats.activeCards}
                    icon={Users}
                    color="orange"
                    subtitle="Actifs"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Commandes récentes - 2/3 */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Commandes récentes</h2>
                            <p className="text-sm text-gray-500">{recentOrders.length} commandes en cours</p>
                        </div>
                        <Link
                            href="/admin/orders"
                            className="flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            Voir tout
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {recentOrders.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="p-4 hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                                                {order.table_number}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-900">
                                                        Table {order.table_number}
                                                    </h3>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {order.items?.slice(0, 2).map(i => i.name).join(', ')}
                                                    {order.items && order.items.length > 2 && ` +${order.items.length - 2}`}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {timeAgo(order.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Utensils className="w-3.5 h-3.5" />
                                                        {order.items?.reduce((s, i) => s + i.quantity, 0) || 0} articles
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">
                                                {order.total_price.toLocaleString()} <span className="text-xs text-gray-500">FCFA</span>
                                            </p>
                                            <div className="flex items-center gap-1 mt-2">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'preparing')}
                                                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                        title="Commencer la préparation"
                                                    >
                                                        <ChefHat className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'preparing' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'ready')}
                                                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                        title="Marquer comme prêt"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <button
                                                        onClick={() => handleStatusChange(order.id, 'delivered')}
                                                        className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                        title="Marquer comme livré"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                                    title="Voir détails"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShoppingBag className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Aucune commande</h3>
                            <p className="text-sm text-gray-500">Les nouvelles commandes apparaîtront ici</p>
                        </div>
                    )}
                </div>

                {/* Plats populaires - 1/3 */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Top Plats</h2>
                            <p className="text-sm text-gray-500">Les plus commandés</p>
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {popularItems.length > 0 ? (
                        <div className="p-4 space-y-3">
                            {popularItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                                        idx === 1 ? 'bg-gray-200 text-gray-700' :
                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {idx + 1}
                                    </div>

                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-12 h-12 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">{item.order_count} commandes</p>
                                    </div>

                                    <div className="w-16">
                                        <MiniChart
                                            data={[3, 5, 4, 7, 6, 8, 5]}
                                            color={idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-gray-400' : 'bg-orange-400'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <UtensilsCrossed className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/admin/kitchen"
                    className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <ChefHat className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Cuisine</h3>
                        <p className="text-xs text-gray-500">Voir le KDS</p>
                    </div>
                </Link>

                <Link
                    href="/admin/orders"
                    className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-amber-200 hover:shadow-lg hover:shadow-amber-500/5 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <ShoppingBag className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Commandes</h3>
                        <p className="text-xs text-gray-500">Gérer les commandes</p>
                    </div>
                </Link>

                <Link
                    href="/admin/items"
                    className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <UtensilsCrossed className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Plats</h3>
                        <p className="text-xs text-gray-500">Gérer les plats</p>
                    </div>
                </Link>

                <Link
                    href="/admin/reports"
                    className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 transition-all group"
                >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Rapports</h3>
                        <p className="text-xs text-gray-500">Voir les stats</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
