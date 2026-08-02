"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MapPin, QrCode, X } from "lucide-react";
import dynamic from "next/dynamic";
import { normalizeTableNumber } from "@/lib/venue-routing";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false, loading: () => null });

const COPY = {
    title: { fr: "Quelle est votre table ?", en: "Which table are you at?" },
    why: {
        fr: "Sans ce numéro, la cuisine ne sait pas où apporter votre commande.",
        en: "Without it, the kitchen does not know where to bring your order.",
    },
    placeholder: { fr: "Ex. P05, L12…", en: "e.g. P05, L12…" },
    scan: { fr: "Scanner le QR de la table", en: "Scan the table QR code" },
    confirm: { fr: "Valider", en: "Confirm" },
    skip: { fr: "Je ne sais pas, envoyer quand même", en: "I don't know, send anyway" },
    close: { fr: "Fermer", en: "Close" },
} as const;

interface Props {
    isOpen: boolean;
    lang: "fr" | "en";
    onClose: () => void;
    /** Table saisie et normalisée, ou null si le convive passe outre. */
    onConfirm: (table: string | null) => void;
}

/**
 * Demande le numéro de table quand le QR ne l'a pas fourni.
 *
 * Auparavant la commande partait avec le marqueur « AUTO-01 » : sur juillet,
 * 37 % des commandes arrivaient ainsi en cuisine sans savoir où les servir.
 * Le convive peut toujours passer outre — mais c'est un choix explicite, pas un
 * silence.
 */
export function TablePrompt({ isOpen, lang, onClose, onConfirm }: Props) {
    const say = (k: keyof typeof COPY) => COPY[k][lang];
    const shouldReduceMotion = useReducedMotion();
    const [value, setValue] = useState("");
    const [scannerOpen, setScannerOpen] = useState(false);

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

    const cleaned = normalizeTableNumber(value);

    return (
        <>
            {/* Pas d'AnimatePresence ni d'animation de sortie : une feuille avec
                exit y:"100%" restait montée hors écran après fermeture (le nœud
                traînait dans le DOM, piégeant le focus). Sans exit, la fermeture
                est un simple démontage — instantané et fiable. L'entrée reste
                animée par motion (initial → animate), qui n'a pas besoin
                d'AnimatePresence. */}
            {isOpen && (
                    <div className="fixed inset-0 z-[70]">
                        <motion.div
                            className="absolute inset-0 bg-[rgba(20,24,29,0.5)]"
                            onClick={onClose}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        />
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label={say("title")}
                            className="absolute inset-x-0 bottom-0 z-[1] mx-auto max-w-lg rounded-t-[var(--radius-modal)] bg-white px-5 pt-5 shadow-[0_-8px_24px_-8px_rgba(20,24,29,0.18)]"
                            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
                            initial={{ y: shouldReduceMotion ? 0 : "100%", opacity: shouldReduceMotion ? 0 : 1 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={
                                shouldReduceMotion
                                    ? { duration: 0.15 }
                                    : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }
                            }
                        >
                            <div className="mb-4 flex items-start gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-light)]">
                                    <MapPin className="h-5 w-5 text-[var(--color-brand)]" strokeWidth={2} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-[17px] font-semibold tracking-[-0.4px] text-[var(--color-ink)]">
                                        {say("title")}
                                    </h2>
                                    <p className="mt-1 text-[13px] leading-[1.45] text-[var(--color-ink-muted)]">
                                        {say("why")}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label={say("close")}
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
                                >
                                    <X className="h-[18px] w-[18px] text-[var(--color-ink-muted)]" strokeWidth={2.2} />
                                </button>
                            </div>

                            <input
                                autoFocus
                                type="text"
                                inputMode="text"
                                autoCapitalize="characters"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && cleaned) onConfirm(cleaned);
                                }}
                                placeholder={say("placeholder")}
                                aria-label={say("title")}
                                /* 16px : en dessous, iOS zoome sur le champ au focus. */
                                className="w-full rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)] px-4 py-3 text-[16px] font-semibold uppercase tracking-[0.5px] text-[var(--color-ink)] outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--color-ink-muted)]"
                            />

                            <button
                                type="button"
                                onClick={() => onConfirm(cleaned)}
                                disabled={!cleaned}
                                className="mt-3 flex h-[52px] w-full items-center justify-center rounded-full bg-[var(--color-brand)] text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[0.98] disabled:opacity-40"
                            >
                                {say("confirm")}
                            </button>

                            <button
                                type="button"
                                onClick={() => setScannerOpen(true)}
                                className="mt-2 flex h-[48px] w-full items-center justify-center gap-2 rounded-full border border-[var(--color-divider)] text-[14px] font-semibold text-[var(--color-ink)] transition-transform duration-150 active:scale-[0.98]"
                            >
                                <QrCode className="h-[17px] w-[17px]" strokeWidth={2} />
                                {say("scan")}
                            </button>

                            <button
                                type="button"
                                onClick={() => onConfirm(null)}
                                className="mt-3 w-full py-2 text-center text-[13px] text-[var(--color-ink-muted)] underline underline-offset-2"
                            >
                                {say("skip")}
                            </button>
                        </motion.div>
                    </div>
                )}

            {scannerOpen && <QRScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />}
        </>
    );
}
