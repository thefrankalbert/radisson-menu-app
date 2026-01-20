"use client";

import { useEffect, useState, useRef } from "react";
import {
    Filter,
    Calendar,
    Loader2,
    Volume2,
    VolumeX,
    Printer
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import OrderCard from "@/components/admin/OrderCard";
import Modal from "@/components/admin/Modal";
import { Order } from "@/types/admin";

type SimpleRestaurant = {
    id: string;
    name: string;
    slug: string;
};
import { toast } from "react-hot-toast";

type DateFilter = 'today' | '7days' | '30days' | 'all';
type StatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [restaurants, setRestaurants] = useState<SimpleRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Filtres
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [restaurantFilter, setRestaurantFilter] = useState<string>('all');

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Son de notification
    useEffect(() => {
        audioRef.current = new Audio('/notification.mp3');
    }, []);

    const playNotificationSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
        }
    };

    // Charger les restaurants
    const loadRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('id, name, slug')
            .order('name');

        setRestaurants(data || []);
    };

    // Charger les commandes
    const loadOrders = async () => {
        try {
            let query = supabase
                .from('orders')
                .select(`
                    id,
                    table_number,
                    status,
                    total_price,
                    created_at,
                    restaurant_id,
                    order_items (
                        id,
                        quantity,
                        price_at_order,
                        menu_items (
                            name
                        )
                    )
                `)
                .order('created_at', { ascending: false });

            // Filtre par date
            if (dateFilter !== 'all') {
                const now = new Date();
                let startDate: Date;

                switch (dateFilter) {
                    case 'today':
                        startDate = new Date(now.setHours(0, 0, 0, 0));
                        break;
                    case '7days':
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30days':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        startDate = new Date(0);
                }

                query = query.gte('created_at', startDate.toISOString());
            }

            // Filtre par statut
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            // Filtre par restaurant
            if (restaurantFilter !== 'all') {
                query = query.eq('restaurant_id', restaurantFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedOrders: Order[] = (data || []).map(order => ({
                id: order.id,
                table_number: order.table_number || 'N/A',
                status: order.status || 'pending',
                total_price: order.total_price || 0,
                created_at: order.created_at,
                restaurant_id: order.restaurant_id,
                items: order.order_items?.map((item: any) => ({
                    id: item.id,
                    name: item.menu_items?.name || 'Item inconnu',
                    quantity: item.quantity,
                    price: item.price_at_order
                })) || []
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error('Erreur chargement commandes:', error);
            toast.error('Erreur lors du chargement des commandes');
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
            loadOrders();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    // Voir détail d'une commande
    const openOrderDetail = (order: Order) => {
        setSelectedOrder(order);
        setShowDetailModal(true);
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadRestaurants(), loadOrders()]);
            setLoading(false);
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recharger quand les filtres changent
    useEffect(() => {
        if (!loading) {
            loadOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, dateFilter, restaurantFilter]);

    // Subscription temps réel
    useEffect(() => {
        const channel = supabase
            .channel('orders-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                () => {
                    toast.success('Nouvelle commande reçue !', {
                        icon: '🔔',
                        duration: 5000
                    });
                    playNotificationSound();
                    loadOrders();
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                () => {
                    loadOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [soundEnabled]);

    // Grouper les commandes par statut pour l'affichage
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-[#C5A065] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#003058] tracking-tight">Gestion des Commandes</h1>
                    <div className="flex items-center space-x-3 mt-2">
                        <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">En direct</span>
                    </div>
                </div>

                <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-3 rounded-xl transition-all ${
                        soundEnabled
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                    title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
                >
                    {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 p-6 bg-white rounded-2xl border border-[#F5F5F5]">
                {/* Filtre Status */}
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058] focus:ring-2 focus:ring-[#C5A065]/20"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="preparing">En préparation</option>
                        <option value="ready">Prêt</option>
                        <option value="delivered">Livré</option>
                        <option value="cancelled">Annulé</option>
                    </select>
                </div>

                {/* Filtre Date */}
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                        className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058] focus:ring-2 focus:ring-[#C5A065]/20"
                    >
                        <option value="today">Aujourd&apos;hui</option>
                        <option value="7days">7 derniers jours</option>
                        <option value="30days">30 derniers jours</option>
                        <option value="all">Tout</option>
                    </select>
                </div>

                {/* Filtre Restaurant */}
                {restaurants.length > 0 && (
                    <select
                        value={restaurantFilter}
                        onChange={(e) => setRestaurantFilter(e.target.value)}
                        className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058] focus:ring-2 focus:ring-[#C5A065]/20"
                    >
                        <option value="all">Toutes les cartes</option>
                        {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                )}

                <div className="ml-auto text-sm text-slate-400 font-bold">
                    {orders.length} commande{orders.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Grille des commandes par statut */}
            {statusFilter === 'all' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne En attente */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 px-2">
                            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                            <h2 className="font-black text-[#003058]">En attente ({pendingOrders.length})</h2>
                        </div>
                        <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                            {pendingOrders.length > 0 ? (
                                pendingOrders.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl border border-[#F5F5F5] p-8 text-center">
                                    <p className="text-slate-400 text-sm">Aucune commande</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne En préparation */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 px-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h2 className="font-black text-[#003058]">En préparation ({preparingOrders.length})</h2>
                        </div>
                        <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                            {preparingOrders.length > 0 ? (
                                preparingOrders.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl border border-[#F5F5F5] p-8 text-center">
                                    <p className="text-slate-400 text-sm">Aucune commande</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne Prêt + Historique */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 px-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <h2 className="font-black text-[#003058]">Prêt ({readyOrders.length})</h2>
                        </div>
                        <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                            {readyOrders.length > 0 ? (
                                readyOrders.map(order => (
                                    <OrderCard
                                        key={order.id}
                                        order={order}
                                        onStatusChange={handleStatusChange}
                                    />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl border border-[#F5F5F5] p-8 text-center">
                                    <p className="text-slate-400 text-sm">Aucune commande</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Vue filtrée - grille simple */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                            />
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-3xl border border-[#F5F5F5] p-12 text-center">
                            <p className="text-slate-400 font-medium">Aucune commande trouvée</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal détail commande */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Commande #${selectedOrder?.id.slice(0, 8)}`}
                size="md"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#F5F5F5] p-4 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Table</p>
                                <p className="text-xl font-black text-[#003058]">{selectedOrder.table_number}</p>
                            </div>
                            <div className="bg-[#F5F5F5] p-4 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total</p>
                                <p className="text-xl font-black text-[#003058]">{selectedOrder.total_price} FCFA</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Articles</p>
                            <div className="space-y-2">
                                {(selectedOrder.items || []).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-xl">
                                        <div className="flex items-center space-x-3">
                                            <span className="w-8 h-8 bg-[#003058] text-white rounded-lg flex items-center justify-center font-black text-sm">
                                                {item.quantity}
                                            </span>
                                            <span className="font-bold text-[#003058]">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-slate-500">{item.price * item.quantity} F</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 h-12 bg-[#F5F5F5] text-[#003058] font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-slate-200 transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                <span>Imprimer</span>
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="flex-1 h-12 bg-[#003058] text-white font-bold rounded-xl hover:bg-[#004a80] transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
