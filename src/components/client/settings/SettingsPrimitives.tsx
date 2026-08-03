"use client";

import type { ReactNode } from "react";
import { ChevronRight, Check } from "lucide-react";

/** Intitulé de groupe : mono, capitales, discret — il structure sans crier. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mb-5">
            <h2 className="mb-2 px-1 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                {title}
            </h2>
            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white">
                {children}
            </div>
        </section>
    );
}

interface RowProps {
    icon?: ReactNode;
    label: string;
    /** Valeur courante, alignée à droite avant le chevron. */
    value?: string;
    onClick?: () => void;
    /** Contrôle personnalisé (interrupteur, sélecteur) à la place du chevron. */
    trailing?: ReactNode;
}

export function SettingsRow({ icon, label, value, onClick, trailing }: RowProps) {
    const content = (
        <>
            {icon && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-alt)] text-[var(--color-ink-2)]">
                    {icon}
                </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.1px] text-[var(--color-ink)]">
                {label}
            </span>
            {value && (
                <span className="shrink-0 text-[13px] text-[var(--color-ink-muted)]">{value}</span>
            )}
            {trailing ?? (onClick && <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />)}
        </>
    );

    const shell =
        "flex w-full items-center gap-3 border-b border-[var(--color-divider)] px-4 py-[15px] text-left last:border-b-0";

    if (!onClick) return <div className={shell}>{content}</div>;

    return (
        <button type="button" onClick={onClick} className={`${shell} active:bg-[var(--color-surface-alt)]`}>
            {content}
        </button>
    );
}

interface ChoiceProps<T extends string> {
    options: { value: T; label: string; hint?: string }[];
    active: T;
    onSelect: (value: T) => void;
    ariaLabel: string;
}

/** Liste de choix exclusifs : une coche marque l'actif, pas de radio décorative. */
export function SettingsChoice<T extends string>({
    options,
    active,
    onSelect,
    ariaLabel,
}: ChoiceProps<T>) {
    return (
        <div role="radiogroup" aria-label={ariaLabel}>
            {options.map((opt) => {
                const isActive = opt.value === active;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => onSelect(opt.value)}
                        className="flex w-full items-center gap-3 border-b border-[var(--color-divider)] px-4 py-[15px] text-left last:border-b-0 active:bg-[var(--color-surface-alt)]"
                    >
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium tracking-[-0.1px] text-[var(--color-ink)]">
                                {opt.label}
                            </span>
                            {opt.hint && (
                                <span className="mt-0.5 block truncate text-[12px] text-[var(--color-ink-muted)]">
                                    {opt.hint}
                                </span>
                            )}
                        </span>
                        {isActive && (
                            <Check
                                className="h-[18px] w-[18px] shrink-0 text-[var(--color-brand)]"
                                strokeWidth={2.6}
                            />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/** Interrupteur : 44px de zone tactile, jamais moins (WCAG). */
export function SettingsSwitch({
    checked,
    onChange,
    ariaLabel,
    disabled,
}: {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onChange}
            className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-150 disabled:opacity-40 ${
                checked ? "bg-[var(--color-brand)]" : "bg-[var(--color-ink-soft)]"
            }`}
        >
            <span
                className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_0_rgba(20,24,29,0.2)] transition-transform duration-150 ${
                    checked ? "translate-x-[21px]" : "translate-x-[3px]"
                }`}
            />
        </button>
    );
}
