"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
    ChefHat,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    RefreshCw,
    Timer,
    Flame,
    ArrowRight,
    Bell,
    AlertTriangle,
    Clock,
    Utensils,
    CheckCircle2,
    User,
    Hash
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { playNotificationSound } from "@/lib/notification-sound";
import { cn } from "@/lib/utils";

type OrderItem = {
    name: string;
    quantity: number;
    notes?: string;
};

type Order = {
    id: string;
    table_number: string;
    status: 'pending' | 'preparing' | 'ready';
    created_at: string;
    items: OrderItem[];
    server_name?: string;
};

// Mock data for demonstration when no orders
const MOCK_ORDERS: Order[] = [
    {
        id: 'mock-1',
        table_number: 'P12',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
        server_name: 'Marie',
        items: [
            { name: 'Filet de Boeuf Grillé', quantity: 2, notes: 'Bien cuit' },
            { name: 'Salade César', quantity: 1 },
            { name: 'Risotto aux Champignons', quantity: 1, notes: 'Sans parmesan' }
        ]
    },
    {
        id: 'mock-2',
        table_number: 'L05',
        status: 'preparing',
        created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 min ago
        server_name: 'Jean',
        items: [
            { name: 'Burger Signature', quantity: 3 },
            { name: 'Fish & Chips', quantity: 2, notes: 'Extra sauce tartare' },
            { name: 'Frites Maison', quantity: 2 }
        ]
    },
    {
        id: 'mock-3',
        table_number: 'T08',
        status: 'pending',
        created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 min ago - WARNING
        server_name: 'Sophie',
        items: [
            { name: 'Pizza Margherita', quantity: 1 },
            { name: 'Pâtes Carbonara', quantity: 2, notes: 'Végétarien - Sans lardons' }
        ]
    },
    {
        id: 'mock-4',
        table_number: 'P03',
        status: 'ready',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
        server_name: 'Marc',
        items: [
            { name: 'Cocktail de Crevettes', quantity: 2 },
            { name: 'Soupe du Jour', quantity: 1 }
        ]
    },
    {
        id: 'mock-5',
        table_number: 'L11',
        status: 'preparing',
        created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(), // 18 min ago - LATE
        server_name: 'Pierre',
        items: [
            { name: 'Entrecôte 300g', quantity: 1, notes: 'Saignant' },
            { name: 'Gratin Dauphinois', quantity: 1 },
            { name: 'Haricots Verts', quantity: 1, notes: 'Sans beurre' }
        ]
    }
];

// Stat Card Component
function StatCard({
    label,
    count,
    icon: Icon,
    color,
    pulse = false
}: {
    label: string;
    count: number;
    icon: React.ElementType;
    color: 'amber' | 'blue' | 'emerald' | 'red';
    pulse?: boolean;
}) {
    const colorClasses = {
        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    const iconBg = {
        amber: 'bg-amber-500',
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        red: 'bg-red-500'
    };

    return (
        <div className={cn(
            "flex items-center gap-4 px-5 py-3 rounded-lg border transition-all",
            colorClasses[color],
            pulse && "animate-pulse"
        )}>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBg[color])}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="font-mono text-3xl font-black tabular-nums">{count}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</p>
            </div>
        </div>
    );
}

