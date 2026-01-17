"use client";
import {
  ChevronRight,
  Search,
  ShoppingCart,
  Utensils,
  GlassWater
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import Header from "@/components/Header";
import { detectSpaceFromURL, type SpaceType } from "@/utils/tableUtils";
// IMPORTS LOCAL REMOVED TO PREVENT MODULE ERRORS
// import { getSafeImageUrl } from "@/lib/imageUtils";
// import { getTranslatedContent } from "@/utils/translation";

// --- INLINED UTILS FOR STABILITY ---

// 1. Translation Helper
const getTranslatedContent = (
  lang: string,
  frContent: string,
  enContent?: string | null
): string => {
  if (lang === 'en' && enContent && enContent.trim().length > 0) {
    return enContent;
  }
  return frContent || "";
};

// 2. Safe Image Helper
const SAFE_IMAGES: Record<string, string> = {
  pool: "https://images.unsplash.com/photo-1572331165267-854da2b00ca1?q=80&w=800&auto=format&fit=crop",
  lobby: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?q=80&w=800&auto=format&fit=crop",
  room: "https://images.unsplash.com/photo-1629891465228-442d87e0743b?q=80&w=800&auto=format&fit=crop",
  panorama: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
  tapas: "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=800&auto=format&fit=crop",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
  pizza: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
  drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=800&auto=format&fit=crop",
  dessert: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800&auto=format&fit=crop",
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
  chicken: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
  meat: "https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?q=80&w=800&auto=format&fit=crop",
  pasta: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=800&auto=format&fit=crop",
  african: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop"
};

const getSafeImageUrl = (query: string): string => {
  if (!query) return SAFE_IMAGES.default;
  const lower = query.toLowerCase();

  // Restaurants
  if (lower.includes('pool')) return SAFE_IMAGES.pool;
  if (lower.includes('lobby')) return SAFE_IMAGES.lobby;
  if (lower.includes('room') || lower.includes('service')) return SAFE_IMAGES.room;
  if (lower.includes('panorama') || lower.includes('toit') || lower.includes('roof')) return SAFE_IMAGES.panorama;
  if (lower.includes('tapas')) return SAFE_IMAGES.tapas;

  // Dishes
  if (lower.includes('burger')) return SAFE_IMAGES.burger;
  if (lower.includes('pizza')) return SAFE_IMAGES.pizza;
  if (lower.includes('salad') || lower.includes('salade')) return SAFE_IMAGES.salad;
  if (lower.includes('drink') || lower.includes('boisson') || lower.includes('cocktail') || lower.includes('vin') || lower.includes('wine')) return SAFE_IMAGES.drink;
  if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sucre') || lower.includes('gateau')) return SAFE_IMAGES.dessert;
  if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('thé')) return SAFE_IMAGES.coffee;
  if (lower.includes('chicken') || lower.includes('poulet')) return SAFE_IMAGES.chicken;
  if (lower.includes('steak') || lower.includes('viande') || lower.includes('meat') || lower.includes('boeuf')) return SAFE_IMAGES.meat;
  if (lower.includes('pasta') || lower.includes('pate') || lower.includes('spaghetti')) return SAFE_IMAGES.pasta;
  if (lower.includes('ndole') || lower.includes('yassa') || lower.includes('mafe') || lower.includes('local')) return SAFE_IMAGES.african;

  return SAFE_IMAGES.default;
};

// --- END INLINED UTILS ---

// TypeScript Interfaces
interface Restaurant {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  [key: string]: unknown;
}

interface MenuItemCategory {
  id: string;
  name: string;
  restaurant_id: string;
  restaurants?: {
    slug: string;
    name: string;
  } | {
    slug: string;
    name: string;
  }[];
}

interface MenuItem {
  id: string;
  name: string;
  name_en?: string | null;
  price?: number;
  category_id: string;
  categories?: MenuItemCategory | MenuItemCategory[];
}

interface CategoryData {
  name: string;
  restaurant_id: string;
  restaurants?: {
    slug: string;
  } | {
    slug: string;
  }[] | null;
}

