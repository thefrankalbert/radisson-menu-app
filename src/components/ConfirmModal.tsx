"use client";

import { X } from "lucide-react";
import { useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "danger"
}: ConfirmModalProps) {
    const handleEsc = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEsc);
        }
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEsc);
        };
    }, [isOpen, handleEsc]);

    const variantStyles = {
        danger: {
            button: "bg-red-500 hover:bg-red-600 text-white",
            icon: "text-red-500"
        },
        warning: {
            button: "bg-yellow-500 hover:bg-yellow-600 text-white",
            icon: "text-yellow-500"
        },
        info: {
            button: "bg-[#003058] hover:bg-[#00428C] text-white",
            icon: "text-[#003058]"
        }
    };

    const styles = variantStyles[variant];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative bg-white rounded-[1.5rem] shadow-2xl max-w-md w-full p-6 z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
                            aria-label="Fermer"
                        >
                            <X size={16} />
                        </button>

                        {/* Icon */}
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center relative overflow-hidden p-3 shadow-inner">
                                <Image src="/logo.png" alt="Logo" width={60} height={60} className="object-contain" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
                            {title}
                        </h2>

                        {/* Message */}
                        <p className="text-gray-600 text-center mb-6 leading-relaxed text-sm">
                            {message}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${styles.button}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
