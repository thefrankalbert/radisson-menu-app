"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Package, Trash2, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
import { OrderCard } from "@/components/client/OrderCard";
import {
    readOrderHistory,
    writeOrderHistory,
    ORDER_HISTORY_KEY,
    type HistoryOrder,
} from "@/lib/order-history";

export default function OrdersPage() {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [history, setHistory] = useState<HistoryOrder[]>([]);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    useEffect(() => {
        setHistory(readOrderHistory());
    }, []);

    const clearHistory = () => {
        localStorage.removeItem(ORDER_HISTORY_KEY);
        setHistory([]);
        toast.success(language === 'fr'
            ? "Historique effacé avec succès !"
            : "History cleared successfully!");
    };

    const handleDeleteOrder = () => {
        if (!orderToDelete) return;
        const newHistory = history.filter(o => o.id !== orderToDelete);
        setHistory(newHistory);
        writeOrderHistory(newHistory);
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
        <main className="min-h-full bg-[var(--color-surface-alt)] pb-24">
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

            <div className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-white">
                <div className="flex items-center gap-2.5 px-[14px] py-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        aria-label={language === 'fr' ? "Retour" : "Go back"}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-[var(--color-ink)]" />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                        {language === 'fr' ? "Mes commandes" : "My orders"}
                    </h1>
                    {history.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowClearModal(true)}
                            aria-label={language === 'fr' ? "Tout effacer" : "Clear all"}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
                        >
                            <Trash2 className="h-[18px] w-[18px] text-[var(--color-ink-muted)]" strokeWidth={2} />
                        </button>
                    )}
                </div>
            </div>

            {history.length === 0 ? (
                <div className="flex flex-col items-center px-8 py-24 text-center">
                    <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[var(--radius-modal)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                        <Package className="h-8 w-8 text-[var(--color-ink-soft)]" strokeWidth={1.6} />
                    </div>
                    <h2 className="text-[18px] font-semibold tracking-[-0.4px] text-[var(--color-ink)]">
                        {language === 'fr' ? "Aucune commande" : "No orders yet"}
                    </h2>
                    <p className="mt-1.5 max-w-[260px] text-[13px] text-[var(--color-ink-muted)]">
                        {language === 'fr'
                            ? "Vos commandes passées depuis cet appareil s'afficheront ici."
                            : "Orders placed from this device will show up here."}
                    </p>
                    <Link
                        href="/"
                        className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--color-brand)] px-6 text-[14px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
                    >
                        {language === 'fr' ? "Voir la carte" : "Browse the menu"}
                    </Link>
                </div>
            ) : (
                <div className="space-y-3 px-4 pt-4">
                    {history.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            lang={language === 'en' ? 'en' : 'fr'}
                            onDelete={() => openDeleteModal(order.id)}
                            labels={{
                                table: language === 'fr' ? "Table" : "Table",
                                sent: language === 'fr' ? "Envoyée" : "Sent",
                                cancelled: language === 'fr' ? "Annulée" : "Cancelled",
                                delete: language === 'fr' ? "Supprimer la commande" : "Delete order",
                            }}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
