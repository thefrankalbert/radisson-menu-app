import { createClient } from "@/lib/supabase-server";
import { HomeScreen } from "@/components/client/HomeScreen";
import { APP_CONFIG } from "@/lib/constants";
import type { MenuItem, Category, Restaurant } from "@/types/admin";

// ISR : la carte bouge peu, 60s gardent le TTFB bas sans servir du périmé.
export const revalidate = 60;

/** N'Djamena est en UTC+1 toute l'année — pas d'heure d'été à gérer. */
const VENUE_UTC_OFFSET_HOURS = 1;

/** Colonnes réellement présentes sur `menu_items` (cf. types/admin.ts).
 *  Nommer une colonne absente fait échouer la requête entière en 400. */
const MENU_ITEM_COLUMNS = `id, name, name_en, description, description_en, price, image_url,
    is_available, is_featured, is_popular, dietary_flags, preparation_time,
    category_id, restaurant_id, display_order, created_at,
    options:item_options(*),
    price_variants:item_price_variants(*)`;

export default async function Page() {
    const supabase = await createClient();

    const [restaurantsRes, categoriesRes, menuItemsRes] = await Promise.all([
        supabase
            .from("restaurants")
            .select("id, name, name_en, slug, image_url, is_active, created_at")
            .order("created_at", { ascending: true }),

        supabase
            .from("categories")
            .select("id, name, name_en, restaurant_id, display_order, created_at")
            .order("display_order", { ascending: true }),

        supabase
            .from("menu_items")
            .select(MENU_ITEM_COLUMNS)
            .eq("is_available", true)
            .order("display_order", { ascending: true }),
    ]);

    // Une requête en échec renvoie `data: null` sans lever : sans ce log, l'accueil
    // se rendrait vide et muet (c'est exactement ce qui est arrivé avec une colonne
    // inexistante dans le select).
    for (const [label, res] of [
        ["restaurants", restaurantsRes],
        ["categories", categoriesRes],
        ["menu_items", menuItemsRes],
    ] as const) {
        if (res.error) console.error(`[home] échec du chargement ${label}:`, res.error.message);
    }

    const activeRestaurants = ((restaurantsRes.data ?? []) as Restaurant[]).filter(
        (r) => r.is_active !== false,
    );

    // L'heure sert au message d'accueil : la calculer sur le serveur évite un
    // écart d'hydratation et reflète l'heure du lieu, pas celle de l'appareil.
    const venueHour = (new Date().getUTCHours() + VENUE_UTC_OFFSET_HOURS) % 24;

    return (
        <HomeScreen
            venueName={APP_CONFIG.hotel}
            restaurants={activeRestaurants}
            categories={(categoriesRes.data ?? []) as Category[]}
            items={(menuItemsRes.data ?? []) as unknown as MenuItem[]}
            hour={venueHour}
        />
    );
}