// Helper function to safely extract category data
const getCategoryData = (categories: MenuItemCategory | MenuItemCategory[] | undefined) => {
  if (!categories) return null;
  const category = Array.isArray(categories) ? categories[0] : categories;
  const restaurants = category.restaurants;
  const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants;
  return {
    name: category.name,
    restaurant: restaurant
  };
}

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

// Map slugs to descriptions and display names
const getRestaurantInfo = (slug: string, lang: string): { name: string, description: string } => {
  const slugLower = slug.toLowerCase();
  
  if (slugLower.includes('panorama')) {
    return {
      name: lang === 'fr' ? 'Panorama Restaurant' : 'Panorama Restaurant',
      description: lang === 'fr' ? 'Restaurant Gastronomique & Tapas' : 'Fine Dining Restaurant & Tapas'
    };
  }
  
  if (slugLower.includes('lobby-bar') || slugLower.includes('lobbybar')) {
    return {
      name: lang === 'fr' ? 'Lobby Bar' : 'Lobby Bar',
      description: lang === 'fr' ? 'Lounge & Snacks + Pool' : 'Lounge & Snacks + Pool'
    };
  }
  
  if (slugLower.includes('carte-des-boissons') || slugLower.includes('boissons')) {
    return {
      name: lang === 'fr' ? 'Carte des Boissons' : 'Drinks Menu',
      description: lang === 'fr' ? 'Lounge & Snacks + Pool Bar' : 'Lounge & Snacks + Pool Bar'
    };
  }
  
  return {
    name: lang === 'fr' ? 'Restaurant' : 'Restaurant',
    description: lang === 'fr' ? 'Restaurant & Bar' : 'Restaurant & Bar'
  };
};

