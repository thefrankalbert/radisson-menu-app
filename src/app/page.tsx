"use client";
// Build version: 1.0.5 - Major UI Overhaul: BLU TABLE branding & Fummo Style
import {
  Bed,
  Waves,
  Armchair,
  Sun,
  UtensilsCrossed,
  Wine,
  ChevronRight,
  Search,
  ShoppingCart,
  Filter
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";

export const runtime = 'edge';

// Map slugs or names to icons for restaurants
const getIconForRestaurant = (slug: string) => {
  if (slug.includes('room-service')) return Bed;
  if (slug.includes('pool-bar')) return Waves;
  if (slug.includes('lobby-bar')) return Armchair;
  if (slug.includes('panorama')) return Sun;
  if (slug.includes('tapas')) return UtensilsCrossed;
  if (slug.includes('boissons') || slug.includes('drinks')) return Wine;
  return UtensilsCrossed;
};

// Map category names to emojis (Fummo Style)
const getEmojiForCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pizza')) return "🍕";
  if (n.includes('burger') || n.includes('sandwich')) return "🍔";
  if (n.includes('poulet') || n.includes('chicken') || n.includes('aile')) return "🍗";
  if (n.includes('boisson') || n.includes('drink') || n.includes('cocktail')) return "🍹";
  if (n.includes('café') || n.includes('coffee') || n.includes('thé')) return "☕";
  if (n.includes('dessert') || n.includes('sucré') || n.includes('cake')) return "🍰";
  if (n.includes('glace') || n.includes('ice cream')) return "🍦";
  if (n.includes('entrée') || n.includes('starter')) return "🥗";
  if (n.includes('salade') || n.includes('salad')) return "🥗";
  if (n.includes('plat') || n.includes('main')) return "🍱";
  if (n.includes('alcool') || n.includes('vin') || n.includes('wine')) return "🍷";
  if (n.includes('pâte') || n.includes('pasta')) return "🍝";
  if (n.includes('snack') || n.includes('tapas')) return "🥨";
  return "🍽️";
};

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

