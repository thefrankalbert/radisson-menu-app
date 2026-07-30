"use client";

import { Trash2, Clock } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export interface OrderCardOrder {
    id: string;
    date: string;
    tableNumber: string;
    totalPrice: number;
    items: { name: string; quantity: number; price: number }[];
}

interface Props {
    order: OrderCardOrder;
    lang: "fr" | "en";
    onDelete: () => void;
    labels: { table: string; sent: string; delete: string };
}

/** Un identifiant complet n'aide personne ; les 6 derniers caractères suffisent
 *  à désigner la commande auprès du serveur. */
function shortRef(id: string): string {
    return id.slice(-6).toUpperCase();
}

export function OrderCard({ order, lang, onDelete, labels }: Props) {
    const { formatPrice } = useCurrency();
    const when = new Date(order.date);
    const time = when.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });
    const day = when.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "short",
    });

    return (
        <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white">
            <header className="flex items-center gap-3 border-b border-[var(--color-divider)] px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                            #{shortRef(order.id)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-tag)] bg-[var(--color-brand-light)] px-2 py-[3px] text-[10.5px] font-semibold text-[var(--color-brand)]">
                            <Clock className="h-[11px] w-[11px]" strokeWidth={2.2} />
                            {labels.sent}
                        </span>
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]">
                        {labels.table} {order.tableNumber} · {day} {time}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={labels.delete}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
                >
                    <Trash2 className="h-4 w-4 text-[var(--color-ink-soft)]" strokeWidth={2} />
                </button>
            </header>

            <ul className="px-4 py-2">
                {order.items.map((item, i) => (
                    <li
                        key={`${item.name}-${i}`}
                        className="flex items-baseline gap-3 border-b border-[var(--color-divider)] py-2.5 last:border-b-0"
                    >
                        <span className="w-6 shrink-0 font-mono text-[12.5px] font-medium tabular-nums text-[var(--color-ink-muted)]">
                            {item.quantity}×
                        </span>
                        <span className="min-w-0 flex-1 text-[13.5px] font-medium leading-[1.35] tracking-[-0.1px] text-[var(--color-ink)]">
                            {item.name}
                        </span>
                        <span className="shrink-0 text-[13px] tabular-nums text-[var(--color-ink-2)]">
                            {formatPrice(item.price * item.quantity)}
                        </span>
                    </li>
                ))}
            </ul>

            <footer className="flex items-center justify-between border-t border-[var(--color-divider)] px-4 py-3">
                <span className="text-[13px] font-semibold tracking-[-0.2px] text-[var(--color-ink)]">
                    Total
                </span>
                <span className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
                    {formatPrice(order.totalPrice)}
                </span>
            </footer>
        </article>
    );
}
