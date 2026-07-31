"use client";

import Link from "next/link";
import { useMemo, useCallback } from "react";
import { HomeHeaderClient } from "./HomeHeaderClient";
import { HomeHero } from "./HomeHero";
import { HomeItemsSection } from "./HomeItemsSection";
import { SectionHeader } from "./SectionHeader";
import { CategoryTile, type ClientCategory } from "./CategoryTile";
import { deriveCategoryIconKey, getCategoryColors } from "./CategoryIcon";
import { Photo, hasRealPhoto } from "./Photo";
import { MenuItemCard, type ClientMenuItem } from "./MenuItemCard";
import { hasDietaryFlag } from "./dietary";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import type { MenuItem, Category, Restaurant } from "@/types/admin";

const COPY = {
    greetingMorning: { fr: "Bonjour", en: "Good morning" },
    greetingNoon: { fr: "Bon appétit", en: "Enjoy your meal" },
    greetingEvening: { fr: "Bonsoir", en: "Good evening" },
    subMorning: { fr: "Le petit-déjeuner vous attend", en: "Breakfast is waiting" },
    subNoon: { fr: "La carte du midi est ouverte", en: "The lunch menu is open" },
    subEvening: { fr: "La carte du soir est ouverte", en: "The dinner menu is open" },
    periodMorning: { fr: "Matin", en: "Morning" },
    periodNoon: { fr: "Midi", en: "Noon" },
    periodEvening: { fr: "Soir", en: "Evening" },
    categories: { fr: "Catégories", en: "Categories" },
    ourMenus: { fr: "Nos cartes", en: "Our menus" },
    ourMenusSub: { fr: "Restaurants et bars de l'hôtel", en: "Hotel restaurants and bars" },
    chefPicks: { fr: "Coups de cœur du chef", en: "Chef's picks" },
    chefPicksSub: { fr: "Sélectionnés pour vous", en: "Picked for you" },
    newItems: { fr: "Nouveautés", en: "New on the menu" },
    newItemsSub: { fr: "Les derniers ajouts à la carte", en: "The latest additions" },
    seeAll: { fr: "Voir tout", en: "See all" },
    featured: { fr: "Populaire", en: "Popular" },
    vegetarian: { fr: "Végétarien", en: "Vegetarian" },
    spicy: { fr: "Épicé", en: "Spicy" },
} as const;

const FEATURED_COUNT = 8;
const RECENT_COUNT = 6;
const CATEGORY_TILE_COUNT = 8;

interface Props {
    venueName: string;
    venueNameEn?: string;
    restaurants: Restaurant[];
    categories: Category[];
    items: MenuItem[];
    /** Heure locale calculée sur le serveur — évite un écart d'hydratation. */
    hour: number;
}