// Map slugs to specific Unsplash keywords for context
const getImageKeywordsForRestaurant = (slug: string) => {
  if (slug.includes('pool')) return "pool,cocktail,resort,summer";
  if (slug.includes('lobby')) return "luxury lobby,hotel lounge,coffee";
  if (slug.includes('panorama') || slug.includes('roof')) return "rooftop dining,fine dining,view,sunset";
  if (slug.includes('room-service')) return "breakfast in bed,room service tray,hotel room";
  if (slug.includes('tapas')) return "tapas,finger food,sharing plate";
  if (slug.includes('drinks') || slug.includes('bar')) return "cocktail,bar,drink";
  return "restaurant,fine dining,plates";
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]); // New state for menu items
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, language } = useLanguage();
  const { items, totalItems, totalPrice } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: restoData } = await supabase.from('restaurants').select('*');
      if (restoData) setRestaurants(restoData);

      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('name, name_en')
        .order('name', { ascending: true });

      if (catData) {
        // Unique categories by name
        const uniqueCats = Array.from(new Set(catData.map((c: any) => c.name))).map(name => {
          return catData.find((c: any) => c.name === name);
        });
        setAllCategories(uniqueCats);
      }

      // Fetch all menu items for Deep Search
      const { data: itemsData } = await supabase
        .from('menu_items')
        // We need to join categories -> restaurants to build the link
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

  const handleCategoryClick = async (categoryName: string) => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('restaurant_id, restaurants(slug)')
        .eq('name', categoryName)
        .limit(1)
        .single();

      if (data && (data as any).restaurants?.slug) {
        const slug = (data as any).restaurants.slug;
        router.push(`/menu/${slug}?section=${encodeURIComponent(categoryName)}`);
      }
    } catch (err) {
      console.error("Error redirecting to category:", err);
    }
  };

  const visibleCategories = showAllCategories ? allCategories : allCategories.slice(0, 8);

  // Filter restaurants/menus based on search
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.slug.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [restaurants, searchQuery]);

  // Deep Search Results
  const deepSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const lowerQuery = searchQuery.toLowerCase();
    return menuItems.filter(item => {
      const itemName = (item.name || "").toLowerCase();
      const itemNameEn = (item.name_en || "").toLowerCase();
      return itemName.includes(lowerQuery) || itemNameEn.includes(lowerQuery);
    }).slice(0, 5); // Limit resultCount
  }, [menuItems, searchQuery]);

  return (
    <div className="flex-1 w-full bg-radisson-light pt-20 md:pt-24 lg:pt-28 h-auto">
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
            {/* Filter button removed for cleaner UI */}

            {/* DEEP SEARCH RESULTS DROPDOWN */}
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

        {/* 2. WIDGET "COMMANDES EN COURS" (Conditional) */}
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

        {/* 3. SECTION "SEARCH BY CATEGORY" */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {language === 'fr' ? "Recherche par Catégorie" : "Search by Category"}
            </h2>
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-xs font-bold text-orange-500 hover:underline transition-all"
            >
              {language === 'fr'
                ? (showAllCategories ? "Voir moins" : "Voir tout")
                : (showAllCategories ? "Show less" : "View All")}
            </button>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {visibleCategories.length > 0 ? visibleCategories.map((cat: any, idx: number) => {
              const emoji = getEmojiForCategory(cat.name);
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-3 bg-[#F8F9FA] rounded-[24px] aspect-square shadow-soft border border-gray-100 transition-all cursor-pointer group hover:bg-white hover:scale-[1.02] duration-300"
                  onClick={() => handleCategoryClick(cat.name)}
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mb-1 transition-transform group-hover:scale-110">
                    <span className="text-xl md:text-2xl filter drop-shadow-sm">{emoji}</span>
                  </div>
                  <span className="text-[11px] font-medium text-gray-600 text-center line-clamp-1 leading-tight mt-1 group-hover:text-radisson-blue">
                    {language === 'en' && cat.name_en ? cat.name_en : cat.name}
                  </span>
                </div>
              );
            }) : [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-2" />
                <div className="h-2 w-10 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 4. REFONTE DES CARTES MENUS */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
            {language === 'fr' ? "Nos Cartes & Restaurants" : "Our Menus & Restaurants"}
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 lg:gap-10 relative z-20">
            {filteredRestaurants.map((restaurant, index) => {
              const description = getDescriptionForRestaurant(restaurant.slug, language);
              const href = `/menu/${restaurant.slug}`;

              // Dynamically fetch images from Unsplash based on keywords
              const keywords = getImageKeywordsForRestaurant(restaurant.slug);
              // Use Unsplash Source for context-aware images
              const bgImage = `https://source.unsplash.com/800x600/?${keywords}`;

              return (
                <Link
                  key={restaurant.id}
                  href={href}
                  prefetch={true}
                  className="group bg-white rounded-[24px] shadow-soft border border-gray-100 transition-all duration-500 overflow-hidden flex flex-col active:scale-[0.98] animate-fade-in-up hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="relative h-32 md:h-40 overflow-hidden bg-gray-100">
                    <img
                      src={bgImage}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* No gradient overlay - Pure image */}
                  </div>

                  {/* Content Section (Compact & Clean) */}
                  <div className="p-4 flex flex-col items-start relative flex-1">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 group-hover:text-[#002C5F] transition-colors line-clamp-1">
                      {restaurant.name}
                    </h3>

                    <p className="text-gray-500 text-[11px] leading-relaxed font-medium line-clamp-1 mb-3">
                      {description}
                    </p>

                    <div className="mt-auto w-full flex items-center justify-end">
                      <div className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center group-hover:bg-[#002C5F] transition-colors">
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

function Plus({ size }: { size?: number }) {
  return (
    <svg width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
