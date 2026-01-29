import { createClient } from "@/lib/supabase-server";
import HomeClient, { Restaurant, MenuItem, Announcement } from "@/components/menu/HomeClient";

// Nous forçons le rendu dynamique car les données (menus, annonces) changent souvent
// et dépendent potentiellement de la date du jour (annonces)
export const dynamic = 'force-dynamic';

export default async function Page() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // Récupération des données en parallèle pour optimiser le TTFB
  const [
    { data: restaurants },
    { data: categories },
    { data: menuItems },
    { data: announcements }
  ] = await Promise.all([
    // 1. Restaurants
    supabase
      .from('restaurants')
      .select('*'),

    // 2. Categories (avec relation restaurants pour les slugs)
    supabase
      .from('categories')
      .select(`
        id,
        name,
        name_en,
        restaurant_id,
        restaurants (
          slug,
          name
        )
      `)
      .order('display_order', { ascending: true }),

    // 3. Menu Items (avec relation categories -> restaurants pour le routage)
    supabase
      .from('menu_items')
      .select(`
        id, 
        name, 
        name_en,
        price,
        image_url,
        is_featured,
        category_id, 
        categories (
          id,
          name,
          restaurant_id,
          restaurants (
            slug,
            name
          )
        )
      `),

    // 4. Announcements (Bannière active)
    supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .eq('type', 'home_banner')
      .or(`start_date.is.null,start_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: false })
      .limit(1)
  ]);

  // Sélection de la première annonce valide (ou null)
  const activeAnnouncement = announcements && announcements.length > 0
    ? announcements[0]
    : null;

  return (
    <HomeClient
      initialRestaurants={(restaurants || []) as Restaurant[]}
      initialCategories={categories || []}
      initialMenuItems={(menuItems || []) as unknown as MenuItem[]}
      initialAnnouncement={activeAnnouncement as Announcement | null}
    />
  );
}
