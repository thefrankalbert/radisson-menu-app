"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, X, Utensils } from "lucide-react";
import { CategoryNav } from "./CategoryNav";
import { MenuItemCard, type ClientMenuItem } from "./MenuItemCard";
import { CardAddControl } from "./CardAddControl";
import ItemDetailSheet from "./ItemDetailSheet";
import { hasDietaryFlag } from "./dietary";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import type { MenuItem, Category } from "@/types/admin";

const COPY = {
    back: { fr: "Retour", en: "Go back" },
    search: { fr: "Rechercher dans la carte", en: "Search this menu" },
    clear: { fr: "Effacer la recherche", en: "Clear search" },
    empty: { fr: "Aucun plat disponible pour le moment.", en: "No dishes available right now." },
    noResults: { fr: "Aucun résultat", en: "No results" },
    menuOf: { fr: "Carte", en: "Menu" },
} as const;

const MIN_SEARCH_LENGTH = 2;

function normalize(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

interface Props {
    restaurantName: string;
    restaurantNameEn?: string;
    restaurantId: string;
    categories: Category[];
    items: MenuItem[];
    /** Catégorie à révéler à l'arrivée (ancre `#cat-<id>` ou `?section=`). */
    initialCategoryId?: string | null;
}

export function MenuScreen({
    restaurantName,
    restaurantNameEn,
    restaurantId,
    categories,
    items,
    initialCategoryId,
}: Props) {
    const router = useRouter();
    const { language } = useLanguage();
    const lang = language === "en" ? "en" : "fr";
    const en = lang === "en";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategoryId, setActiveCategoryId] = useState<string>("");

    const translate = useCallback(
        (item: MenuItem): ClientMenuItem => {
            const badges: ClientMenuItem["badges"] = [];
            if (hasDietaryFlag(item, "vegetarian")) {
                badges.push({ kind: "veg", label: en ? "Vegetarian" : "Végétarien" });
            }
            if (hasDietaryFlag(item, "spicy")) {
                badges.push({ kind: "spicy", label: en ? "Spicy" : "Épicé" });
            }
            return {
                id: item.id,
                categoryId: item.category_id,
                name: getTranslatedContent(lang, item.name, item.name_en),
                description: item.description
                    ? getTranslatedContent(lang, item.description, item.description_en)
                    : null,
                price: item.price,
                photoUrl: item.image_url ?? null,
                badges: badges.length > 0 ? badges : undefined,
                isAvailable: item.is_available,
            };
        },
        [lang, en],
    );

    // Une catégorie vide ne rend aucune section : lui donner une pastille mènerait
    // à une ancre inexistante (le titre change, la liste ne bouge pas).
    const sections = useMemo(
        () =>
            categories
                .map((c) => ({
                    id: c.id,
                    name: getTranslatedContent(lang, c.name, c.name_en),
                    items: items.filter((i) => i.category_id === c.id && i.is_available !== false),
                }))
                .filter((c) => c.items.length > 0),
        [categories, items, lang],
    );

    const searchResults = useMemo(() => {
        const q = normalize(searchQuery.trim());
        if (q.length < MIN_SEARCH_LENGTH) return [];
        return items.filter((it) => {
            const name = getTranslatedContent(lang, it.name, it.name_en);
            const desc = getTranslatedContent(lang, it.description ?? "", it.description_en);
            return normalize(name).includes(q) || normalize(desc).includes(q);
        });
    }, [searchQuery, items, lang]);

    const isSearching = searchQuery.trim().length >= MIN_SEARCH_LENGTH;

    // Arrivée via une ancre de catégorie : on attend que les sections soient
    // montées avant de faire défiler, sinon l'ancre n'existe pas encore.
    useEffect(() => {
        if (!initialCategoryId || sections.length === 0) return;
        const timer = setTimeout(() => {
            document.getElementById(`cat-${initialCategoryId}`)?.scrollIntoView({ block: "start" });
        }, 300);
        return () => clearTimeout(timer);
    }, [initialCategoryId, sections.length]);

    const addControlFor = (item: MenuItem, onOpen: () => void) => (
        <CardAddControl
            item={item}
            restaurantId={restaurantId}
            onOpen={onOpen}
            placement="corner"
            addLabel={en ? `Add ${item.name}` : `Ajouter ${item.name}`}
            decreaseLabel={en ? "Decrease quantity" : "Diminuer la quantité"}
            increaseLabel={en ? "Increase quantity" : "Augmenter la quantité"}
            removeLabel={en ? "Remove from cart" : "Retirer du panier"}
        />
    );

    // Les cartes s'appellent déjà « Carte Panorama Restaurant », « Carte des
    // Boissons »… : préfixer donnerait « Carte Carte Panorama ».
    const rawTitle = getTranslatedContent(lang, restaurantName, restaurantNameEn);
    const title = /^(carte|menu)\b/i.test(rawTitle.trim()) ? rawTitle : `${say("menuOf")} ${rawTitle}`;
    const activeSection = sections.find((c) => c.id === activeCategoryId) ?? sections[0];

    return (
        <div
            className="w-full flex-1 bg-white"
            style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
        >
            <div className="sticky top-0 z-40 border-b border-[var(--color-divider)] bg-white">
                <div className="flex items-center gap-2.5 px-[14px] py-3">
                    <button
                        type="button"
                        onClick={() => router.push("/")}
                        aria-label={say("back")}
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] transition-transform duration-150 active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-[var(--color-ink)]" />
                    </button>
                    <h1 className="min-w-0 flex-1 truncate text-[16px] font-semibold leading-[1.15] tracking-[-0.4px] text-[var(--color-ink)]">
                        {title}
                    </h1>
                    <button
                        type="button"
                        onClick={() => {
                            setShowSearch((v) => !v);
                            setSearchQuery("");
                        }}
                        aria-label={say("search")}
                        aria-expanded={showSearch}
                        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-95"
                    >
                        {showSearch ? (
                            <X className="h-5 w-5 text-[var(--color-ink)]" />
                        ) : (
                            <Search className="h-5 w-5 text-[var(--color-ink)]" />
                        )}
                    </button>
                </div>

                {showSearch && (
                    <div className="px-3 pb-2">
                        <div className="flex h-10 items-center gap-2.5 rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)] px-3">
                            <Search
                                className="h-[17px] w-[17px] shrink-0 text-[var(--color-ink-muted)]"
                                strokeWidth={2}
                            />
                            <input
                                autoFocus
                                type="text"
                                placeholder={say("search")}
                                aria-label={say("search")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                /* 16px : en dessous, iOS zoome sur le champ au focus. */
                                className="w-full flex-1 border-0 bg-transparent p-0 text-[16px] font-medium text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)] md:text-[14px]"
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
                    </div>
                )}
            </div>

            {isSearching ? (
                <div className="px-4 pt-3">
                    {searchResults.length > 0 ? (
                        searchResults.map((item) => (
                            <MenuItemCard
                                key={item.id}
                                item={translate(item)}
                                variant="list"
                                onOpen={() => setSelectedItem(item)}
                                addControl={addControlFor(item, () => setSelectedItem(item))}
                            />
                        ))
                    ) : (
                        <p className="py-20 text-center text-[14px] text-[var(--color-ink-muted)]">
                            {say("noResults")}
                        </p>
                    )}
                </div>
            ) : sections.length === 0 ? (
                <div className="px-4 py-24 text-center">
                    <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[var(--radius-modal)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                        <Utensils className="h-7 w-7 text-[var(--color-ink-soft)]" strokeWidth={1.6} />
                    </div>
                    <p className="text-[14px] font-medium text-[var(--color-ink-muted)]">{say("empty")}</p>
                </div>
            ) : (
                <>
                    <CategoryNav
                        categories={sections.map((c) => ({ id: c.id, name: c.name }))}
                        topOffset={63}
                        onActiveChange={setActiveCategoryId}
                    />

                    {/* Une seule barre de titre collante, synchronisée avec les
                        pastilles : des en-têtes par section se chevauchaient et
                        faisaient clignoter le titre suivant sur les courtes. */}
                    {activeSection && (
                        <div className="sticky top-[111px] z-20 border-b border-[var(--color-divider)] bg-white px-4 pb-[14px] pt-4">
                            <h2 className="text-[20px] font-bold leading-[1.4] tracking-[-0.6px] text-[var(--color-ink)]">
                                {activeSection.name}
                            </h2>
                        </div>
                    )}

                    {sections.map((section, index) => (
                        <section
                            key={section.id}
                            id={`cat-${section.id}`}
                            className={
                                // La dernière section reçoit une hauteur minimale pour pouvoir
                                // remonter sous la barre collante : sinon le défilement bute en
                                // bas et taper sa pastille ne bouge pas la liste.
                                index === sections.length - 1
                                    ? "scroll-mt-[170px] min-h-[calc(100dvh-169px)]"
                                    : "scroll-mt-[170px]"
                            }
                        >
                            <div className="px-4 pt-3">
                                {section.items.map((item) => (
                                    <MenuItemCard
                                        key={item.id}
                                        item={translate(item)}
                                        variant="list"
                                        onOpen={() => setSelectedItem(item)}
                                        addControl={addControlFor(item, () => setSelectedItem(item))}
                                    />
                                ))}
                            </div>
                            {index < sections.length - 1 && <div className="h-5 bg-white" />}
                        </section>
                    ))}
                </>
            )}

            <ItemDetailSheet
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                restaurantId={restaurantId}
                categoryName={activeSection?.name}
            />
        </div>
    );
}
