"use client";

import { useCurrency } from "@/context/CurrencyContext";

interface Props {
    subtotal: number;
    tipAmount: number;
    finalTotal: number;
    labels: { subtotal: string; tip: string; total: string };
}

export function OrderSummary({ subtotal, tipAmount, finalTotal, labels }: Props) {
    const { formatPrice } = useCurrency();

    return (
        <section className="rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white px-4 py-3.5">
            <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-[13px] text-[var(--color-ink-muted)]">
                        {labels.subtotal}
                    </span>
                    <span className="shrink-0 text-[13px] font-medium tabular-nums text-[var(--color-ink-2)]">
                        {formatPrice(subtotal)}
                    </span>
                </div>

                {tipAmount > 0 && (
                    <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[13px] text-[var(--color-ink-muted)]">
                            {labels.tip}
                        </span>
                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-[var(--color-ink-2)]">
                            {formatPrice(tipAmount)}
                        </span>
                    </div>
                )}

                <div className="mt-1 border-t border-[var(--color-divider)] pt-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold tracking-[-0.2px] text-[var(--color-ink)]">
                            {labels.total}
                        </span>
                        <span className="text-[18px] font-bold tabular-nums text-[var(--color-ink)]">
                            {formatPrice(finalTotal)}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
