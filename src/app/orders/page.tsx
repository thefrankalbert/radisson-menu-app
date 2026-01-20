"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CheckCircle, Calendar, Package, XCircle, Trash2, Home, Utensils } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";



interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

export default function OrdersPage() {
    const { t, language } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

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

    const clearHistory = () => {
        localStorage.removeItem('order_history');
        setHistory([]);
        toast.success(language === 'fr' 
            ? "Historique effacé avec succès !" 
            : "History cleared successfully!");
    };

    const handleDeleteOrder = () => {
        if (!orderToDelete) return;
        const newHistory = history.filter(o => o.id !== orderToDelete);
        setHistory(newHistory);
        localStorage.setItem('order_history', JSON.stringify(newHistory));
        toast.success(language === 'fr' 
            ? "Commande supprimée !" 
            : "Order deleted!");
        setOrderToDelete(null);
    };

    const openDeleteModal = (id: string) => {
        setOrderToDelete(id);
        setShowDeleteModal(true);
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
        <main className="min-h-screen bg-radisson-light pb-24 animate-fade-in pt-20">
            {/* Clear History Modal */}
            <ConfirmModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={clearHistory}
                title={language === 'fr' ? "Effacer tout l'historique" : "Clear all history"}
                message={language === 'fr' 
                    ? "Êtes-vous sûr de vouloir effacer tout l'historique de vos commandes ? Cette action est irréversible." 
                    : "Are you sure you want to clear all your order history? This action cannot be undone."}
                confirmText={language === 'fr' ? "Effacer" : "Clear"}
                cancelText={language === 'fr' ? "Annuler" : "Cancel"}
                variant="danger"
            />

            {/* Delete Order Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setOrderToDelete(null);
                }}
                onConfirm={handleDeleteOrder}
                title={language === 'fr' ? "Supprimer la commande" : "Delete order"}
                message={language === 'fr' 
                    ? "Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible." 
                    : "Are you sure you want to delete this order? This action cannot be undone."}
                confirmText={language === 'fr' ? "Supprimer" : "Delete"}
                cancelText={language === 'fr' ? "Annuler" : "Cancel"}
                variant="danger"
            />

            <div className="max-w-md mx-auto px-6">

                <h1 className="text-lg font-bold text-gray-800 my-6 text-center uppercase tracking-widest">
                    {t('my_orders') || "Mes Commandes"}
                </h1>

                <div className="flex justify-end mb-4">
                    {history.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowClearModal(true);
                            }}
                            className="text-[10px] font-bold text-red-300 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                            <Trash2 size={12} />
                            {language === 'fr' ? "Tout effacer" : "Clear all"}
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
                                className="shadow-sm drop-shadow-sm p-6 relative animate-fade-in-up group pr-10"
                                style={{
                                    animationDelay: `${index * 100}ms`,
                                    background: `
                                        linear-gradient(to bottom, white 0%, white calc(100% - 10px), transparent calc(100% - 10px)),
                                        radial-gradient(circle at 10px bottom, transparent 10px, white 10.5px)
                                    `,
                                    backgroundSize: '100% 100%, 20px 20px',
                                    backgroundPosition: '0 0, bottom left',
                                    backgroundRepeat: 'no-repeat, repeat-x',
                                    paddingBottom: '30px',
                                    marginBottom: '24px'
                                }}
                            >
                                <button
                                    onClick={() => openDeleteModal(order.id)}
                                    className="absolute top-2 right-2 text-red-300 hover:text-red-500 transition-colors p-2 z-20"
                                    title={language === 'fr' ? "Supprimer" : "Delete"}
                                >
                                    <XCircle size={20} />
                                </button>

                                {/* Header Ticket */}
                                <div className="border-b-2 border-dashed border-gray-200 pb-4 mb-4 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar size={12} className="text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">
                                                {formatDate(order.date)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold text-gray-800 w-fit">
                                            <span className="text-[8px] uppercase tracking-widest text-gray-400">TABLE</span>
                                            {order.tableNumber}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle size={12} />
                                        <span>Reçu</span>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="space-y-2 mb-6 font-mono text-xs md:text-sm text-gray-800">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-baseline w-full">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-bold">{item.quantity}x</span>
                                                <span className="uppercase text-[11px] md:text-xs leading-tight">{item.name}</span>
                                            </div>
                                            <div className="flex-1 border-b border-dotted border-gray-300 mx-2 relative top-[-4px] opacity-30"></div>
                                            <span className="font-bold">{(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Total */}
                                <div className="border-t-2 border-dashed border-gray-200 pt-3 flex justify-between items-end">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                    <span className="text-lg font-black text-gray-900 font-mono">
                                        {order.totalPrice.toLocaleString()} <span className="text-[9px] text-gray-400 font-sans">FCFA</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
