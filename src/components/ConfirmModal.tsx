"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

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
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen) return null;

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
            button: "bg-blue-500 hover:bg-blue-600 text-white",
            icon: "text-blue-500"
        }
    };

    const styles = variantStyles[variant];

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up z-10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Fermer"
                >
                    <X size={20} />
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
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold text-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
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
            </div>
        </div>
    );
}
