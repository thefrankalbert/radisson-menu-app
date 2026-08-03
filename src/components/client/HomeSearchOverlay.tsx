"use client";

import type { Dispatch, SetStateAction } from "react";
import { Search, X, Clock } from "lucide-react";
import { MenuItemCard, type ClientMenuItem } from "./MenuItemCard";
import { CardAddControl } from "./CardAddControl";
import type { MenuItem } from "@/types/admin";

const COPY = {
    placeholder: { fr: "Rechercher un plat, une boisson…", en: "Search a dish or a drink…" },
    clear: { fr: "Effacer la recherche", en: "Clear search" },
    close: { fr: "Annuler", en: "Cancel" },
    recent: { fr: "Recherches récentes", en: "Recent searches" },
    popular: { fr: "Les plus commandés", en: "Most ordered" },
    noResults: { fr: "Aucun résultat", en: "No results" },
    noneHint: {
        fr: "Essayez un autre mot, ou parcourez la carte.",
        en: "Try another word, or browse the menu.",
    },
} as const;

interface Props {
    lang: "fr" | "en";
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    closeSearch: () => void;
    recent: string[];
    popularItems: ClientMenuItem[];
    searchResults: ClientMenuItem[];
    fullById: Map<string, MenuItem>;
    openDetail: (id: string) => void;
    pushRecent: (term: string) => void;
    restaurantIdFor: (item: MenuItem) => string;
}

export function HomeSearchOverlay({
    lang,
    searchQuery,
    setSearchQuery,
    closeSearch,
    recent,
    popularItems,
    searchResults,
    fullById,
    openDetail,
    pushRecent,
    restaurantIdFor,
}: Props) {
    const say = (k: keyof typeof COPY) => COPY[k][lang];
    const en = lang === "en";

    const renderCard = (item: ClientMenuItem, onOpen: () => void) => {
        const full = fullById.get(item.id);
        return (
            <MenuItemCard
                key={item.id}
                item={item}
                variant="list"
                onOpen={onOpen}
                addControl={
                    full ? (
                        <CardAddControl
                            item={full}
                            restaurantId={restaurantIdFor(full)}
                            onOpen={onOpen}
                            placement="corner"
                            addLabel={en ? `Add ${item.name}` : `Ajouter ${item.name}`}
                            decreaseLabel={en ? "Decrease quantity" : "Diminuer la quantité"}
                            increaseLabel={en ? "Increase quantity" : "Augmenter la quantité"}
                            removeLabel={en ? "Remove from cart" : "Retirer du panier"}
                        />
                    ) : undefined
                }
            />
        );
    };

    return (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-lg flex-col bg-white">
            <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--color-divider)] px-3.5 py-3">
                <div className="flex h-10 flex-1 items-center gap-2.5 rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)] px-3">
                    <Search
                        className="h-[17px] w-[17px] shrink-0 text-[var(--color-ink-muted)]"
                        strokeWidth={2}
                    />
                    <input
                        autoFocus
                        type="text"
                        placeholder={say("placeholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label={say("placeholder")}
                        /* 16px sur mobile : en dessous, iOS zoome sur le champ au focus. */
                        className="w-full flex-1 border-none bg-transparent p-0 text-[16px] font-medium tracking-[-0.1px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)] md:text-[14px]"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            aria-label={say("clear")}
                            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)]"
                        >
                            <X className="h-[11px] w-[11px] text-white" strokeWidth={2.6} />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={closeSearch}
                    className="shrink-0 px-1 text-[13.5px] font-medium text-[var(--color-ink-2)]"
                >
                    {say("close")}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-10 pt-[18px]">
                {!searchQuery.trim() ? (
                    <>
                        {recent.length > 0 && (
                            <div className="mb-6">
                                <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                                    {say("recent")}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {recent.map((r) => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => setSearchQuery(r)}
                                            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--color-divider)] bg-white px-[13px] py-2 text-[13px] font-medium tracking-[-0.1px] text-[var(--color-ink-2)]"
                                        >
                                            <Clock className="h-[13px] w-[13px] text-[var(--color-ink-soft)]" />
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {popularItems.length > 0 && (
                            <div>
                                <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.5px] text-[var(--color-ink-muted)]">
                                    {say("popular")}
                                </div>
                                <div>{popularItems.map((item) => renderCard(item, () => openDetail(item.id)))}</div>
                            </div>
                        )}
                    </>
                ) : searchResults.length > 0 ? (
                    <>
                        <div className="mb-1 text-[12.5px] font-medium text-[var(--color-ink-muted)]">
                            {searchResults.length}{" "}
                            {en
                                ? `result${searchResults.length > 1 ? "s" : ""} for “${searchQuery.trim()}”`
                                : `résultat${searchResults.length > 1 ? "s" : ""} pour « ${searchQuery.trim()} »`}
                        </div>
                        <div>
                            {searchResults.map((item) =>
                                renderCard(item, () => {
                                    pushRecent(searchQuery);
                                    openDetail(item.id);
                                }),
                            )}
                        </div>
                    </>
                ) : (
                    <div className="pt-[60px] text-center">
                        <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[var(--radius-modal)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                            <Search className="h-7 w-7 text-[var(--color-ink-soft)]" strokeWidth={1.6} />
                        </div>
                        <div className="text-[16px] font-semibold tracking-[-0.3px] text-[var(--color-ink)]">
                            {say("noResults")}
                        </div>
                        <div className="mt-1.5 text-[13px] text-[var(--color-ink-muted)]">{say("noneHint")}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