// Filter restaurants based on QR code space parameter
const getFilteredRestaurants = (restaurants: Restaurant[], space: SpaceType): Restaurant[] => {
  let allowedSlugs: string[] = [];
  
  // Selon l'espace détecté, afficher uniquement les restaurants pertinents
  if (space === 'panorama') {
    // QR Panorama : Panorama + Carte des Boissons uniquement
    allowedSlugs = ['panorama', 'carte-des-boissons'];
  } else if (space === 'lobby-bar') {
    // QR Lobby Bar : Lobby Bar + Carte des Boissons uniquement
    allowedSlugs = ['lobby-bar', 'carte-des-boissons'];
  } else {
    // Par défaut (pas de QR) : tous les 3
    allowedSlugs = ['panorama', 'lobby-bar', 'carte-des-boissons'];
  }
  
  return restaurants.filter(r => {
    const slug = (r.slug || "").toLowerCase();
    return allowedSlugs.some(allowed => slug.includes(allowed));
  }).sort((a, b) => {
    // Order: Panorama/Lobby Bar en premier, puis Carte des Boissons
    const order = space === 'panorama' 
      ? ['panorama', 'carte-des-boissons']
      : space === 'lobby-bar'
      ? ['lobby-bar', 'carte-des-boissons']
      : ['panorama', 'lobby-bar', 'carte-des-boissons'];
    const aIndex = order.findIndex(o => a.slug.toLowerCase().includes(o));
    const bIndex = order.findIndex(o => b.slug.toLowerCase().includes(o));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
};

interface OrderHistoryItem {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  tableNumber: string;
  status: string;
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const { t, language } = useLanguage();
  const { items, totalItems, totalPrice } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Détecter l'espace depuis l'URL (QR code)
  const space = detectSpaceFromURL();

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        // Fetch Restaurants
        const { data: restoData, error: restoError } = await supabase
          .from('restaurants')
          .select('*');

        if (restoError) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Error fetching restaurants:", restoError);
          }
        } else if (restoData && isMounted) {
          setRestaurants(restoData as Restaurant[]);
        }

        // Deep Search Data
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select(`
            id, 
            name, 
            name_en,
            price,
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

        if (itemsError) {
          if (process.env.NODE_ENV === 'development') {
            console.error("Error fetching menu items:", itemsError);
          }
        } else if (itemsData && isMounted) {
          setMenuItems(itemsData as unknown as MenuItem[]);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Unexpected error fetching data:", error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load order history
  useEffect(() => {
    const savedHistory = localStorage.getItem('order_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setOrderHistory(history.slice(0, 4)); // Limiter à 4 commandes récentes
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const handleCategoryClick = async (dbTerm: string) => {
    try {
      // Déterminer les restaurants autorisés selon l'espace (QR code)
      let allowedRestaurantSlugs: string[] = [];
      if (space === 'panorama') {
        allowedRestaurantSlugs = ['panorama', 'carte-des-boissons'];
      } else if (space === 'lobby-bar') {
        allowedRestaurantSlugs = ['lobby-bar', 'carte-des-boissons'];
      }
      
      // Flexible search for category name containing the term
      const { data, error } = await supabase
        .from('categories')
        .select('name, restaurant_id, restaurants(slug)')
        .ilike('name', `%${dbTerm}%`)
        .limit(space !== 'default' ? 10 : 1); // Récupérer plus de résultats si filtrage nécessaire

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching category:", error);
        }
        setSearchQuery(dbTerm); // Fallback to search
        return;
      }

      if (data) {
        // Si un espace est détecté, filtrer les résultats
        let filteredData = data;
        if (space !== 'default' && allowedRestaurantSlugs.length > 0) {
          filteredData = data.filter((cat: any) => {
            const restaurants = cat.restaurants;
            const slug = Array.isArray(restaurants) 
              ? restaurants[0]?.slug 
              : restaurants?.slug;
            if (!slug) return false;
            const slugLower = slug.toLowerCase();
            return allowedRestaurantSlugs.some(allowed => slugLower.includes(allowed));
          });
        }
        
        if (filteredData.length > 0) {
          const categoryData = filteredData[0] as unknown as CategoryData;
          const restaurants = categoryData.restaurants;
          const slug = Array.isArray(restaurants) 
            ? restaurants[0]?.slug 
            : restaurants?.slug;
          const realName = categoryData.name;
          if (slug) {
            // Préserver le paramètre space si présent
            const spaceParam = space !== 'default' ? `&space=${space}` : '';
            router.push(`/menu/${slug}?section=${encodeURIComponent(realName)}${spaceParam}`);
          } else {
            setSearchQuery(dbTerm); // Fallback to search
          }
        } else {
          // Aucune catégorie trouvée dans les restaurants autorisés
          setSearchQuery(dbTerm); // Fallback to search
        }
      } else {
        setSearchQuery(dbTerm); // Fallback to search
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error redirecting to category:", err);
      }
      setSearchQuery(dbTerm); // Fallback to search
    }
  };

  // Filtrer les restaurants selon le QR code ET la recherche
  const filteredRestaurants = useMemo(() => {
    // D'abord filtrer selon l'espace (QR code)
    const spaceFiltered = getFilteredRestaurants(restaurants, space);
    
    // Ensuite filtrer selon la recherche si nécessaire
    if (!searchQuery.trim()) return spaceFiltered;
    
    const lowerQuery = searchQuery.toLowerCase();
    return spaceFiltered.filter(r => {
      const name = r.name?.toLowerCase() || "";
      const slug = r.slug?.toLowerCase() || "";
      return name.includes(lowerQuery) || slug.includes(lowerQuery);
    });
  }, [restaurants, searchQuery, space]);

  // Filtrer les featured items selon l'espace détecté (QR code)
  const featuredItems = useMemo(() => {
    if (space === 'default') return menuItems;
    
    const allowedSlugs = space === 'panorama' 
      ? ['panorama', 'carte-des-boissons']
      : ['lobby-bar', 'carte-des-boissons'];
    
    return menuItems.filter(item => {
      const categoryData = getCategoryData(item.categories);
      const resto = categoryData?.restaurant;
      const restoSlug = Array.isArray(resto) ? resto[0]?.slug : resto?.slug;
      if (!restoSlug) return false;
      const slugLower = restoSlug.toLowerCase();
      return allowedSlugs.some(allowed => slugLower.includes(allowed));
    });
  }, [menuItems, space]);

  const deepSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const lowerQuery = searchQuery.toLowerCase();
    
    // Filtrer les items selon l'espace détecté (QR code)
    let filteredItems = menuItems;
    if (space !== 'default') {
      const allowedSlugs = space === 'panorama' 
        ? ['panorama', 'carte-des-boissons']
        : ['lobby-bar', 'carte-des-boissons'];
      
      filteredItems = menuItems.filter(item => {
        const categoryData = getCategoryData(item.categories);
        const resto = categoryData?.restaurant;
        const restoSlug = Array.isArray(resto) ? resto[0]?.slug : resto?.slug;
        if (!restoSlug) return false;
        const slugLower = restoSlug.toLowerCase();
        return allowedSlugs.some(allowed => slugLower.includes(allowed));
      });
    }
    
    return filteredItems.filter(item => {
      const itemName = (item.name || "").toLowerCase();
      const itemNameEn = (item.name_en || "").toLowerCase();
      return itemName.includes(lowerQuery) || itemNameEn.includes(lowerQuery);
    }).slice(0, 5);
  }, [menuItems, searchQuery, space]);

  // Helper pour générer les liens avec le paramètre space préservé
  const getMenuLink = (slug: string, additionalParams: string = '') => {
    const spaceParam = space !== 'default' 
      ? (additionalParams ? `&space=${space}` : `?space=${space}`)
      : '';
    return `/menu/${slug}${additionalParams}${spaceParam}`;
  };

  return (
    <div className="flex-1 w-full bg-radisson-light pt-20 md:pt-24 lg:pt-28 h-auto pb-0">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. SEARCH BAR */}
        <div className="mt-4 mb-8 sticky top-16 md:top-20 z-40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (deepSearchResults.length > 0) {
                const item = deepSearchResults[0];
                const categoryData = getCategoryData(item.categories);
                const slug = categoryData?.restaurant?.slug;
                const categoryName = categoryData?.name;
                
                if (slug && categoryName) {
                  // Préserver le paramètre space si présent
                  const spaceParam = space !== 'default' ? `&space=${space}` : '';
                  router.push(`/menu/${slug}?section=${encodeURIComponent(categoryName)}${spaceParam}`);
                }
              }
            }}
            className="relative group"
          >
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-radisson-blue transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </div>
            <input
              type="text"
              placeholder={language === 'fr' ? "Rechercher un plat, un menu..." : "Search for a dish, a menu..."}
              className="w-full bg-white border border-gray-300 rounded-full py-3 pl-12 pr-6 text-sm font-medium focus:ring-2 focus:ring-radisson-blue/20 focus:border-radisson-blue transition-all shadow-md outline-none placeholder:text-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {deepSearchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden z-50 animate-fade-in-up">
                <div className="p-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">
                    {language === 'fr' ? "Plats trouvés" : "Dishes found"}
                  </h3>
                  {deepSearchResults.map(item => {
                    const categoryData = getCategoryData(item.categories);
                    const resto = categoryData?.restaurant;
                    const restoName = resto?.name || "Restaurant";
                    const restoSlug = resto?.slug || "";
                    const categoryName = categoryData?.name || "";
                    // Préserver le paramètre space si présent
                    const spaceParam = space !== 'default' ? `&space=${space}` : '';
                    const href = restoSlug && categoryName 
                      ? `/menu/${restoSlug}?section=${encodeURIComponent(categoryName)}${spaceParam}`
                      : "#";
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-radisson-blue group-hover:text-radisson-gold transition-colors">
                            {getTranslatedContent(language, item.name, item.name_en)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {restoName}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-radisson-gold" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* 1.5. APERÇU DU PANIER - Cartes compactes */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-widest">
                {language === 'fr' ? "Votre panier" : "Your cart"}
              </h2>
              <Link 
                href="/cart"
                className="text-[10px] font-bold text-radisson-blue hover:text-radisson-gold transition-colors uppercase tracking-widest"
              >
                {language === 'fr' ? "Voir tout" : "View all"} →
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {items.slice(0, 5).map((item) => {
                return (
                  <Link
                    key={item.id}
                    href="/cart"
                    className="flex-shrink-0 bg-white rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-all p-3 w-32 group"
                  >
                    <div className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                      <Utensils size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-[10px] font-bold text-gray-900 break-words mb-1 leading-tight">
                      {item.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-orange-500">
                        {item.price.toLocaleString()} FCFA
                      </span>
                      <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        x{item.quantity}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. ORDER STATUS - Commandes récentes */}
        {(orderHistory.length > 0 || items.length > 0) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {language === 'fr' ? "Statut des commandes" : "Order Status"}
              </h2>
              {(orderHistory.length > 0 || items.length > 0) && (
                <Link 
                  href={items.length > 0 ? "/cart" : "/orders"}
                  className="text-[10px] font-bold text-radisson-blue hover:text-radisson-gold transition-colors uppercase tracking-widest"
                >
                  {language === 'fr' ? "Voir tout" : "View all"} →
                </Link>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {/* Carte panier actuel */}
              {items.length > 0 && (
                <Link 
                  href="/cart"
                  className="flex-shrink-0 w-[280px] bg-white border border-gray-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {language === 'fr' ? "Commande en cours" : "Current Order"}
                      </p>
                      <span className="inline-block bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase">
                        {language === 'fr' ? "En préparation" : "Processing"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">🍽️</span>
                    <span className="text-xs font-medium text-gray-600">
                      {totalItems} {totalItems > 1 ? (language === 'fr' ? 'articles' : 'items') : (language === 'fr' ? 'article' : 'item')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">{totalPrice.toLocaleString()} FCFA</span>
                    <span className="text-[10px] text-gray-400">{language === 'fr' ? "À l'instant" : "Just now"}</span>
                  </div>
                </Link>
              )}
              
              {/* Cartes commandes récentes */}
              {orderHistory.map((order, idx) => {
                const orderDate = new Date(order.date);
                const now = new Date();
                const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));
                const timeAgo = diffMinutes < 1 
                  ? (language === 'fr' ? "À l'instant" : "Just now")
                  : diffMinutes < 60 
                    ? `${diffMinutes} ${language === 'fr' ? 'min' : 'min'} ${language === 'fr' ? 'ago' : ''}`
                    : `${Math.floor(diffMinutes / 60)} ${language === 'fr' ? 'h' : 'h'} ${language === 'fr' ? 'ago' : ''}`;
                
                const statusConfig = order.status === 'sent' || order.status === 'delivered'
                  ? { bg: 'bg-green-100', text: 'text-green-600', label: language === 'fr' ? 'Livré' : 'Delivered' }
                  : { bg: 'bg-blue-100', text: 'text-blue-600', label: language === 'fr' ? 'En préparation' : 'Processing' };
                
                return (
                  <Link
                    key={order.id}
                    href="/orders"
                    className="flex-shrink-0 w-[280px] bg-white border border-gray-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {language === 'fr' ? "Commande" : "Order"} #{order.id.slice(-4)}
                      </p>
                      <span className={`${statusConfig.bg} ${statusConfig.text} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">🍽️</span>
                      <span className="text-xs font-medium text-gray-600">
                        {order.items.length} {order.items.length > 1 ? (language === 'fr' ? 'articles' : 'items') : (language === 'fr' ? 'article' : 'item')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{order.totalPrice.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{timeAgo}</span>
                      {order.tableNumber && (
                        <span>{language === 'fr' ? 'Table' : 'Table'} {order.tableNumber}</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 2.5. FEATURED ITEMS - Grandes cartes horizontales */}
        {featuredItems.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                {language === 'fr' ? "À la une" : "Featured"}
              </h2>
              {(() => {
                const firstRestaurant = getFilteredRestaurants(restaurants, space)[0];
                const spaceParam = space !== 'default' ? `?space=${space}` : '';
                return (
                  <Link 
                    href={firstRestaurant ? `/menu/${firstRestaurant.slug}${spaceParam}` : "#"}
                    className="text-[10px] font-bold text-radisson-blue hover:text-radisson-gold transition-colors uppercase tracking-widest"
                  >
                    {language === 'fr' ? "Voir tout" : "View all"} →
                  </Link>
                );
              })()}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {featuredItems.slice(0, 6).map((item) => {
                const categoryData = getCategoryData(item.categories);
                const resto = categoryData?.restaurant;
                const restoSlug = Array.isArray(resto) ? resto[0]?.slug : resto?.slug;
                const itemName = getTranslatedContent(language, item.name || "", item.name_en || null);
              
                // Préserver le paramètre space dans les liens si présent
                const spaceParam = space !== 'default' ? `?space=${space}` : '';
                
                return (
                  <Link
                    key={item.id}
                    href={restoSlug ? `/menu/${restoSlug}${spaceParam}` : "#"}
                    className="flex-shrink-0 w-[280px] bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="w-full h-32 bg-gray-100 overflow-hidden flex items-center justify-center">
                      <Utensils size={32} className="text-gray-300" />
                    </div>
                    <div className="p-3">
                      <h3 className="text-base font-bold text-gray-900 mb-2 break-words group-hover:text-radisson-blue transition-colors">
                        {itemName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-orange-500">
                          {(item.price || 0).toLocaleString()} FCFA
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-radisson-blue transition-colors">
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. SECTION CATEGORIES - CURATED LIST */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              {language === 'fr' ? "Recherche par Catégorie" : "Search by Category"}
            </h2>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
            {CURATED_CATEGORIES.map((cat, idx) => (
              <div
                key={cat.id}
                className="flex flex-col items-center justify-center p-3 bg-white rounded-xl aspect-square w-full shadow-sm border border-gray-300 transition-all cursor-pointer group hover:bg-gray-50 hover:border-gray-400 hover:shadow-md duration-300 animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => handleCategoryClick(cat.dbTerm)}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-1 transition-transform group-hover:scale-110 bg-gray-100 border border-gray-300 group-hover:bg-gray-200 group-hover:border-gray-400">
                  <span className="text-xl md:text-2xl filter drop-shadow-sm">{cat.icon}</span>
                </div>
                <span className="text-[11px] font-medium text-gray-600 text-center break-words leading-tight mt-1 group-hover:text-radisson-blue">
                  {language === 'en' ? cat.en : cat.fr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. CARTES RESTAURANTS - Only 3 cards: Panorama, Lobby Bar, Carte des Boissons */}
        <div className="mb-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">
            {language === 'fr' ? "Restaurants" : "Restaurants"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-10 relative z-20">
            {(filteredRestaurants.length > 0 ? filteredRestaurants : getFilteredRestaurants(restaurants, space)).map((restaurant, index) => {
              const restaurantSlug = restaurant.slug || "";
              const restaurantInfo = getRestaurantInfo(restaurantSlug, language);
              const isDrinks = restaurantSlug.toLowerCase().includes('carte-des-boissons') || restaurantSlug.toLowerCase().includes('boissons');
              // Préserver le paramètre space dans les liens si présent
              const spaceParam = space !== 'default' ? `?space=${space}` : '';
              const href = restaurantSlug ? `/menu/${restaurantSlug}${spaceParam}` : "#";

              return (
                <Link
                  key={restaurant.id}
                  href={href}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-300 transition-all duration-300 overflow-hidden flex flex-col active:scale-[0.98] animate-fade-in-up opacity-0 [animation-fill-mode:forwards] hover:border-gray-400 hover:shadow-md"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  {/* Image Section */}
                  <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                        {isDrinks ? (
                          <GlassWater size={32} className="text-gray-400" />
                        ) : (
                          <Utensils size={32} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 flex flex-col items-start relative flex-1">
                    <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 group-hover:text-radisson-blue transition-colors break-words">
                      {restaurantInfo.name}
                    </h3>

                    <p className="text-gray-500 text-[11px] leading-relaxed font-medium break-words mb-3">
                      {restaurantInfo.description}
                    </p>

                    <div className="mt-auto w-full flex items-center justify-end">
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-radisson-blue transition-colors">
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
