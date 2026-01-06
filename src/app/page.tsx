"use client";
import {
  ChevronRight,
  Search,
  ShoppingCart
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { getSafeImageUrl } from "@/lib/imageUtils";

export const runtime = 'edge';

// CURATED CATEGORIES LIST (Clean & Fixed)
const CURATED_CATEGORIES = [
  { id: 'starters', fr: "Entrées", en: "Starters", icon: "🥗", dbTerm: "Entrée" },
  { id: 'burgers', fr: "Burgers", en: "Burgers", icon: "🍔", dbTerm: "Burger" },
  { id: 'african', fr: "Plats Africains", en: "African Dishes", icon: "🍲", dbTerm: "Chaudron" },
  { id: 'pizzas', fr: "Pizzas", en: "Pizzas", icon: "🍕", dbTerm: "Pizza" },
  { id: 'grills', fr: "Grillades", en: "Grills", icon: "🍖", dbTerm: "Grillade" },
  { id: 'desserts', fr: "Desserts", en: "Desserts", icon: "🍰", dbTerm: "Dessert" },
  { id: 'drinks', fr: "Boissons", en: "Drinks", icon: "🍹", dbTerm: "Boisson" },
  { id: 'appetizers', fr: "Apéritifs", en: "Appetizers", icon: "🥜", dbTerm: "Apéritif" },
];

// Map slugs to descriptions
const getDescriptionForRestaurant = (slug: string, lang: string) => {
  const descriptions: Record<string, { fr: string, en: string }> = {
    'room-service': { fr: "Room Service 24/7", en: "24/7 Room Service" },
    'pool-bar': { fr: "Cocktails & Grillades", en: "Cocktails & Grills" },
    'lobby-bar': { fr: "Lounge & Snacks", en: "Lounge & Snacks" },
    'panorama': { fr: "Restaurant Gastronomique", en: "Fine Dining Restaurant" },
    'tapas-bar': { fr: "Tapas & Finger Food", en: "Tapas & Finger Food" },
    'drinks': { fr: "Sélection de Boissons", en: "Drinks Selection" },
  };

  const key = Object.keys(descriptions).find(k => slug.includes(k));
  if (key) return descriptions[key][lang as 'fr' | 'en'] || descriptions[key]['fr'];
  return lang === 'fr' ? "Restaurant & Bar" : "Restaurant & Bar";
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();
  const { items, totalItems, totalPrice } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: restoData } = await supabase.from('restaurants').select('*');
      if (restoData) setRestaurants(restoData);

      // Deep Search Data
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select(`
          id, 
          name, 
          name_en, 
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
        `);

      if (itemsData) setMenuItems(itemsData);
    }
    fetchData();
  }, []);

  const handleCategoryClick = async (dbTerm: string) => {
    try {
      // Flexible search for category name containing the term
      const { data } = await supabase
        .from('categories')
        .select('name, restaurant_id, restaurants(slug)')
        .ilike('name', `%${dbTerm}%`)
        .limit(1)
        .maybeSingle();

      if (data && (data as any).restaurants?.slug) {
        const slug = (data as any).restaurants.slug;
        const realName = data.name; // Use the real DB name for the section param
        router.push(`/menu/${slug}?section=${encodeURIComponent(realName)}`);
      } else {
        // Fallback: Just trigger a search or toast? 
        // For now, let's just log or maybe set search query if no direct category found
        console.log("No category found for", dbTerm);
        setSearchQuery(dbTerm); // Fallback to search
      }
    } catch (err) {
      console.error("Error redirecting to category:", err);
    }
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [restaurants, searchQuery]);

  const deepSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const lowerQuery = searchQuery.toLowerCase();
    return menuItems.filter(item => {
      const itemName = (item.name || "").toLowerCase();
      const itemNameEn = (item.name_en || "").toLowerCase();
      return itemName.includes(lowerQuery) || itemNameEn.includes(lowerQuery);
    }).slice(0, 5);
  }, [menuItems, searchQuery]);

  return (
    <div className="flex-1 w-full bg-radisson-light pt-20 md:pt-24 lg:pt-28 h-auto pb-0">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. SEARCH BAR */}
        <div className="mt-4 mb-8 sticky top-16 md:top-20 z-40">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-radisson-blue transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </div>
            <input
              type="text"
              placeholder={language === 'fr' ? "Rechercher un plat, un menu..." : "Search for a dish, a menu..."}
              className="w-full bg-[#F9F9F9] border-none rounded-full py-4 pl-12 pr-6 text-sm font-medium focus:ring-0 focus:bg-white transition-all shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] outline-none placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {deepSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                <div className="p-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                    {language === 'fr' ? "Plats trouvés" : "Dishes found"}
                  </h3>
                  {deepSearchResults.map(item => {
                    const resto = item.categories?.restaurants;
                    const restoName = resto?.name || "Restaurant";
                    const restoSlug = resto?.slug || "";
                    return (
                      <Link
                        key={item.id}
                        href={`/menu/${restoSlug}?section=${encodeURIComponent(item.categories?.name || "")}`}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-radisson-blue group-hover:text-orange-500 transition-colors">
                            {language === 'en' && item.name_en ? item.name_en : item.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {restoName}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-500" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. WIDGET COMMANDES EN COURS */}
        {items.length > 0 && (
          <div className="mb-8 animate-fade-in-up">
            <Link href="/cart">
              <div className="bg-white border border-gray-100 rounded-3xl p-5 flex items-center gap-4 hover:shadow-soft transition-all group shadow-soft">
                <div className="w-12 h-12 bg-radisson-blue rounded-2xl flex items-center justify-center text-white">
                  <ShoppingCart size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-radisson-blue">{language === 'fr' ? "Commande en cours" : "Order in progress"}</h4>
                    <span className="bg-white px-3 py-0.5 rounded-full text-[10px] font-black text-radisson-gold border border-blue-100">EN PRÉPARATION</span>
                  </div>
                  <p className="text-xs text-blue-400 font-medium">
                    {totalItems} {totalItems > 1 ? t('items') : t('item')} • <span className="font-bold">{totalPrice.toLocaleString()} FCFA</span>
                  </p>
                </div>
                <ChevronRight className="text-blue-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        )}

        {/* 3. SECTION CATEGORIES - CURATED LIST */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {language === 'fr' ? "Recherche par Catégorie" : "Search by Category"}
            </h2>
            {/* View All button removed - Fixed list */}
          </div>

          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {CURATED_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="flex flex-col items-center justify-center p-3 bg-white rounded-[20px] aspect-square shadow-sm border border-gray-100 transition-all cursor-pointer group hover:bg-gray-50 duration-300"
                onClick={() => handleCategoryClick(cat.dbTerm)}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                  <span className="text-xl md:text-2xl filter drop-shadow-sm">{cat.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600 text-center line-clamp-1 leading-tight mt-1 group-hover:text-radisson-blue">
                  {language === 'en' ? cat.en : cat.fr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. CARTES RESTAURANTS */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
            {language === 'fr' ? "Nos Cartes & Restaurants" : "Our Menus & Restaurants"}
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 lg:gap-10 relative z-20">
            {filteredRestaurants.map((restaurant, index) => {
              const description = getDescriptionForRestaurant(restaurant.slug, language);
              const href = `/menu/${restaurant.slug}`;

              // Use reliable images
              const bgImage = getSafeImageUrl(restaurant.slug);

              return (
                <Link
                  key={restaurant.id}
                  href={href}
                  prefetch={true}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.98] animate-fade-in-up hover:border-gray-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="relative h-32 md:h-40 overflow-hidden bg-gray-100">
                    <img
                      src={bgImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="eager"
                    />
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex flex-col items-start relative flex-1">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 group-hover:text-[#002C5F] transition-colors line-clamp-1">
                      {restaurant.name}
                    </h3>

                    <p className="text-gray-500 text-[11px] leading-relaxed font-medium line-clamp-1 mb-3">
                      {description}
                    </p>

                    <div className="mt-auto w-full flex items-center justify-end">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#002C5F] transition-colors">
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-8 py-6 pb-24 border-t border-gray-50">
        <div className="text-center text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.4em] font-bold opacity-40">
          BLU TABLE • N&apos;Djamena
        </div>
      </footer>
    </div>
  );
}
