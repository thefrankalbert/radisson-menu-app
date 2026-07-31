import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase de lecture publique, sans cookies.
 *
 * `supabase-server.ts` passe par `cookies()` pour porter la session admin, ce
 * qui force Next à rendre dynamiquement TOUTE page qui l'utilise : l'accueil et
 * les cartes repartaient donc en rendu serveur complet à chaque visite, avec
 * leurs requêtes, pour des données identiques pour tout le monde.
 *
 * La carte est publique et anonyme : ce client-ci n'a pas de session à lire,
 * les pages restent donc mises en cache et régénérées à intervalle fixe.
 */
export const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "x-client-info": "blutable-public-read" } },
    },
);

/** Colonnes réellement présentes sur `menu_items` (cf. types/admin.ts).
 *  Nommer une colonne absente fait échouer la requête entière en 400, et
 *  supabase-js met alors `data` à null sans lever : écran vide et muet. */
export const MENU_ITEM_COLUMNS = `id, name, name_en, description, description_en, price, image_url,
    is_available, is_featured, is_popular, dietary_flags, preparation_time,
    category_id, restaurant_id, display_order, created_at,
    options:item_options(*),
    price_variants:item_price_variants(*)`;
