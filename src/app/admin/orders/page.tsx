"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
    Filter,
    Calendar as CalendarIcon,
    Loader2,
    Volume2,
    VolumeX,
    Printer,
    Clock,
    ChevronRight,
    Search,
    Eye,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Utensils,
    Star,
    Receipt
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { Order, OrderStatus } from "@/types/admin";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ListPageSkeleton } from "@/components/admin/Skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SimpleRestaurant = { id: string; name: string; slug: string; };
type DateFilter = 'today' | '7days' | '30days' | 'all';
type StatusFilter = 'all' | OrderStatus;

export default function OrdersPage() {
    const { t, language } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [restaurants, setRestaurants] = useState<SimpleRestaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [restaurantFilter, setRestaurantFilter] = useState<string>('all');
    const audioRef = useRef<boolean>(false);

    const loadOrders = useCallback(async () => {
        try {
            let query = supabase.from('orders').select('*, order_items(quantity, price_at_order, menu_items(name, name_en))').order('created_at', { ascending: false });
            if (dateFilter !== 'all') {
                const now = new Date();
                let start = new Date();
                if (dateFilter === 'today') start.setHours(0, 0, 0, 0);
                else if (dateFilter === '7days') start.setDate(now.getDate() - 7);
                else start.setDate(now.getDate() - 30);
                query = query.gte('created_at', start.toISOString());
            }
            if (statusFilter !== 'all') query = query.eq('status', statusFilter);
            if (restaurantFilter !== 'all') query = query.eq('restaurant_id', restaurantFilter);

            const { data, error } = await query;
            if (error) throw error;
            setOrders((data || []).map((o: any) => ({
                id: o.id, table_number: o.table_number || 'N/A', status: o.status || 'pending', total_price: o.total_price || 0, created_at: o.created_at,
                items: (o.order_items || []).map((i: any) => ({
                    name: (language === 'en' && i.menu_items?.name_en) ? i.menu_items.name_en : (i.menu_items?.name || 'Item'),
                    quantity: i.quantity,
                    price: i.price_at_order
                }))
            })));
        } catch (e) { console.error(e); }
    }, [dateFilter, statusFilter, restaurantFilter, language]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const { data } = await supabase.from('restaurants').select('id, name, slug').order('name');
            setRestaurants(data || []);
            await loadOrders();
            setLoading(false);
        };
        init();
    }, [loadOrders]);

    // Supabase Realtime: écouter les nouvelles commandes et mises à jour
    useEffect(() => {
        const channel = supabase.channel('orders_realtime')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                () => {
                    // Nouvelle commande reçue - recharger la liste
                    loadOrders();
                    // Son de notification (si activé)
                    if (soundEnabled && audioRef.current) {
                        try {
                            const audio = new Audio('/sounds/notification.mp3');
                            audio.play().catch(() => {});
                        } catch {}
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders' },
                () => {
                    // Commande mise à jour - recharger la liste
                    loadOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadOrders, soundEnabled]);

    const columns = useMemo(() => [
        {
            key: "table_number", label: "Table", sortable: true,
            render: (val: string) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center font-black text-gray-900 text-xs">{val}</div>
                    <span className="font-bold text-gray-900">Table {val}</span>
                </div>
            )
        },
        {
            key: "status", label: "Statut", sortable: true,
            render: (status: OrderStatus) => (
                <Badge variant="outline" className="font-black uppercase tracking-widest text-[9px] px-2 py-0.5 rounded border-gray-200 text-gray-500">
                    {t(status)}
                </Badge>
            )
        },
        {
            key: "items", label: "Articles",
            render: (items: any[]) => (
                <div className="text-xs">
                    <p className="font-bold text-gray-900">{items?.length || 0} {t('items')}</p>
                    <p className="text-gray-400 truncate max-w-[200px]">{items?.map(i => i.name).join(', ')}</p>
                </div>
            )
        },
        {
            key: "total_price", label: "Total", sortable: true,
            render: (val: number) => <span className="font-black text-gray-900">{val.toLocaleString()} F</span>
        },
        {
            key: "created_at", label: "Heure", sortable: true,
            render: (val: string) => <span className="text-xs text-gray-400 font-bold uppercase">{new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        },
        {
            key: "actions", label: "",
            render: (_: any, row: Order) => (
                <div className="flex items-center justify-end space-x-2">
                    <button
                        onClick={() => { setSelectedOrder(row); setShowDetailModal(true); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                        title="Voir détails"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    {row.status === 'ready' && (
                        <button
                            onClick={() => toast.success("Impression en cours...")}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                            title="Imprimer Reçu"
                        >
                            <Printer className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )
        }
    ], [t]);

    if (loading) return <ListPageSkeleton />;

    return (
        <div className="space-y-6 max-w-7xl mx-auto font-sans">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">{t('orders_mgmt')}</h1>
                    <p className="text-muted-foreground text-xs font-medium mt-1">{t('order_history')}</p>
                </div>
                <button
                    onClick={() => { setSoundEnabled(!soundEnabled); audioRef.current = true; }}
                    className={cn(
                        "p-2.5 rounded-md border transition-all active:scale-95",
                        soundEnabled ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:bg-accent"
                    )}
                >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-card rounded-md border border-border">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">{t('status')}</label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                        <SelectTrigger className="w-full h-9 text-xs font-medium">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="pending">{t('pending')}</SelectItem>
                            <SelectItem value="preparing">{t('preparing')}</SelectItem>
                            <SelectItem value="ready">{t('ready')}</SelectItem>
                            <SelectItem value="delivered">{t('delivered')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">{t('period')}</label>
                    <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                        <SelectTrigger className="w-full h-9 text-xs font-medium">
                            <SelectValue placeholder={t('today')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">{t('today')}</SelectItem>
                            <SelectItem value="7days">{t('last_7_days')}</SelectItem>
                            <SelectItem value="30days">{t('last_30_days')}</SelectItem>
                            <SelectItem value="all">{t('all_time')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">{t('establishment')}</label>
                    <Select value={restaurantFilter} onValueChange={setRestaurantFilter}>
                        <SelectTrigger className="w-full h-9 text-xs font-medium">
                            <SelectValue placeholder={t('all_restaurants')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all_restaurants')}</SelectItem>
                            {restaurants.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-card rounded-md border border-border overflow-hidden">
                <DataTable columns={columns} data={orders} isLoading={loading} />
            </div>

            <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={t('order_details')} size="md">
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn(
                                "font-black uppercase tracking-widest text-[10px] px-3 py-1 rounded",
                                selectedOrder.status === 'ready' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                    selectedOrder.status === 'preparing' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-muted text-muted-foreground"
                            )}>
                                {t(selectedOrder.status)}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/50 p-4 rounded-md border border-border">
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">{t('table')}</p>
                                <p className="text-2xl font-black text-foreground">{selectedOrder.table_number}</p>
                            </div>
                            <div className="bg-muted/50 p-4 rounded-md border border-border">
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">{t('total')}</p>
                                <p className="text-xl font-black text-foreground">{selectedOrder.total_price.toLocaleString()} <span className="text-xs">F</span></p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-2">Détail de la commande</p>
                            {(selectedOrder.items || []).map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-background border border-border rounded-md group hover:border-muted-foreground/30 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 bg-muted text-foreground flex items-center justify-center rounded text-[10px] font-black border border-border">{item.quantity}</div>
                                        <p className="font-bold text-foreground text-xs uppercase tracking-tight">{item.name}</p>
                                    </div>
                                    <p className="font-black text-muted-foreground text-xs tabular-nums">{(item.price * item.quantity).toLocaleString()} F</p>
                                </div>
                            ))}
                        </div>

                        {/* Order Actions Restricted Logic */}
                        <div className="pt-6 border-t border-border space-y-3">
                            {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'ready' && (
                                <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-md">
                                    <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                                    <p className="text-[10px] font-bold text-blue-700 leading-tight uppercase">
                                        L'encaissement et l'impression sont bloqués tant que la cuisine n'a pas validé le plat.
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { toast.success("Impression Ticket Cuisine..."); }}
                                    className="py-3 bg-muted text-foreground font-black rounded-md uppercase tracking-widest text-[10px] hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Ticket KDS</span>
                                </button>

                                <button
                                    disabled={selectedOrder.status !== 'ready'}
                                    onClick={() => { toast.success("Impression Reçu Client..."); }}
                                    className="py-3 bg-foreground text-background font-black rounded-md uppercase tracking-widest text-[10px] hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed"
                                >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Reçu Final</span>
                                </button>
                            </div>

                            <button
                                disabled={selectedOrder.status !== 'ready'}
                                onClick={async () => {
                                    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', selectedOrder.id);
                                    if (!error) {
                                        toast.success("Commande encaissée et livrée");
                                        setShowDetailModal(false);
                                        loadOrders();
                                    }
                                }}
                                className="w-full py-4 bg-primary text-primary-foreground font-black rounded-md uppercase tracking-[0.2em] text-[10px] border border-primary/20 hover:opacity-95 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
                            >
                                Encaisser la commande
                            </button>

                            {/* Manager Override */}
                            {(selectedOrder.status === 'pending' || selectedOrder.status === 'preparing') && (
                                <button
                                    onClick={async () => {
                                        if (confirm("Forcer le statut à 'Prêt à servir' ? (Override Manuel)")) {
                                            const { error } = await supabase.from('orders').update({ status: 'ready' }).eq('id', selectedOrder.id);
                                            if (!error) {
                                                toast.success("Override effectué: Prêt à servir");
                                                setSelectedOrder({ ...selectedOrder, status: 'ready' });
                                                loadOrders();
                                            }
                                        }
                                    }}
                                    className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-red-500 transition-colors opacity-40 hover:opacity-100"
                                >
                                    Force Ready (Manager Override)
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
