"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    dark?: boolean;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    dark = false
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-3xl p-12 text-center ${
                dark
                    ? "bg-zinc-900 border border-zinc-800"
                    : "bg-white border border-[#F5F5F5]"
            }`}
        >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                dark ? "bg-zinc-800" : "bg-gray-50"
            }`}>
                <Icon className={`w-10 h-10 ${dark ? "text-zinc-600" : "text-slate-200"}`} />
            </div>

            <h3 className={`text-xl font-black ${dark ? "text-white" : "text-[#003058]"}`}>
                {title}
            </h3>

            {description && (
                <p className={`mt-2 font-medium ${dark ? "text-zinc-500" : "text-slate-400"}`}>
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-6 bg-[#C5A065] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08e5a] transition-all active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
}
