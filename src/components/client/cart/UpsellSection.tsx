"use client";

import { Plus } from "lucide-react";
import { Photo } from "../Photo";
import { Price } from "../Price";
import { getTranslatedContent } from "@/utils/translation";

export interface UpsellItem {
    id: string;
    name: string;
    name_en?: string;
    price: number;
    image_url?: string;
    category_name?: string;
}

interface Props {
    title: string;
    items: UpsellItem[];
    lang: "fr" | "en";
    onAdd: (item: UpsellItem) => void;
    addLabel: (name: string) => string;
}

/** Suggestions complémentaires : rail horizontal compact, jamais un écran entier. */
export function UpsellSection({ title, items, lang, onAdd, addLabel }: Props) {
    if (items.length === 0) return null;

    return (
        <section>
            <div className="mb-2.5 px-1 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                {title}
            </div>
            <div className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
                {items.map((item) => {
                    const name = getTranslatedContent(lang, item.name, item.name_en);
                    return (
                        <div
                            key={item.id}
                            className="w-[132px] shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-white"
                        >
                            <div className="relative h-[86px] w-full">
                                <Photo src={item.image_url ?? null} alt={name} kind="food" fill sizes="132px" />
                                <button
                                    type="button"
                                    onClick={() => onAdd(item)}
                                    aria-label={addLabel(name)}
                                    className="absolute bottom-1.5 right-1.5 flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white shadow-[0_4px_6px_-1px_rgba(20,24,29,0.08)] transition-transform duration-150 active:scale-95"
                                >
                                    <Plus className="h-4 w-4 text-[var(--color-ink)]" strokeWidth={2.6} />
                                </button>
                            </div>
                            <div className="px-2 pb-2 pt-1.5">
                                <div className="truncate text-[12.5px] font-semibold leading-[1.3] tracking-[-0.2px] text-[var(--color-ink)]">
                                    {name}
                                </div>
                                <div className="mt-1">
                                    <Price value={item.price} size={12.5} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
