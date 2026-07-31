"use client";

import { Clock, ChefHat, BellRing, CheckCircle2, Pencil } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

interface Props {
    reference: string;
    tableNumber: string;
    status: OrderStatus;
    items: { name: string; quantity: number; price: number }[];
    totalPrice: number;
    lang: "fr" | "en";
    /** Millisecondes restantes pour modifier, ou null hors fenêtre. */
    timeLeftMs: number | null;
    onModify?: () => void;
    isModifying?: boolean;
}

const STATUS_COPY: Record<OrderStatus, { fr: string; en: string }> = {
    pending: { fr: "Reçue", en: "Received" },
    preparing: { fr: "En préparation", en: "Being prepared" },
    ready: { fr: "Prête", en: "Ready" },
    delivered: { fr: "Servie", en: "Served" },
    cancelled: { fr: "Annulée", en: "Cancelled" },
};

const STATUS_STYLE: Record<OrderStatus, string> = {
    pending: "bg-[var(--color-brand-light)] text-[var(--color-brand)]",
    preparing: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
    ready: "bg-[#eaf5ee] text-[var(--color-success)]",
    delivered: "bg-[var(--color-surface-alt)] text-[var(--color-ink-muted)]",
    cancelled: "bg-[#fdeeec] text-[var(--color-promo)]",
};

const STATUS_ICON = {
    pending: Clock,
    preparing: ChefHat,
    ready: BellRing,
    delivered: CheckCircle2,
    cancelled: Clock,
} as const;

/** Compte à rebours au format m:ss — les secondes rassurent, l'arrondi non. */
function formatCountdown(ms: number): string {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function OrderStatusCard({
    reference,
    tableNumber,
    status,
    items,
    totalPrice,
    lang,
    timeLeftMs,
    onModify,
    isModifying,
}: Props) {
    const { formatPrice } = useCurrency();
    // `get_order` ne renvoie pas le pourboire séparément : il se déduit de
    // l'écart entre le total enregistré et la somme des lignes.
    const itemsTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tipAmount = Math.max(0, totalPrice - itemsTotal);
    const StatusIcon = STATUS_ICON[status];
    const canModify = typeof onModify === "function" && timeLeftMs !== null && timeLeftMs > 0;

    return (
        <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white">
            <header className="flex items-center gap-3 border-b border-[var(--color-divider)] px-4 py-3">
                <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                        #{reference}
                    </div>
                    <div className="mt-0.5 truncate text-[13px] text-[var(--color-ink-muted)]">
                        {lang === "fr" ? "Table" : "Table"} {tableNumber}
                    </div>
                </div>
                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-tag)] px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[status]}`}
                >
                    <StatusIcon className="h-[12px] w-[12px]" strokeWidth={2.2} />
                    {STATUS_COPY[status][lang]}
                </span>
            </header>

            <ul className="px-4 py-2">
                {items.map((item, i) => (
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

            <div className="border-t border-[var(--color-divider)] px-4 py-3">
                {/* Le pourboire est déduit du total serveur moins les lignes : sans
                    cette ligne, le total dépassait la somme affichée sans explication. */}
                {tipAmount > 0 && (
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[13px] text-[var(--color-ink-muted)]">
                            {lang === "fr" ? "Pourboire" : "Tip"}
                        </span>
                        <span className="text-[13px] tabular-nums text-[var(--color-ink-2)]">
                            {formatPrice(tipAmount)}
                        </span>
                    </div>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold tracking-[-0.2px] text-[var(--color-ink)]">
                        Total
                    </span>
                    <span className="text-[16px] font-bold tabular-nums text-[var(--color-ink)]">
                        {formatPrice(totalPrice)}
                    </span>
                </div>
            </div>

            {canModify && (
                <div className="flex items-center gap-3 border-t border-[var(--color-divider)] px-4 py-3">
                    <span className="min-w-0 flex-1 text-[12.5px] text-[var(--color-ink-muted)]">
                        {lang === "fr" ? "Modifiable encore" : "Editable for"}{" "}
                        <span className="font-semibold tabular-nums text-[var(--color-ink)]">
                            {formatCountdown(timeLeftMs)}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={onModify}
                        disabled={isModifying}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-divider)] px-3.5 text-[13px] font-semibold text-[var(--color-ink)] transition-transform duration-150 active:scale-95 disabled:opacity-50"
                    >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2.2} />
                        {isModifying
                            ? lang === "fr"
                                ? "…"
                                : "…"
                            : lang === "fr"
                              ? "Modifier"
                              : "Edit"}
                    </button>
                </div>
            )}
        </article>
    );
}