// KDS Order Ticket Card
function KDSTicket({
    order,
    onStatusChange,
    isMock = false
}: {
    order: Order;
    onStatusChange: (id: string, status: string) => void;
    isMock?: boolean;
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
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const minutes = Math.floor(elapsed / 60);
    const isLate = minutes >= 15;
    const isWarning = minutes >= 5 && minutes < 15;
    const isGood = minutes < 5;

    // Status-based styling
    const statusConfig = {
        pending: { bg: 'bg-amber-500', label: 'En Attente', borderColor: 'border-amber-500/50' },
        preparing: { bg: 'bg-blue-500', label: 'En Préparation', borderColor: 'border-blue-500/50' },
        ready: { bg: 'bg-emerald-500', label: 'Prêt à Servir', borderColor: 'border-emerald-500/50' }
    };

    const timerColor = isLate ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-500 text-white' : 'bg-emerald-500/20 text-emerald-400';

    const nextStatusMap: Record<string, string> = {
        'pending': 'preparing',
        'preparing': 'ready',
        'ready': 'delivered'
    };

    const actionLabel: Record<string, string> = {
        'pending': 'DÉMARRER LA PRÉPARATION',
        'preparing': 'MARQUER COMME PRÊT',
        'ready': 'VALIDER LE SERVICE'
    };

    const actionColor: Record<string, string> = {
        'pending': 'bg-amber-500 hover:bg-amber-600',
        'preparing': 'bg-blue-500 hover:bg-blue-600',
        'ready': 'bg-emerald-500 hover:bg-emerald-600'
    };

    const handleAction = () => {
        if (isMock) {
            toast.success("Mode démo - Action simulée");
            return;
        }
        const nextStatus = nextStatusMap[order.status];
        onStatusChange(order.id, nextStatus);
    };

    return (
        <div className={cn(
            "flex flex-col rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-lg",
            statusConfig[order.status].borderColor,
            isLate && "animate-pulse border-red-500",
            isMock && "opacity-90"
        )}
        style={{ backgroundColor: 'hsl(var(--card))' }}
        >
            {/* Status Bar */}
            <div className={cn("h-2 w-full", statusConfig[order.status].bg)} />

            {/* Header */}
            <div className="p-4 border-b border-border/50">
                <div className="flex items-start justify-between">
                    {/* Table & Server */}
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="font-mono text-xl font-black text-white">{order.table_number}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Table</p>
                            <p className="text-lg font-black text-white tracking-tight">{order.table_number}</p>
                            {order.server_name && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <User className="w-3 h-3 text-slate-500" />
                                    <span className="text-[10px] font-semibold text-slate-400">{order.server_name}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={cn(
                        "px-3 py-2 rounded-lg flex items-center gap-2 transition-all",
                        timerColor,
                        isLate && "animate-pulse"
                    )}>
                        {isLate ? <Flame className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
                        <span className="font-mono text-lg font-black tabular-nums">{formatTime(elapsed)}</span>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mt-3 flex items-center gap-2">
                    <span className={cn(
                        "px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest",
                        statusConfig[order.status].bg,
                        "text-white"
                    )}>
                        {statusConfig[order.status].label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                        #{order.id.slice(-6).toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Items List */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[280px] bg-slate-900/50">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 group">
                        {/* Quantity Badge */}
                        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="font-mono text-sm font-black text-white">{item.quantity}x</span>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                            {item.notes && (
                                <div className="mt-1.5 px-2 py-1.5 rounded bg-amber-500/20 border border-amber-500/30">
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-tight flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        {item.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Button */}
            <button
                onClick={handleAction}
                className={cn(
                    "w-full py-4 font-black text-[11px] uppercase tracking-widest text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                    actionColor[order.status]
                )}
            >
                <span>{actionLabel[order.status]}</span>
                <ArrowRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// Empty State Component
function EmptyColumn({ status, label, icon: Icon }: { status: string; label: string; icon: React.ElementType }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-500">{label}</p>
            <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                {status === 'pending' && 'Les nouvelles commandes apparaîtront ici'}
                {status === 'preparing' && 'Commencez une commande en attente'}
                {status === 'ready' && 'Les commandes terminées apparaîtront ici'}
            </p>
        </div>
    );
}

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showMockData, setShowMockData] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const router = useRouter();
    const searchParams = useSearchParams();
    const isBigScreen = searchParams.get("fullscreen") === "true";
    const audioRef = useRef<boolean>(false);

    const loadOrders = useCallback(async () => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, table_number, status, created_at,
                    order_items (
                        quantity, notes,
                        menu_items ( name )
                    )
                `)
                .in('status', ['pending', 'preparing', 'ready'])
                .gte('created_at', todayStart.toISOString())
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedOrders: Order[] = (data || []).map((order: any) => ({
                id: order.id,
                table_number: order.table_number || 'N/A',
                status: order.status,
                created_at: order.created_at,
                items: (order.order_items || []).map((item: any) => ({
                    name: item.menu_items?.name || 'Item',
                    quantity: item.quantity,
                    notes: item.notes
                }))
            }));

            setOrders(formattedOrders);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('KDS Load Error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 10000);
        const channel = supabase.channel('kds_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                if (soundEnabled && audioRef.current) playNotificationSound();
                loadOrders();
            })
            .subscribe();
        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [loadOrders, soundEnabled]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
            loadOrders();
            toast.success(newStatus === 'ready' ? '✓ Commande prête!' : '✓ Statut mis à jour');
        } catch (e) {
            toast.error("Erreur de mise à jour");
        }
    };

    const toggleBigScreen = () => {
        router.push(isBigScreen ? '/admin/kitchen' : '/admin/kitchen?fullscreen=true');
    };

    const handleInitialInteraction = () => {
        audioRef.current = true;
        setSoundEnabled(true);
        toast.success("Son activé");
    };

    // Use mock data or real orders
    const displayOrders = useMemo(() => {
        if (showMockData || orders.length === 0) return MOCK_ORDERS;
        return orders;
    }, [orders, showMockData]);

    // Categorize orders
    const pendingOrders = displayOrders.filter(o => o.status === 'pending');
    const preparingOrders = displayOrders.filter(o => o.status === 'preparing');
    const readyOrders = displayOrders.filter(o => o.status === 'ready');

    // Count late orders
    const lateCount = displayOrders.filter(o => {
        const minutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
        return minutes >= 15 && o.status !== 'ready';
    }).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Chargement du KDS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "min-h-screen bg-slate-950 text-white flex flex-col font-sans",
            isBigScreen ? 'fixed inset-0 z-[200]' : ''
        )}>
            {/* Header */}
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-sm tracking-tight">Kitchen Display</h1>
                        <p className="text-[10px] text-slate-500">Radisson Blu Hotel N'Djamena</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="hidden lg:flex items-center gap-3">
                    <StatCard
                        label="en attente"
                        count={pendingOrders.length}
                        icon={AlertTriangle}
                        color="amber"
                        pulse={pendingOrders.length > 0}
                    />
                    <StatCard
                        label="en cours"
                        count={preparingOrders.length}
                        icon={Clock}
                        color="blue"
                    />
                    <StatCard
                        label="prêts"
                        count={readyOrders.length}
                        icon={CheckCircle2}
                        color="emerald"
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-mono mr-2">
                        MAJ: {lastUpdate.toLocaleTimeString()}
                    </span>
                    <button
                        onClick={loadOrders}
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={!audioRef.current ? handleInitialInteraction : () => setSoundEnabled(!soundEnabled)}
                        className={cn(
                            "p-2.5 rounded-lg transition-all",
                            soundEnabled ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        )}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={toggleBigScreen}
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        {isBigScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                    {isBigScreen && (
                        <button
                            onClick={() => router.push('/admin/kitchen')}
                            className="ml-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-[10px] tracking-widest uppercase transition-all"
                        >
                            QUITTER
                        </button>
                    )}
                </div>
            </header>

            {/* Mobile Stats */}
            <div className="lg:hidden flex items-center justify-around py-3 px-4 bg-slate-900/50 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-mono font-bold">{pendingOrders.length}</span>
                    <span className="text-[9px] uppercase opacity-70">attente</span>
                </div>
                <div className="flex items-center gap-2 text-blue-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono font-bold">{preparingOrders.length}</span>
                    <span className="text-[9px] uppercase opacity-70">cours</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-mono font-bold">{readyOrders.length}</span>
                    <span className="text-[9px] uppercase opacity-70">prêts</span>
                </div>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-px bg-slate-800">
                <div className="bg-slate-900 py-3 px-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">En Attente</span>
                    <span className="ml-auto bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{pendingOrders.length}</span>
                </div>
                <div className="bg-slate-900 py-3 px-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">En Préparation</span>
                    <span className="ml-auto bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{preparingOrders.length}</span>
                </div>
                <div className="bg-slate-900 py-3 px-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Prêt à Servir</span>
                    <span className="ml-auto bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{readyOrders.length}</span>
                </div>
            </div>

            {/* Main Content - 3 Columns */}
            <div className="flex-1 grid grid-cols-3 gap-px bg-slate-800 overflow-hidden">
                {/* Pending Column */}
                <div className="bg-slate-950 overflow-y-auto p-4 space-y-4">
                    {pendingOrders.length > 0 ? (
                        pendingOrders.map(order => (
                            <KDSTicket
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                isMock={showMockData || orders.length === 0}
                            />
                        ))
                    ) : (
                        <EmptyColumn status="pending" label="Aucune commande en attente" icon={Bell} />
                    )}
                </div>

                {/* Preparing Column */}
                <div className="bg-slate-950 overflow-y-auto p-4 space-y-4">
                    {preparingOrders.length > 0 ? (
                        preparingOrders.map(order => (
                            <KDSTicket
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                isMock={showMockData || orders.length === 0}
                            />
                        ))
                    ) : (
                        <EmptyColumn status="preparing" label="Aucune préparation en cours" icon={Utensils} />
                    )}
                </div>

                {/* Ready Column */}
                <div className="bg-slate-950 overflow-y-auto p-4 space-y-4">
                    {readyOrders.length > 0 ? (
                        readyOrders.map(order => (
                            <KDSTicket
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                isMock={showMockData || orders.length === 0}
                            />
                        ))
                    ) : (
                        <EmptyColumn status="ready" label="Aucune commande prête" icon={CheckCircle2} />
                    )}
                </div>
            </div>

            {/* Demo Mode Indicator */}
            {(showMockData || orders.length === 0) && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Mode Démo - Données Simulées
                </div>
            )}
        </div>
    );
}
