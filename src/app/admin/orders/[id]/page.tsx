"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ChevronLeft,
    Printer,
    Clock,
    User,
    MapPin,
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Utensils,
    Trash2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Order, OrderStatus } from "@/types/admin";
import { toast } from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { OrderDetailSkeleton } from "@/components/admin/Skeleton";

export default function OrderDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const loadOrder = useCallback(async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        quantity,
                        price_at_order,
                        notes,
                        menu_items (
                            name,
                            image_url
                        )
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const formatted: Order = {
                ...data,
                items: (data.order_items || []).map((item: any) => ({
                    id: item.id,
                    name: item.menu_items?.name || 'Inconnu',
                    quantity: item.quantity,
                    price: item.price_at_order,
                    notes: item.notes
                }))
            };

            setOrder(formatted);
        } catch (error) {
            console.error('Error loading order:', error);
            toast.error("Impossible de charger la commande");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handleStatusUpdate = async (status: OrderStatus) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            toast.success("Statut mis à jour");
            loadOrder();
        } catch (e) {
            toast.error("Erreur serveur");
        }
    };

    if (loading) return <OrderDetailSkeleton />;
    if (!order) return <div className="p-10 text-center text-red-500">Commande introuvable</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-semibold"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Retour
                </button>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>
                </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-[#003058]">Table {order.table_number}</h1>
                                <Badge className="uppercase tracking-widest text-[10px] py-1 px-3">
                                    {order.status}
                                </Badge>
                            </div>
                            <p className="text-gray-400 font-medium text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {new Date(order.created_at).toLocaleString('fr-FR')}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Commande</p>
                            <p className="text-3xl font-black text-orange-500">{order.total_price.toLocaleString()} F</p>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="p-8 space-y-6">
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Détails des articles</h2>
                    <div className="space-y-4">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-[#003058] shadow-sm border border-gray-100">
                                        {item.quantity}x
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{item.name}</p>
                                        {item.notes && <p className="text-xs text-red-500 font-medium mt-0.5">📝 {item.notes}</p>}
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString()} F</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Controls */}
                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-wrap gap-3">
                    <button
                        onClick={() => handleStatusUpdate('pending')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${order.status === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500'}`}
                    >
                        En attente
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('preparing')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${order.status === 'preparing' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500'}`}
                    >
                        En préparation
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('ready')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${order.status === 'ready' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500'}`}
                    >
                        Prêt
                    </button>
                    <button
                        onClick={() => handleStatusUpdate('delivered')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${order.status === 'delivered' ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-500'}`}
                    >
                        Servi / Payé
                    </button>
                </div>
            </div>
        </div>
    );
}
