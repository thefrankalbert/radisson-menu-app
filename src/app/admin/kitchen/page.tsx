"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ChefHat,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    RefreshCw,
    Clock,
    AlertTriangle,
    CheckCircle2,
    Timer,
    ArrowRight,
    Utensils,
    Bell,
    Flame
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { playNotificationSound } from "@/lib/notification-sound";

type OrderItem = {
    name: string;
    quantity: number;
    price: number;
    notes?: string;
};

type Order = {
    id: string;
    table_number: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    total_price: number;
    created_at: string;
    items: OrderItem[];
};

// KDS Order Card - Version optimisée pour cuisine
function KDSOrderCard({
    order,
    onStatusChange
}: {
    order: Order;
    onStatusChange: (id: string, status: string) => void;
}) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const calculate = () => {
            const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);
            setElapsed(diff);
        };
        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [order.created_at]);

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins < 60) return `${mins}:${secs.toString().padStart(2, '0')}`;
        const hours = Math.floor(mins / 60);
        return `${hours}h${(mins % 60).toString().padStart(2, '0')}`;
    };

    const isUrgent = elapsed > 600; // > 10 min
    const isWarning = elapsed > 300 && elapsed <= 600; // 5-10 min

    const statusConfig = {
        pending: {
            nextStatus: 'preparing',
            nextLabel: 'Démarrer',
            gradient: 'from-amber-500 to-amber-600',
            glow: 'shadow-amber-500/30'
        },
        preparing: {
            nextStatus: 'ready',
            nextLabel: 'Prêt !',
            gradient: 'from-blue-500 to-blue-600',
            glow: 'shadow-blue-500/30'
        },
        ready: {
            nextStatus: 'delivered',
            nextLabel: 'Servi',
            gradient: 'from-emerald-500 to-emerald-600',
            glow: 'shadow-emerald-500/30'
        }
    };

    const config = statusConfig[order.status as keyof typeof statusConfig];

    return (
        <div
            className={`
                bg-white rounded-2xl overflow-hidden shadow-lg transition-all duration-300
                ${isUrgent ? 'ring-2 ring-red-500 animate-pulse-subtle' : ''}
                ${isWarning ? 'ring-2 ring-amber-400' : ''}
                hover:shadow-xl hover:scale-[1.01]
            `}
        >
            {/* Header avec numéro de table et timer */}
            <div className={`
                px-4 py-3 flex items-center justify-between
                bg-gradient-to-r ${config?.gradient || 'from-gray-500 to-gray-600'}
            `}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <span className="text-xl font-black text-white">{order.table_number}</span>
                    </div>
                    <div>
                        <p className="text-white/80 text-xs font-medium">Table</p>
                        <p className="text-white font-bold text-lg leading-tight">{order.table_number}</p>
                    </div>
                </div>

                <div className={`
                    flex items-center gap-2 px-3 py-2 rounded-xl
                    ${isUrgent ? 'bg-red-500/90 animate-pulse' : isWarning ? 'bg-amber-500/90' : 'bg-white/20'}
                `}>
                    {isUrgent && <Flame className="w-4 h-4 text-white" />}
                    <Timer className="w-4 h-4 text-white" />
                    <span className="font-mono font-bold text-white text-lg">
                        {formatTime(elapsed)}
                    </span>
                </div>
            </div>

            {/* Liste des items */}
            <div className="p-4 space-y-2 max-h-48 overflow-y-auto">
                {order.items.map((item, idx) => (
                    <div
                        key={idx}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-gray-700">{item.quantity}x</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                            {item.notes && (
                                <p className="text-xs text-amber-600 font-medium mt-0.5">
                                    Note: {item.notes}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bouton d'action */}
            {config && (
                <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button
                        onClick={() => onStatusChange(order.id, config.nextStatus)}
                        className={`
                            w-full py-4 rounded-xl font-bold text-white text-lg
                            bg-gradient-to-r ${config.gradient}
                            shadow-lg ${config.glow}
                            hover:opacity-90 active:scale-[0.98] transition-all
                            flex items-center justify-center gap-2
                        `}
                    >
                        <span>{config.nextLabel}</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns');

    // Stats
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const preparingCount = orders.filter(o => o.status === 'preparing').length;
    const readyCount = orders.filter(o => o.status === 'ready').length;

    // Charger les commandes actives
    const loadOrders = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id,
                    table_number,
                    status,
                    total_price,
                    created_at,
                    order_items (
                        quantity,
                        price_at_order,
                        notes,
                        menu_items (name)
                    )
                `)
                .in('status', ['pending', 'preparing', 'ready'])
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedOrders: Order[] = (data || []).map((order: any) => ({
                id: order.id,
                table_number: order.table_number,
                status: order.status,
                total_price: order.total_price,
                created_at: order.created_at,
                items: (order.order_items || []).map((item: any) => ({
                    name: item.menu_items?.name || 'Article',
                    quantity: item.quantity,
                    price: item.price_at_order,
                    notes: item.notes
                }))
            }));

            setOrders(formattedOrders);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Erreur chargement commandes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Jouer le son
    const playSound = useCallback(() => {
        if (soundEnabled) {
            playNotificationSound();
        }
    }, [soundEnabled]);

    // Abonnement temps réel
    useEffect(() => {
        loadOrders();

        const channel = supabase
            .channel('kitchen-orders')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        playSound();
                        toast('Nouvelle commande !', {
                            icon: '🔔',
                            duration: 5000,
                            style: {
                                background: '#FEF3C7',
                                color: '#92400E',
                                fontWeight: 'bold'
                            }
                        });
                    }
                    loadOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadOrders, playSound]);

    // Rafraîchissement automatique
    useEffect(() => {
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    // Changer le status
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            if (newStatus === 'ready') {
                toast.success('Commande prête !', {
                    icon: '✅',
                    style: { background: '#D1FAE5', color: '#065F46' }
                });
            }

            loadOrders();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Filtrer par statut
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce shadow-lg shadow-orange-500/30">
                        <ChefHat className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-white text-xl font-bold">Chargement cuisine...</p>
                    <p className="text-slate-400 text-sm mt-2">Kitchen Display System</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <ChefHat className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Kitchen Display
                                </h1>
                                <p className="text-slate-400 text-sm">
                                    Radisson Blu Hotel N'Djamena
                                </p>
                            </div>
                        </div>

                        {/* Stats Pills */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-xl">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-amber-400">{pendingCount}</span>
                                <span className="text-amber-400/70 text-sm hidden sm:inline">en attente</span>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-xl">
                                <Clock className="w-4 h-4 text-blue-400" />
                                <span className="font-bold text-blue-400">{preparingCount}</span>
                                <span className="text-blue-400/70 text-sm hidden sm:inline">en cours</span>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="font-bold text-emerald-400">{readyCount}</span>
                                <span className="text-emerald-400/70 text-sm hidden sm:inline">prêts</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 text-xs hidden lg:block">
                                MAJ: {lastUpdate.toLocaleTimeString()}
                            </span>

                            <button
                                onClick={loadOrders}
                                className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-all"
                                title="Rafraîchir"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`p-3 rounded-xl transition-all ${
                                    soundEnabled
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500'
                                }`}
                                title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>

                            <button
                                onClick={toggleFullscreen}
                                className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-700 hover:text-white transition-all"
                                title="Plein écran"
                            >
                                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - 3 Columns */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
                    {/* Column: En Attente */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                            <h2 className="text-lg font-bold text-white">En Attente</h2>
                            <span className="ml-auto bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-bold">
                                {pendingCount}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                            {pendingOrders.length > 0 ? (
                                pendingOrders.map(order => (
                                    <KDSOrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Aucune commande en attente</p>
                                    <p className="text-slate-600 text-sm mt-1">Les nouvelles commandes apparaîtront ici</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column: En Préparation */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <h2 className="text-lg font-bold text-white">En Préparation</h2>
                            <span className="ml-auto bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold">
                                {preparingCount}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                            {preparingOrders.length > 0 ? (
                                preparingOrders.map(order => (
                                    <KDSOrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                        <Utensils className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Aucune préparation en cours</p>
                                    <p className="text-slate-600 text-sm mt-1">Commencez une commande en attente</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column: Prêt */}
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                            <h2 className="text-lg font-bold text-white">Prêt à Servir</h2>
                            <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold">
                                {readyCount}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                            {readyOrders.length > 0 ? (
                                readyOrders.map(order => (
                                    <KDSOrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Aucune commande prête</p>
                                    <p className="text-slate-600 text-sm mt-1">Les commandes terminées apparaîtront ici</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Styles */}
            <style jsx global>{`
                .scrollbar-thin::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollbar-thin::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 10px;
                }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.25);
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
