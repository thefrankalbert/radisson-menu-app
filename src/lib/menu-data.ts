import "server-only";
import { supabasePublic, MENU_ITEM_COLUMNS } from "@/lib/supabase-public";
import type { MenuItem, Category, Restaurant } from "@/types/admin";

export interface MenuPayload {
    restaurant: Restaurant;
    categories: Category[];
    items: MenuItem[];
}

export interface HomePayload {
    restaurants: Restaurant[];
    categories: Category[];
    items: MenuItem[];
}

/**
 * Une requête en échec renvoie `data: null` sans lever. Sans ce log, un select
 * sur une colonne absente rendrait la page vide et sans le moindre message —
 * exactement le symptôme qui a coûté le plus cher à diagnostiquer ici.
 */
function warnOnError(label: string, error: { message: string } | null) {
    if (error) console.error(`[menu-data] échec du chargement ${label}:`, error.message);
}

/** Données de l'accueil : cartes, catégories et plats disponibles. */
export async function loadHomeData(): Promise<HomePayload> {
    const [restaurantsRes, categoriesRes, itemsRes] = await Promise.all([
        supabasePublic
            .from("restaurants")
            .select("id, name, name_en, slug, image_url, is_active, created_at")
            .order("created_at", { ascending: true }),
        supabasePublic
            .from("categories")
            .select("id, name, name_en, restaurant_id, display_order, created_at")
            .order("display_order", { ascending: true }),
        supabasePublic
            .from("menu_items")
            .select(MENU_ITEM_COLUMNS)
            .eq("is_available", true)
            .order("display_order", { ascending: true }),
    ]);

    warnOnError("restaurants", restaurantsRes.error);
    warnOnError("categories", categoriesRes.error);
    warnOnError("menu_items", itemsRes.error);

    return {
        restaurants: ((restaurantsRes.data ?? []) as Restaurant[]).filter(
            (r) => r.is_active !== false,
        ),
        categories: (categoriesRes.data ?? []) as Category[],
        items: (itemsRes.data ?? []) as unknown as MenuItem[],
    };
}

/**
 * Données d'une carte. Renvoie null si le slug n'existe pas ou si la carte est
 * désactivée, pour que la page réponde 404 plutôt qu'un écran vide.
 *
 * Les trois requêtes ne peuvent pas être parallélisées — il faut le restaurant
 * pour connaître ses catégories, puis les catégories pour ses plats — mais elles
 * partent maintenant du serveur, en une seule aller-retour côté convive, au lieu
 * de trois allers-retours enchaînés depuis le téléphone après hydratation.
 */
export async function loadMenuData(slug: string): Promise<MenuPayload | null> {
    const { data: restaurant, error: restaurantError } = await supabasePublic
        .from("restaurants")
        .select("id, name, name_en, slug, image_url, is_active, created_at")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

    warnOnError(`restaurant ${slug}`, restaurantError);
    if (!restaurant) return null;

    const { data: categories, error: categoriesError } = await supabasePublic
        .from("categories")
        .select("id, name, name_en, restaurant_id, display_order, created_at")
        .eq("restaurant_id", restaurant.id)
        .order("display_order", { ascending: true });

    warnOnError(`catégories ${slug}`, categoriesError);

    const categoryIds = (categories ?? []).map((c: Category) => c.id);
    if (categoryIds.length === 0) {
        return { restaurant: restaurant as Restaurant, categories: [], items: [] };
    }

    const { data: items, error: itemsError } = await supabasePublic
        .from("menu_items")
        .select(MENU_ITEM_COLUMNS)
        .in("category_id", categoryIds)
        .eq("is_available", true)
        .order("display_order", { ascending: true });

    warnOnError(`plats ${slug}`, itemsError);

    return {
        restaurant: restaurant as Restaurant,
        categories: (categories ?? []) as Category[],
        items: (items ?? []) as unknown as MenuItem[],
    };
}

/** Slugs des cartes actives — sert à pré-générer les pages carte au build. */
export async function loadActiveMenuSlugs(): Promise<string[]> {
    const { data, error } = await supabasePublic
        .from("restaurants")
        .select("slug")
        .eq("is_active", true);

    warnOnError("slugs des cartes", error);
    return (data ?? []).map((r: { slug: string }) => r.slug);
}
