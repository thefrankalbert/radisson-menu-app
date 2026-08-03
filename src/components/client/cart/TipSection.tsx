"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, HandCoins, X } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export type TipPreset = 0 | 500 | 1000 | 1500 | 2000 | "custom";

/** Montants en XAF, devise pivot : le pourboire est saisi dans la monnaie du lieu. */
export const TIP_PRESETS = [0, 500, 1000, 1500, 2000] as const;

interface Props {
    open: boolean;
    setOpen: (v: boolean) => void;
    preset: TipPreset;
    setPreset: (v: TipPreset) => void;
    customInput: string;
    setCustomInput: (v: string) => void;
    tipAmount: number;
    labels: { tip: string; none: string; custom: string; customPlaceholder: string; close: string };
}

export function TipSection({
    open,
    setOpen,
    preset,
    setPreset,
    customInput,
    setCustomInput,
    tipAmount,
    labels,
}: Props) {
    const { formatPrice } = useCurrency();

    // Replié tant que rien n'a été laissé : le pourboire est une option, pas une
    // étape — il ne doit pas occuper l'écran par défaut.
    if (!open && tipAmount === 0) {
        return (
            <section>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-expanded={false}
                    className="flex w-full items-center gap-2 py-3 text-[14px] font-semibold text-[var(--color-ink)]"
                >
                    <HandCoins className="h-4 w-4" />
                    <span>{labels.tip}</span>
                    <ChevronRight className="ml-auto h-4 w-4 text-[var(--color-ink-soft)]" />
                </button>
            </section>
        );
    }

    const options: { key: TipPreset; label: string }[] = [
        { key: 0, label: labels.none },
        ...TIP_PRESETS.filter((v) => v > 0).map((v) => ({ key: v as TipPreset, label: formatPrice(v) })),
        { key: "custom", label: labels.custom },
    ];

    return (
        <section>
            <div className="mb-2 flex items-center justify-between px-1">
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                    {labels.tip}
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setOpen(false);
                        setPreset(0);
                        setCustomInput("");
                    }}
                    aria-label={labels.close}
                    className="flex h-8 w-8 items-center justify-center text-[var(--color-ink-muted)]"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
                {options.map((opt) => {
                    const active = preset === opt.key;
                    return (
                        <button
                            key={String(opt.key)}
                            type="button"
                            aria-pressed={active}
                            onClick={() => {
                                setPreset(opt.key);
                                if (opt.key !== "custom") setCustomInput("");
                            }}
                            className={`flex-[1_0_28%] rounded-[var(--radius-search)] border py-[11px] text-[12.5px] font-semibold tabular-nums transition-colors duration-150 active:scale-[0.98] ${
                                active
                                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                                    : "border-[var(--color-divider)] bg-white text-[var(--color-ink-2)]"
                            }`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {preset === "custom" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 flex items-center gap-2 rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-white px-3.5 py-2.5">
                            <input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step={500}
                                value={customInput}
                                onChange={(e) => setCustomInput(e.target.value)}
                                placeholder={labels.customPlaceholder}
                                aria-label={labels.custom}
                                /* 16px : en dessous, iOS zoome sur le champ au focus. */
                                className="w-full flex-1 border-0 bg-transparent p-0 text-[16px] font-semibold text-[var(--color-ink)] outline-none md:text-[14px]"
                            />
                            <span className="font-mono text-[12px] text-[var(--color-ink-muted)]">FCFA</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
