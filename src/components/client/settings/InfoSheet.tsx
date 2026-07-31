"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Feuille d'information (à propos, confidentialité, aide). Même géométrie et
 * même mouvement que la fiche détail d'un plat : un seul langage de surfaces
 * superposées dans toute l'interface convive.
 */
export function InfoSheet({
    isOpen,
    onClose,
    title,
    closeLabel,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    closeLabel: string;
    children: ReactNode;
}) {
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (!isOpen) return;
        document.body.style.overflow = "hidden";
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="backdrop"
                        className="fixed inset-0 z-[60] bg-[rgba(20,24,29,0.5)]"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                    />
                    <motion.div
                        key="sheet"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        className="fixed inset-x-0 bottom-0 top-[46px] z-[61] mx-auto flex max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-modal)] bg-white shadow-[0_20px_25px_-5px_rgba(20,24,29,0.10)]"
                        initial={{ y: shouldReduceMotion ? 0 : "100%", opacity: shouldReduceMotion ? 0 : 1 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{
                            y: shouldReduceMotion ? 0 : "100%",
                            opacity: shouldReduceMotion ? 0 : 1,
                            transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
                        }}
                        transition={
                            shouldReduceMotion
                                ? { duration: 0.15 }
                                : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }
                        }
                    >
                        <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--color-divider)] px-[14px] py-3">
                            <h2 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                                {title}
                            </h2>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                            >
                                <X className="h-[18px] w-[18px] text-[var(--color-ink)]" strokeWidth={2.2} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overscroll-contain px-[18px] py-5">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
