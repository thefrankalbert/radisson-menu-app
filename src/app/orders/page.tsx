"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Clock, CheckCircle, Calendar, Package, XCircle, Trash2, Home, Utensils } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const runtime = 'edge';

interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

export default function OrdersPage() {
    const { t } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>([]);

    useEffect(() => {
        const savedHistory = localStorage.getItem('order_history');
        if (savedHistory) {
            try {
                setHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error("Failed to load history");
            }
        }
    }, []);

    const handleClearHistory = () => {
        if (window.confirm(t('confirm_clear_history') || "Effacer tout l'historique ?")) {
            localStorage.removeItem('order_history');
            setHistory([]);
            toast.success("Historique effacé");
        }
    };

    const handleDeleteOrder = (id: string) => {
        const newHistory = history.filter(o => o.id !== id);
        setHistory(newHistory);
        localStorage.setItem('order_history', JSON.stringify(newHistory));
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="min-h-screen bg-radisson-light pb-32 animate-fade-in pt-20">
            <div className="max-w-md mx-auto px-6">

                <h1 className="text-2xl font-black text-[#002C5F] mb-8 text-center uppercase tracking-tight">
                    {t('my_orders') || "Mes Commandes"}
                </h1>

                <div className="flex justify-end mb-4">
                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="text-[10px] font-bold text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            Tout effacer
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="bg-white rounded-[24px] p-12 text-center border border-gray-100 shadow-soft animate-fade-in-up">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package size={32} className="text-gray-200" />
                        </div>
                        <h2 className="text-lg font-bold text-[#002C5F] mb-2">Aucune commande</h2>
                        <p className="text-gray-400 font-medium italic text-xs md:text-sm mb-8">
                            Vous n&apos;avez pas encore passé de commande.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#002C5F] text-white px-6 py-3 rounded-xl font-bold text-xs tracking-widest hover:bg-[#00428C] transition-all active:scale-95 shadow-soft"
                        >
                            <Utensils size={14} />
                            COMMANDER
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {history.map((order, index) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-[24px] shadow-soft border border-gray-100 overflow-hidden animate-fade-in-up group relative pb-4"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <button
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1 z-10"
                                >
                                    <XCircle size={18} />
                                </button>
                                <div className="p-4 border-b border-dashed border-gray-200 flex justify-between items-center bg-gray-50/50 pr-12">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-radisson-gold" />
                                        <span className="text-[10px] font-bold text-[#002C5F] uppercase tracking-widest font-mono">
                                            {formatDate(order.date)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-green-100">
                                        <CheckCircle size={10} />
                                        ENVOYÉE
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-black text-gray-400 text-xs">x{item.quantity}</span>
                                                <span className="text-[#002C5F] font-bold leading-tight">{item.name}</span>
                                            </div>
                                            <span className="text-[#002C5F] font-mono font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mx-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-lg">
                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">TABLE</span>
                                        <span className="text-[#002C5F] font-black text-xs font-mono">{order.tableNumber}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-[#002C5F] font-mono">{order.totalPrice.toLocaleString()} <span className="text-[10px] text-radisson-gold">FCFA</span></span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="text-center pt-8">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 text-gray-400 hover:text-[#002C5F] transition-colors text-xs font-bold uppercase tracking-widest"
                            >
                                <Home size={14} />
                                Retour à l&apos;accueil
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
