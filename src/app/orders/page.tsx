"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Package, Trash2, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import OrderReceiptCard from "@/components/OrderReceiptCard";

interface HistoryItem {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

// Validation de la structure d'un item d'historique
const isValidHistoryItem = (item: unknown): item is HistoryItem => {
    if (!item || typeof item !== 'object') return false;

    const obj = item as Record<string, unknown>;

    return (
        typeof obj.id === 'string' &&
        typeof obj.date === 'string' &&
        Array.isArray(obj.items) &&
        obj.items.every((i: unknown) => {
            if (!i || typeof i !== 'object') return false;
            const orderItem = i as Record<string, unknown>;
            return (
                typeof orderItem.name === 'string' &&
                typeof orderItem.quantity === 'number' &&
                typeof orderItem.price === 'number'
            );
        }) &&
        typeof obj.totalPrice === 'number' &&
        typeof obj.tableNumber === 'string' &&
        typeof obj.status === 'string'
    );
};

// Parser sécurisé pour l'historique des commandes
const parseOrderHistory = (jsonString: string): HistoryItem[] => {
    try {
        const parsed = JSON.parse(jsonString);

        if (!Array.isArray(parsed)) {
            console.warn("Order history is not an array, resetting...");
            return [];
        }

        const validItems = parsed.filter(isValidHistoryItem);

        if (validItems.length !== parsed.length) {
            console.warn(`Filtered out ${parsed.length - validItems.length} invalid history items`);
        }

        return validItems;
    } catch (e) {
        console.error("Failed to parse order history:", e);
        return [];
    }
};

export default function OrdersPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    useEffect(() => {
        const savedHistory = localStorage.getItem('order_history');
        if (savedHistory) {
            const validHistory = parseOrderHistory(savedHistory);
            setHistory(validHistory);

            if (validHistory.length > 0) {
                localStorage.setItem('order_history', JSON.stringify(validHistory));
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
        setShowDeleteModal(false);
    };

    const openDeleteModal = (id: string) => {
        setOrderToDelete(id);
        setShowDeleteModal(true);
    };

    return (
        <main className="min-h-screen bg-[#F7F7F7] pb-24 animate-fade-in pt-4">
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

            <div className="max-w-md mx-auto px-4">
                {/* Header */}
                <div className="mt-6 mb-6 relative flex items-center justify-center">
                    <button
                        onClick={() => router.back()}
                        className="absolute left-0 p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-900 uppercase tracking-widest">
                        {t('my_orders') || "Mes Commandes"}
                    </h1>
                </div>

                {/* Clear All Button */}
                {history.length > 0 && (
                    <div className="flex justify-end mb-4">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowClearModal(true);
                            }}
                            className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={12} />
                            {language === 'fr' ? "Tout effacer" : "Clear all"}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {history.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title={language === 'fr' ? 'Aucune commande' : 'No orders yet'}
                        subtitle={language === 'fr'
                            ? "Découvrez notre menu et commencez votre commande !"
                            : "Explore our menu and start your order!"}
                        actionLabel={language === 'fr' ? 'Commander' : 'Place order'}
                        actionHref="/"
                    />
                ) : (
                    <div className="space-y-4">
                        {history.map((order, index) => (
                            <OrderReceiptCard
                                key={order.id}
                                id={order.id}
                                tableNumber={order.tableNumber}
                                items={order.items}
                                totalPrice={order.totalPrice}
                                date={order.date}
                                status="sent"
                                showDeleteButton={true}
                                onDelete={() => openDeleteModal(order.id)}
                                animationDelay={index * 50}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
