"use client";

import { CheckCircle, Calendar, Pencil, Loader2, Trash2 } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

export interface OrderReceiptProps {
    id: string;
    tableNumber: string;
    items: OrderItem[];
    totalPrice: number;
    date?: string;
    status?: "pending" | "preparing" | "ready" | "delivered" | "sent";
    showModifyButton?: boolean;
    isModifying?: boolean;
    onModify?: () => void;
    showDeleteButton?: boolean;
    onDelete?: () => void;
    className?: string;
    animationDelay?: number;
}

export default function OrderReceiptCard({
    id,
    tableNumber,
    items,
    totalPrice,
    date,
    status = "sent",
    showModifyButton = false,
    isModifying = false,
    onModify,
    showDeleteButton = false,
    onDelete,
    className,
    animationDelay = 0
}: OrderReceiptProps) {
    const { formatPrice } = useCurrency();
    const { language } = useLanguage();

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTime = (dateStr?: string) => {
        const d = dateStr ? new Date(dateStr) : new Date();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusLabel = () => {
        switch (status) {
            case "pending": return language === 'fr' ? "En attente" : "Pending";
            case "preparing": return language === 'fr' ? "En préparation" : "Preparing";
            case "ready": return language === 'fr' ? "Prête" : "Ready";
            case "delivered": return language === 'fr' ? "Livrée" : "Delivered";
            default: return language === 'fr' ? "Confirmée" : "Confirmed";
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case "pending": return "text-amber-600";
            case "preparing": return "text-blue-600";
            case "ready": return "text-green-600";
            default: return "text-green-600";
        }
    };

    return (
        <div
            className={cn(
                "bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in-up",
                className
            )}
            style={{ animationDelay: `${animationDelay}ms` }}
        >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {date && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
                                    {formatDate(date)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className={cn("flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest", getStatusColor())}>
                        <CheckCircle size={12} />
                        <span>{getStatusLabel()}</span>
                    </div>
                </div>

                {/* Table Number */}
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Table</span>
                    <span className="text-sm font-black text-gray-900 font-mono">{tableNumber}</span>
                    {!date && (
                        <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] text-gray-400 font-mono">{formatTime()}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Items List */}
            <div className="px-6 py-4">
                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span className="text-sm font-bold text-[#003366] tabular-nums w-6 flex-shrink-0">
                                    {item.quantity}x
                                </span>
                                <span className="text-sm text-gray-700 leading-tight">
                                    {item.name}
                                </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900 tabular-nums text-right flex-shrink-0">
                                {formatPrice(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total & Actions */}
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-xl font-black text-gray-900 tabular-nums">
                        {formatPrice(totalPrice)}
                    </span>
                </div>

                {/* Actions Row */}
                {(showModifyButton || showDeleteButton) && (
                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                        {showDeleteButton && onDelete && (
                            <button
                                onClick={onDelete}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-1.5 transition-colors"
                            >
                                <Trash2 size={12} />
                                {language === 'fr' ? 'Supprimer' : 'Delete'}
                            </button>
                        )}
                        {showModifyButton && onModify && (
                            <button
                                onClick={onModify}
                                disabled={isModifying}
                                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#003366] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                                {isModifying ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Pencil size={12} />
                                )}
                                {language === 'fr' ? 'Modifier' : 'Modify'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