export function HomeScreen({
    venueName,
    venueNameEn,
    restaurants,
    categories,
    items,
    hour,
}: Props) {
    const { language } = useLanguage();
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    // Un plat appartient à une catégorie, qui appartient à une carte : c'est la
    // carte qui porte l'id restaurant attendu par le panier.
    const restaurantIdByCategory = useMemo(
        () => new Map(categories.map((c) => [c.id, c.restaurant_id])),
        [categories],
    );

    // `restaurant_id` est dénormalisé sur l'item ; la catégorie n'est qu'un repli
    // pour les lignes anciennes où il serait absent.
    const restaurantIdFor = useCallback(
        (item: MenuItem) =>
            item.restaurant_id ?? restaurantIdByCategory.get(item.category_id) ?? "",
        [restaurantIdByCategory],
    );

    const toClientItem = useCallback(
        (item: MenuItem): ClientMenuItem => {
            const badges: ClientMenuItem["badges"] = [];
            if (item.is_featured || item.is_popular) {
                badges.push({ kind: "popular", label: say("featured") });
            }
            if (hasDietaryFlag(item, "vegetarian")) {
                badges.push({ kind: "veg", label: say("vegetarian") });
            }
            if (hasDietaryFlag(item, "spicy")) {
                badges.push({ kind: "spicy", label: say("spicy") });
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
        // `say` est recalculé à chaque rendu mais ne dépend que de `lang`.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [lang],
    );

    const available = useMemo(() => items.filter((i) => i.is_available !== false), [items]);

    // Aucun plat n'est marqué en base aujourd'hui : sans repli, le héros et la
    // section « coups de cœur » resteraient vides en production. On préfère les
    // plats mis en avant, puis les populaires, puis ceux qui ont une photo — une
    // carte sans image ne mérite pas la vitrine.
    const featuredFull = useMemo(() => {
        const flagged = available.filter((i) => i.is_featured || i.is_popular);
        if (flagged.length > 0) return flagged.slice(0, FEATURED_COUNT);
        const withPhoto = available.filter((i) => hasRealPhoto(i.image_url));
        return (withPhoto.length > 0 ? withPhoto : available).slice(0, FEATURED_COUNT);
    }, [available]);
    const recentFull = useMemo(
        () =>
            [...available]
                .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
                .filter((i) => !featuredFull.some((f) => f.id === i.id))
                .slice(0, RECENT_COUNT),
        [available, featuredFull],
    );

    const featuredClients = useMemo(() => featuredFull.map(toClientItem), [featuredFull, toClientItem]);
    const recentClients = useMemo(() => recentFull.map(toClientItem), [recentFull, toClientItem]);

    const heroSource = featuredFull[0] ?? recentFull[0] ?? null;

    const clientCategories: ClientCategory[] = useMemo(() => {
        // Une catégorie sans plat disponible n'a rien à montrer — on la masque
        // plutôt que d'offrir une tuile qui mène à une liste vide.
        const withItems = new Set(available.map((i) => i.category_id));

        // Plusieurs cartes ont des catégories au libellé identique (« Entrées »
        // au Panorama et au Pool deviennent deux fois « Starters »). Deux tuiles
        // visuellement jumelles n'aident personne : on n'en garde qu'une, la
        // première dans l'ordre d'affichage.
        const seenLabels = new Set<string>();

        return categories
            .filter((c) => withItems.has(c.id))
            .filter((c) => {
                const key = getTranslatedContent(lang, c.name, c.name_en).trim().toLowerCase();
                if (seenLabels.has(key)) return false;
                seenLabels.add(key);
                return true;
            })
            .slice(0, CATEGORY_TILE_COUNT)
            .map((c) => {
                const label = getTranslatedContent(lang, c.name, c.name_en);
                const iconKey = deriveCategoryIconKey(c.name);
                const colors = getCategoryColors(iconKey);
                return {
                    id: c.id,
                    label,
                    icon: iconKey,
                    bgColor: colors.bg,
                    fgColor: colors.fg,
                    coverUrl: null,
                };
            });
    }, [categories, available, lang]);

    const slugByRestaurantId = useMemo(
        () => new Map(restaurants.map((r) => [r.id, r.slug])),
        [restaurants],
    );

    const rawCategoryName = useMemo(
        () => new Map(categories.map((c) => [c.id, c.name])),
        [categories],
    );

    // `?section=` porte le nom de la catégorie : la carte fait défiler jusqu'à
    // elle une fois les sections montées. Une ancre `#cat-id` ne marcherait pas,
    // l'élément n'existant pas encore au moment de la navigation.
    const categoryHref = useCallback(
        (categoryId: string, categoryName: string) => {
            const restaurantId = restaurantIdByCategory.get(categoryId);
            const slug = restaurantId ? slugByRestaurantId.get(restaurantId) : undefined;
            return slug ? `/menu/${slug}?section=${encodeURIComponent(categoryName)}` : "/";
        },
        [restaurantIdByCategory, slugByRestaurantId],
    );

    const period = hour < 11 ? "morning" : hour < 17 ? "noon" : "evening";
    const greeting =
        period === "morning" ? say("greetingMorning") : period === "noon" ? say("greetingNoon") : say("greetingEvening");
    const greetingSub =
        period === "morning" ? say("subMorning") : period === "noon" ? say("subNoon") : say("subEvening");
    const periodLabel =
        period === "morning" ? say("periodMorning") : period === "noon" ? say("periodNoon") : say("periodEvening");

    const firstMenuHref = restaurants[0] ? `/menu/${restaurants[0].slug}` : "/";

    return (
        <div className="pb-20">
            <HomeHeaderClient
                venueName={venueName}
                venueNameEn={venueNameEn}
                allItems={available}
                popularItems={featuredClients}
                restaurantIdFor={restaurantIdFor}
                toClientItem={toClientItem}
            />

            <div className="px-4 pb-6">
                {heroSource ? (
                    <HomeHero
                        item={heroSource}
                        name={getTranslatedContent(lang, heroSource.name, heroSource.name_en)}
                        photoUrl={heroSource.image_url ?? null}
                        restaurantId={restaurantIdFor(heroSource)}
                    />
                ) : (
                    <div className="relative h-[232px] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-ink)] p-[20px]">
                        <div
                            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-20 blur-[20px]"
                            style={{ backgroundColor: "var(--color-brand)" }}
                        />
                        <div className="relative">
                            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.6px] text-[var(--color-rating)]">
                                {periodLabel} &middot; {hour}H
                            </div>
                            <div className="mt-2 text-[26px] font-semibold leading-[1.1] tracking-[-0.04em] text-white">
                                {greeting}.<br />
                                <span className="opacity-55">{greetingSub}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {clientCategories.length > 0 && (
                <section>
                    <SectionHeader
                        title={say("categories")}
                        seeAllHref={firstMenuHref}
                        seeAllLabel={say("seeAll")}
                    />
                    <div className="grid grid-cols-3 gap-2.5 px-4 min-[380px]:grid-cols-4">
                        {clientCategories.map((cat) => (
                            <CategoryTile
                                key={cat.id}
                                category={cat}
                                // Le nom brut (français) est la clé côté carte, pas le libellé traduit.
                                href={categoryHref(cat.id, rawCategoryName.get(cat.id) ?? cat.label)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {restaurants.length > 0 && (
                <section>
                    <SectionHeader title={say("ourMenus")} subtitle={say("ourMenusSub")} />
                    <div className="grid grid-cols-2 gap-2.5 px-4">
                        {restaurants.map((r) => {
                            const name = getTranslatedContent(lang, r.name, r.name_en);
                            const withPhoto = hasRealPhoto(r.image_url);
                            return (
                                <Link
                                    key={r.id}
                                    href={`/menu/${r.slug}`}
                                    // Fond encre systématique : le nom reste lisible en blanc, que la
                                    // photo existe, manque, ou échoue au chargement.
                                    className="relative h-[116px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)] bg-[var(--color-ink)]"
                                >
                                    {withPhoto && (
                                        <div className="absolute inset-0">
                                            <Photo
                                                src={r.image_url}
                                                alt={name}
                                                kind="food"
                                                fill
                                                sizes="50vw"
                                                fallback={null}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[30%] to-black/[0.78]" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                        <div className="mt-0.5 text-[14px] font-semibold leading-snug tracking-[-0.02em]">
                                            {name}
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {featuredClients.length > 0 && (
                <section>
                    <SectionHeader
                        title={say("chefPicks")}
                        subtitle={say("chefPicksSub")}
                        seeAllHref={firstMenuHref}
                        seeAllLabel={say("seeAll")}
                    />
                    <HomeItemsSection
                        display={featuredClients}
                        full={featuredFull}
                        variant="featured"
                        containerClassName="scrollbar-hide flex gap-3.5 overflow-x-auto px-4 pb-2"
                        restaurantIdFor={restaurantIdFor}
                    />
                </section>
            )}

            {recentClients.length > 0 && (
                <section>
                    <SectionHeader title={say("newItems")} subtitle={say("newItemsSub")} />
                    <HomeItemsSection
                        display={recentClients}
                        full={recentFull}
                        variant="list"
                        containerClassName="px-4"
                        restaurantIdFor={restaurantIdFor}
                    />
                </section>
            )}
        </div>
    );
}

/** Réexporté pour la carte : même conversion, même rendu. */
export { MenuItemCard };
