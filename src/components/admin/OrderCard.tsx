"use client";

import { useMemo, useState, useEffect } from "react";
import { Clock, Timer, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type OrderItem = {
    name: string;
    quantity: number;
    price: number;
};

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

type OrderProps = {
    order: {
        id: string;
        table_number: string;
        status: OrderStatus;
        total_price: number;
        created_at: string;
        items?: OrderItem[];
    };
    onStatusChange: (orderId: string, newStatus: string) => void;
    compact?: boolean; // Mode compact pour KDS
};

const statusConfig: Record<OrderStatus, {
    color: string;
    bg: string;
    text: string;
    label: string;
    border: string;
    nextStatus: string | null;
    nextLabel: string | null;
}> = {
    pending: {
        color: "#F59E0B",
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: "En attente",
        border: "border-l-[#F59E0B]",
        nextStatus: "preparing",
        nextLabel: "Préparer"
    },
    preparing: {
        color: "#3B82F6",
        bg: "bg-blue-50",
        text: "text-blue-700",
        label: "Préparation",
        border: "border-l-[#3B82F6]",
        nextStatus: "ready",
        nextLabel: "Prêt"
    },
    ready: {
        color: "#22C55E",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        label: "Prêt",
        border: "border-l-[#22C55E]",
        nextStatus: "delivered",
        nextLabel: "Livrer"
    },
    delivered: {
        color: "#6B7280",
        bg: "bg-slate-50",
        text: "text-slate-500",
        label: "Livré",
        border: "border-l-[#6B7280]",
        nextStatus: null,
        nextLabel: null
    },
    cancelled: {
        color: "#EF4444",
        bg: "bg-red-50",
        text: "text-red-500",
        label: "Annulée",
        border: "border-l-[#EF4444]",
        nextStatus: null,
        nextLabel: null
    },
};

// Hook pour calculer le temps écoulé
function useElapsedTime(createdAt: string, status: OrderStatus) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        // Ne pas compter si livré ou annulé
        if (status === 'delivered' || status === 'cancelled') {
            const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
            setElapsed(diff);
            return;
        }

        // Calculer immédiatement
        const calculate = () => {
            const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
            setElapsed(diff);
        };

        calculate();
        const interval = setInterval(calculate, 1000);

        return () => clearInterval(interval);
    }, [createdAt, status]);

    return elapsed;
}

// Formater le temps écoulé
function formatElapsedTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
}

// Déterminer la couleur du timer selon le temps
function getTimerColor(seconds: number, status: OrderStatus): string {
    if (status === 'delivered' || status === 'cancelled') return 'text-slate-400';

    if (seconds < 300) return 'text-emerald-500'; // < 5 min = vert
    if (seconds < 600) return 'text-amber-500';   // < 10 min = orange
    return 'text-red-500';                         // > 10 min = rouge (urgent!)
}

export default function OrderCard({ order, onStatusChange, compact = false }: OrderProps) {
    const config = statusConfig[order.status];
    const isPending = order.status === 'pending';
    const elapsed = useElapsedTime(order.created_at, order.status);
    const timerColor = getTimerColor(elapsed, order.status);
    const isUrgent = elapsed >= 600 && order.status !== 'delivered' && order.status !== 'cancelled';

    const timeString = useMemo(() => {
        return new Date(order.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [order.created_at]);

    return (
        <motion.div
            initial={isPending ? { scale: 1 } : {}}
            animate={isPending ? {
                boxShadow: ["0px 0px 0px rgba(245, 158, 11, 0)", "0px 0px 20px rgba(245, 158, 11, 0.2)", "0px 0px 0px rgba(245, 158, 11, 0)"]
            } : {}}
            transition={isPending ? { repeat: Infinity, duration: 2 } : {}}
            className={cn(
                "bg-white rounded-3xl border-l-[6px] shadow-sm overflow-hidden flex flex-col transition-all border-[#F5F5F5]",
                config.border,
                isUrgent && "ring-2 ring-red-500 ring-offset-2"
            )}
        >
            {/* Header */}
            <div className={cn("flex items-center justify-between border-b border-[#F5F5F5]", compact ? "p-3" : "p-5")}>
                <div className="flex items-center space-x-3">
                    <div className={cn(
                        "bg-slate-100 rounded-xl flex items-center justify-center font-black text-[#003058]",
                        compact ? "w-8 h-8 text-sm" : "w-10 h-10"
                    )}>
                        {order.table_number}
                    </div>
                    <div>
                        <h4 className={cn("font-black text-[#003058]", compact ? "text-xs" : "text-sm")}>
                            Table {order.table_number}
                        </h4>
                        <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <Clock className="w-3 h-3 mr-1" />
                            {timeString}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                    <span className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        config.bg,
                        config.text
                    )}>
                        {config.label}
                    </span>

                    {/* Timer temps écoulé */}
                    <div className={cn(
                        "flex items-center space-x-1 font-mono font-black",
                        timerColor,
                        compact ? "text-xs" : "text-sm"
                    )}>
                        {isUrgent && <AlertTriangle className="w-3 h-3 animate-pulse" />}
                        <Timer className="w-3 h-3" />
                        <span>{formatElapsedTime(elapsed)}</span>
                    </div>
                </div>
            </div>

            {/* Body - Items */}
            <div className={cn("flex-1 space-y-2", compact ? "p-3" : "p-5 space-y-3")}>
                {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                            <span className={cn(
                                "flex items-center justify-center bg-[#F5F5F5] rounded-md font-black text-[#003058]",
                                compact ? "w-5 h-5 text-[9px]" : "w-6 h-6 text-[10px]"
                            )}>
                                {item.quantity}
                            </span>
                            <span className={cn(
                                "font-bold text-slate-600 truncate",
                                compact ? "text-xs max-w-[100px]" : "text-sm max-w-[140px]"
                            )}>
                                {item.name}
                            </span>
                        </div>
                        {!compact && (
                            <span className="text-[10px] font-bold text-slate-400">
                                {item.price * item.quantity} F
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className={cn("bg-slate-50/50 space-y-3", compact ? "p-3" : "p-5 space-y-4")}>
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</span>
                    <span className={cn("font-black text-[#003058]", compact ? "text-base" : "text-lg")}>
                        {order.total_price.toLocaleString()} FCFA
                    </span>
                </div>

                {config.nextStatus && (
                    <button
                        onClick={() => onStatusChange(order.id, config.nextStatus!)}
                        className={cn(
                            "w-full rounded-xl flex items-center justify-center space-x-2 text-white font-black uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                            compact ? "h-10 text-[10px]" : "h-12 text-xs",
                            order.status === 'pending' ? "bg-amber-500 shadow-amber-500/20" :
                                order.status === 'preparing' ? "bg-blue-500 shadow-blue-500/20" :
                                    "bg-emerald-500 shadow-emerald-500/20"
                        )}
                    >
                        <span>{config.nextLabel}</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}
