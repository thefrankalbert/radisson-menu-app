"use client";
import {
  ChevronRight,
  Search,
  ShoppingCart,
  Utensils,
  Settings,
  Martini
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import QRScanner from "@/components/QRScanner";
import ClearStorage from "@/components/ClearStorage";
import CategoryGrid from "@/components/menu/CategoryGrid";
import ProductGrid from "@/components/menu/ProductGrid";
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
export interface Restaurant {
  id: string;
  name: string;
  name_en?: string | null;
  slug: string;
  [key: string]: unknown;
}

export interface MenuItemCategory {
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

export interface MenuItem {
  id: string;
  name: string;
  name_en?: string | null;
  price: number;
  image_url?: string;
  is_featured: boolean;
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
};

export interface Announcement {
  id: string;
  title: string;
  description: string;
  image_url: string;
  type: 'standard' | 'home_banner' | 'contextual';
  start_date: string;
  end_date: string;
}

// CURATED CATEGORIES LIST (Clean & Fixed)
const CURATED_CATEGORIES = [
  { id: 'starters', fr: "Pour commencer", en: "Starters", icon: "🥗", dbTerm: "Entrée" },
  { id: 'burgers', fr: "Burgers Signatures", en: "Burgers", icon: "🍔", dbTerm: "Burger" },
  { id: 'african', fr: "Saveurs d'Afrique", en: "African Dishes", icon: "🍲", dbTerm: "Africains" },
  { id: 'pizzas', fr: "Pizzas", en: "Pizzas", icon: "🍕", dbTerm: "Pizza" },
  { id: 'pasta', fr: "Pâtes", en: "Pasta", icon: "🍝", dbTerm: "Pâtes" },
  { id: 'grills', fr: "Du grill", en: "Grills", icon: "🍖", dbTerm: "Grillade" },
  { id: 'main', fr: "Plats principaux", en: "Main Courses", icon: "🍽️", dbTerm: "Plat" },
  { id: 'vegetarian', fr: "Végétarien", en: "Vegetarian", icon: "🥬", dbTerm: "Végétarien" },
  { id: 'desserts', fr: "Douceurs", en: "Desserts", icon: "🍰", dbTerm: "Dessert" },
  { id: 'drinks', fr: "À boire", en: "Drinks", icon: "🍹", dbTerm: "Boisson" },
  { id: 'aperitifs', fr: "Apéritifs", en: "Aperitifs", icon: "🫒", dbTerm: "Cocktail" },
];

// MAIN VENUE CARDS - 3 principales cartes sur la homepage
// Utilise maintenant /venue/[id] pour la navigation avec sous-menus
const MAIN_VENUES = [
  {
    id: 'panorama',
    href: '/venue/panorama',
    fr: {
      name: "Restaurant le Panorama",
      subtitle: "Le meilleur de N'Djamena, en hauteur.",
      description: "Restaurant Gastronomique"
    },
    en: {
      name: "Panorama Restaurant",
      subtitle: "The best of N'Djamena, from above.",
      description: "Fine Dining Restaurant"
    },
    image: "/images/panorama.jpg",
    badge: "LOUNGE"
  },
  {
    id: 'lobby',
    href: '/venue/lobby',
    fr: {
      name: "Lobby Bar",
      subtitle: "Bar & Snacks",
      description: "Ambiance cosy"
    },
    en: {
      name: "Lobby Bar",
      subtitle: "Bar & Snacks",
      description: "Cosy environment"
    },
    image: "/images/lobby-bar.jpg",
    badge: null
  },
  {
    id: 'drinks',
    href: '/venue/drinks',
    fr: {
      name: "Carte des Boissons",
      subtitle: "Cocktails & Vins",
      description: "Sélection premium"
    },
    en: {
      name: "Drinks Menu",
      subtitle: "Cocktails & Wines",
      description: "Premium selection"
    },
    image: "/images/boissons.jpg",
    badge: null
  }
];

// Map slugs to descriptions
const getDescriptionForRestaurant = (slug: string, lang: string): string => {
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
  return "Restaurant & Bar";
};

interface OrderHistoryItem {
  id: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  tableNumber: string;
  status: string;
}

import { useSearchParams } from "next/navigation";

// ... previous interfaces ...

interface HomeClientProps {
  initialRestaurants: Restaurant[];
  initialCategories: any[];
  initialMenuItems: MenuItem[];
  initialAnnouncement: Announcement | null;
}

export default function HomeClient({
  initialRestaurants,
  initialCategories,
  initialMenuItems,
  initialAnnouncement
}: HomeClientProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [announcement, setAnnouncement] = useState<Announcement | null>(initialAnnouncement);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([]);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const { items, totalItems, totalPrice } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Scroll handler for sticky search bar
  const handleScroll = useCallback(() => {
    if (searchBarRef.current) {
      const searchBarTop = searchBarRef.current.getBoundingClientRect().top;
      // When search bar reaches top of viewport (around 64px from top due to header)
      setIsSearchSticky(searchBarTop <= 64);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Aligner la largeur de la section prix avec le titre "Sunday Brunch"
  useEffect(() => {
    const alignPriceWidth = () => {
      const titleElement = document.getElementById('sunday-brunch-title');
      if (titleElement) {
        const titleWidth = titleElement.offsetWidth;
        document.documentElement.style.setProperty('--title-width', `${titleWidth}px`);
      }
    };

    // Attendre que le DOM soit prêt
    setTimeout(alignPriceWidth, 100);
    window.addEventListener('resize', alignPriceWidth);
    return () => window.removeEventListener('resize', alignPriceWidth);
  }, []);

  // État pour le scanner QR
  const [showQRScanner, setShowQRScanner] = useState(false);
  const scannerCheckRef = useRef(false);

  // Active Restaurant Context - avec persistance localStorage
  const [persistedVenue, setPersistedVenue] = useState<string | null>(null);

  // Lire depuis URL d'abord, puis localStorage
  const urlVenue = searchParams.get('v') || searchParams.get('restaurant') || searchParams.get('venue');
  const urlTable = searchParams.get('table');

  // Ouvrir automatiquement le scanner QR uniquement quand on accède directement à la racine sans paramètres
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    const hasParams = window.location.search.length > 0;

    // Vérifier si c'est une navigation depuis le bouton Accueil (avec query params préservés)
    const isNavigationFromButton = sessionStorage.getItem('navigating_to_home') === 'true';

    // Réinitialiser le flag quand on change de page
    scannerCheckRef.current = false;

    // Utiliser setTimeout pour éviter l'avertissement React sur setState pendant le rendu
    const timer = setTimeout(() => {
      if (scannerCheckRef.current) return;
      scannerCheckRef.current = true;

      // Si on a des paramètres (navigation depuis bouton ou retour après scan), fermer le scanner
      if (hasParams) {
        console.log('Paramètres présents dans l\'URL - fermeture du scanner');
        sessionStorage.removeItem('navigating_to_home'); // Nettoyer le flag
        setShowQRScanner((prev) => {
          if (prev) return false;
          return prev;
        });
      } else if (currentPath === '/' && !hasParams) {
        // Si on est sur la racine SANS paramètres
        if (isNavigationFromButton) {
          // Navigation depuis le bouton Accueil sans params → nettoyer et scanner
          console.log('Navigation depuis bouton Accueil sans params - nettoyage et scanner');
          sessionStorage.removeItem('navigating_to_home'); // Nettoyer le flag
          setShowQRScanner(true);
        } else {
          // Accès direct à la racine → scanner
          console.log('Ouverture automatique du scanner QR sur la racine (accès direct)');
          setShowQRScanner(true);
        }
      }
    }, 600); // Délai pour s'assurer que ClearStorage a fini de nettoyer

    return () => {
      clearTimeout(timer);
      scannerCheckRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlVenue, urlTable]); // Réagir aux changements de paramètres URL

  // Initialiser depuis URL et sessionStorage (pas localStorage car on le nettoie à la racine)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    const hasParams = window.location.search.length > 0;

    // Vérifier si c'est un accès direct (pas de referrer ou referrer externe)
    const isDirectAccess = !document.referrer ||
      !document.referrer.includes(window.location.origin) ||
      document.referrer === window.location.href;

    // Si accès direct à la racine, nettoyer les paramètres de l'URL s'ils existent
    if (currentPath === '/' && isDirectAccess) {
      if (hasParams) {
        // Accès direct avec paramètres → les nettoyer
        console.log('Accès direct à la racine avec paramètres - nettoyage de l\'URL');
        window.history.replaceState({}, '', '/');
        setPersistedVenue(null);
        return;
      } else {
        // Accès direct sans paramètres → ne pas restaurer
        console.log('Accès direct à la racine - ne pas restaurer les paramètres');
        setPersistedVenue(null);
        return;
      }
    }

    if (urlVenue) {
      // Si on a un paramètre URL, l'utiliser directement et le sauvegarder dans sessionStorage
      setPersistedVenue(urlVenue);
      sessionStorage.setItem('active_venue_filter', urlVenue);
    } else {
      // Pas de paramètre URL dans l'URL, vérifier sessionStorage
      // Mais seulement si ce n'est PAS un accès direct sans paramètres
      if (!(currentPath === '/' && !hasParams && isDirectAccess)) {
        const savedVenue = sessionStorage.getItem('active_venue_filter');
        if (savedVenue && savedVenue !== 'null' && savedVenue !== '') {
          // Si on a un venue sauvegardé et qu'on a au moins le paramètre table, restaurer le venue
          if (urlTable) {
            setPersistedVenue(savedVenue);
            // Rediriger pour ajouter le paramètre v manquant
            const currentUrl = new URL(window.location.href);
            if (!currentUrl.searchParams.has('v')) {
              currentUrl.searchParams.set('v', savedVenue);
              console.log('Restauration du venue depuis sessionStorage:', savedVenue);
              router.replace(currentUrl.toString(), { scroll: false });
            }
          } else {
            // Pas de table non plus, ne rien faire
            setPersistedVenue(null);
          }
        } else {
          setPersistedVenue(null);
        }
      } else {
        setPersistedVenue(null);
      }
    }
  }, [urlVenue, urlTable, router]);

  const activeVenue = urlVenue || persistedVenue;

  // Récupérer le numéro de table depuis l'URL ou localStorage
  const [tableNumber, setTableNumber] = useState<string>('');
  const tableFromUrl = searchParams.get('table');

  useEffect(() => {
    const saved = tableFromUrl || localStorage.getItem('saved_table') || localStorage.getItem('table_number') || '';
    setTableNumber(saved);
  }, [tableFromUrl]);

  // Data fetching logic removed as data is passed via props

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
      // Find categories matching the term and the active venue
      const { data, error } = await supabase
        .from('categories')
        .select('name, restaurant_id, restaurants(slug)')
        .ilike('name', `%${dbTerm}%`);

      if (error) throw error;

      if (data && data.length > 0) {
        // If we have an active venue, try to find a match within that venue first
        let selected = data[0];
        if (activeVenue) {
          const groupSlugs: Record<string, string[]> = {
            'panorama': ['carte-panorama-restaurant', 'carte-des-boissons'],
            'lobby': ['carte-lobby-bar-snacks', 'carte-des-boissons'],
            'lobby-bar': ['carte-lobby-bar-snacks', 'carte-des-boissons'], // Compatibilité
          };
          const allowed = groupSlugs[activeVenue] || [activeVenue];
          const match = data.find(c => {
            const slug = Array.isArray(c.restaurants) ? c.restaurants[0]?.slug : (c.restaurants as any)?.slug;
            return slug && allowed.some(s => slug.includes(s));
          });
          if (match) selected = match;
        }

        const restaurants = selected.restaurants;
        const slug = Array.isArray(restaurants) ? restaurants[0]?.slug : (restaurants as any)?.slug;
        const realName = selected.name;

        if (slug) {
          const filterParam = activeVenue ? `&v=${activeVenue}` : '';
          router.push(`/menu/${slug}?section=${encodeURIComponent(realName)}${filterParam}`);
        } else {
          setSearchQuery(dbTerm);
        }
      } else {
        setSearchQuery(dbTerm);
      }
    } catch (err) {
      setSearchQuery(dbTerm);
    }
  };

  const filteredRestaurants = useMemo(() => {
    let list = restaurants;
    if (activeVenue) {
      const groupSlugs: Record<string, string[]> = {
        'panorama': ['carte-panorama-restaurant', 'carte-des-boissons'],
        'lobby': ['carte-lobby-bar-snacks', 'carte-des-boissons'],
        'lobby-bar': ['carte-lobby-bar-snacks', 'carte-des-boissons'], // Compatibilité
      };
      const allowed = groupSlugs[activeVenue] || [activeVenue];
      list = restaurants.filter(r => allowed.some(s => r.slug.includes(s)));
    }

    if (!searchQuery.trim()) return list;

    const lowerQuery = searchQuery.toLowerCase();
    return list.filter(r => {
      const name = r.name?.toLowerCase() || "";
      const slug = r.slug?.toLowerCase() || "";
      return name.includes(lowerQuery) || slug.includes(lowerQuery);
    });
  }, [restaurants, searchQuery, activeVenue]);

  // Filtering logic based on active venue
  const filteredMenuItems = useMemo(() => {
    if (!activeVenue) return menuItems;

    const groupSlugs: Record<string, string[]> = {
      'panorama': ['carte-panorama-restaurant', 'carte-des-boissons'],
      'lobby': ['carte-lobby-bar-snacks', 'carte-des-boissons'],
      'lobby-bar': ['carte-lobby-bar-snacks', 'carte-des-boissons'], // Compatibilité
    };

    const allowedSlugs = groupSlugs[activeVenue] || [activeVenue];

    return menuItems.filter(item => {
      const categoryData = getCategoryData(item.categories);
      const slug = categoryData?.restaurant?.slug;
      return slug && allowedSlugs.some(s => slug.includes(s));
    });
  }, [menuItems, activeVenue]);

  const filteredCategories = useMemo(() => {
    if (!activeVenue) return CURATED_CATEGORIES;

    // Récupérer les slugs autorisés pour le venue actif
    const groupSlugs: Record<string, string[]> = {
      'panorama': ['carte-panorama-restaurant'],
      'lobby': ['carte-lobby-bar-snacks'],
      'lobby-bar': ['carte-lobby-bar-snacks'],
    };
    const allowedSlugs = groupSlugs[activeVenue] || [activeVenue];

    console.log("[HomePage] Filtering categories for venue:", { activeVenue, allowedSlugs });

    // Récupérer toutes les catégories du restaurant actif depuis la DB
    const venueCategories = categories.filter(cat => {
      const restaurant = Array.isArray(cat.restaurants) ? cat.restaurants[0] : cat.restaurants;
      const slug = (restaurant as any)?.slug;
      return slug && allowedSlugs.some(s => slug.includes(s));
    });

    // Exclure les catégories Tapas si on est sur Panorama (comme dans venue page)
    const excludedCategories = activeVenue === 'panorama'
      ? ['Entre Deux Doigts', 'Nos Hamburgers']
      : [];

    const filteredVenueCategories = venueCategories.filter(cat => {
      const catName = cat.name?.toLowerCase() || '';
      const shouldExclude = excludedCategories.some(excluded => catName.includes(excluded.toLowerCase()));
      if (shouldExclude) {
        console.log("[HomePage] Excluding category:", cat.name);
      }
      return !shouldExclude;
    });

    console.log("[HomePage] Venue categories after filtering:", {
      total: venueCategories.length,
      filtered: filteredVenueCategories.length,
      categories: filteredVenueCategories.map(c => ({ fr: c.name, en: c.name_en }))
    });

    // Mapper les catégories réelles aux catégories CURATED
    // Créer un mapping plus complet entre les noms de catégories DB et les catégories CURATED
    const categoryMapping: Record<string, string> = {
      // Starters / Entrées
      'pour commencer': 'starters',
      'entrée': 'starters',
      'starters': 'starters',
      'starter': 'starters',
      // Burgers
      'nos hamburgers': 'burgers',
      'burger': 'burgers',
      'hamburgers': 'burgers',
      // African
      'plats africains': 'african',
      'africains': 'african',
      'african': 'african',
      'african dishes': 'african',
      // Pizzas
      'pizza': 'pizzas',
      'pizzas': 'pizzas',
      // Grills
      'grillade': 'grills',
      'du grill': 'grills',
      'grills': 'grills',
      'grill': 'grills',
      // Desserts
      'douceurs': 'desserts',
      'dessert': 'desserts',
      'desserts': 'desserts',
      'sweets': 'desserts',
      // Drinks
      'boisson': 'drinks',
      'à boire': 'drinks',
      'drinks': 'drinks',
      'drink': 'drinks',
      'boissons': 'drinks',
      // Aperitifs
      'cocktail': 'aperitifs',
      'apéritif': 'aperitifs',
      'aperitifs': 'aperitifs',
      'aperitif': 'aperitifs',
      // Pasta
      'nos pâtes': 'pasta',
      'pasta': 'pasta',
      'pâtes': 'pasta',
      'our pasta': 'pasta',
      // Main courses
      'plats principaux': 'main',
      'main courses': 'main',
      'main course': 'main',
      'plats': 'main',
      // Vegetarian
      'plat végétarien': 'vegetarian',
      'vegetarian': 'vegetarian',
      'végétarien': 'vegetarian',
      'vegetarian dish': 'vegetarian',
    };

    // Créer un Set des catégories trouvées dans le venue
    const foundCategoryIds = new Set<string>();

    filteredVenueCategories.forEach(venueCat => {
      const catName = (venueCat.name || '').toLowerCase().trim();
      const catNameEn = ((venueCat.name_en || '').toLowerCase().trim());

      console.log("[HomePage] Checking category:", { catName, catNameEn, fullName: venueCat.name });

      // Chercher une correspondance dans le mapping (recherche plus flexible)
      let matched = false;
      for (const [key, categoryId] of Object.entries(categoryMapping)) {
        const keyLower = key.toLowerCase();
        // Correspondance partielle dans les deux sens
        if (catName.includes(keyLower) || catNameEn.includes(keyLower) ||
          keyLower.includes(catName) || keyLower.includes(catNameEn)) {
          foundCategoryIds.add(categoryId);
          matched = true;
          console.log("[HomePage] Matched category via mapping:", { catName, key, categoryId });
          break;
        }
      }

      // Si aucune correspondance trouvée, essayer de deviner selon des mots-clés
      if (!matched) {
        if (catName.includes('africain') || catNameEn.includes('african')) {
          foundCategoryIds.add('african');
          console.log("[HomePage] Matched via keyword: african");
        } else if (catName.includes('burger') || catNameEn.includes('burger') || catName.includes('hamburger')) {
          foundCategoryIds.add('burgers');
          console.log("[HomePage] Matched via keyword: burgers");
        } else if (catName.includes('pizza') || catNameEn.includes('pizza')) {
          foundCategoryIds.add('pizzas');
          console.log("[HomePage] Matched via keyword: pizzas");
        } else if (catName.includes('pâte') || catNameEn.includes('pasta')) {
          foundCategoryIds.add('pasta');
          console.log("[HomePage] Matched via keyword: pasta");
        } else if (catName.includes('grill') || catNameEn.includes('grill')) {
          foundCategoryIds.add('grills');
          console.log("[HomePage] Matched via keyword: grills");
        } else if (catName.includes('principal') || catNameEn.includes('main course')) {
          foundCategoryIds.add('main');
          console.log("[HomePage] Matched via keyword: main");
        } else if (catName.includes('végétarien') || catNameEn.includes('vegetarian')) {
          foundCategoryIds.add('vegetarian');
          console.log("[HomePage] Matched via keyword: vegetarian");
        } else if (catName.includes('dessert') || catName.includes('douceur') ||
          catNameEn.includes('dessert') || catNameEn.includes('sweet')) {
          foundCategoryIds.add('desserts');
          console.log("[HomePage] Matched via keyword: desserts");
        } else if (catName.includes('commencer') || catName.includes('entrée') ||
          catNameEn.includes('starter') || catNameEn.includes('start')) {
          foundCategoryIds.add('starters');
          console.log("[HomePage] Matched via keyword: starters");
        } else if (catName.includes('boisson') || catName.includes('drink') ||
          catNameEn.includes('drink') || catNameEn.includes('beverage')) {
          foundCategoryIds.add('drinks');
          console.log("[HomePage] Matched via keyword: drinks");
        } else if (catName.includes('cocktail') || catName.includes('apéritif') ||
          catNameEn.includes('cocktail') || catNameEn.includes('aperitif')) {
          foundCategoryIds.add('aperitifs');
          console.log("[HomePage] Matched via keyword: aperitifs");
        } else {
          console.warn("[HomePage] No match found for category:", { catName, catNameEn, fullName: venueCat.name });
        }
      }
    });

    // Toujours inclure les boissons pour Panorama et Lobby
    if (activeVenue === 'panorama' || activeVenue === 'lobby' || activeVenue === 'lobby-bar') {
      foundCategoryIds.add('drinks');
    }

    // Filtrer CURATED_CATEGORIES selon les catégories trouvées
    const result = CURATED_CATEGORIES.filter(cat => foundCategoryIds.has(cat.id));

    console.log("[HomePage] Filtered categories:", {
      activeVenue,
      venueCategoriesCount: filteredVenueCategories.length,
      venueCategories: filteredVenueCategories.map(c => ({ fr: c.name, en: c.name_en })),
      foundCategoryIds: Array.from(foundCategoryIds),
      resultCount: result.length,
      result: result.map(c => c.fr)
    });

    return result;
  }, [categories, activeVenue]);

  const deepSearchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];

    // Utiliser les mêmes items filtrés que pour les catégories
    const itemsToSearch = activeVenue ? filteredMenuItems : menuItems;

    const lowerQuery = searchQuery.toLowerCase();
    return itemsToSearch.filter(item => {
      const itemName = (item.name || "").toLowerCase();
      const itemNameEn = (item.name_en || "").toLowerCase();
      return itemName.includes(lowerQuery) || itemNameEn.includes(lowerQuery);
    }).slice(0, 5);
  }, [menuItems, filteredMenuItems, searchQuery, activeVenue]);

  const featuredItems = menuItems.filter(item => item.is_featured);

  return (
    <>
      <ClearStorage />
      <QRScanner isOpen={showQRScanner} onClose={() => setShowQRScanner(false)} />
      <div className="flex-1 w-full bg-radisson-light min-h-screen pb-0">
        {/* STICKY HEADER WITH SEARCH - Appears when scrolling */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isSearchSticky
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
            }`}
        >
          <div className="bg-white border-b border-gray-100 italic">
            <div className="w-full px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={18} strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'fr' ? "Rechercher..." : "Search..."}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-2.5 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-radisson-blue/20 focus:border-radisson-blue transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Link
                  href="/settings"
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-radisson-blue transition-colors rounded-full hover:bg-gray-50"
                >
                  <Settings size={20} strokeWidth={2} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* GRADIENT HERO SECTION */}
        <div className="relative">
          {/* Gradient Background */}
          <div className="absolute inset-0 h-[380px] gradient-hero" />

          {/* Content over gradient */}
          <div className="relative pt-4">
            {/* Original Header - only visible when not scrolled */}
            <div className={`transition-opacity duration-300 ${isSearchSticky ? 'opacity-0' : 'opacity-100'}`}>
              <div className="w-full px-4 py-3 flex items-center justify-between">
                <div className="w-10" />
                {/* Logo horizontal image */}
                <img
                  src="/images/header.png"
                  alt="Blu Table"
                  className="h-6 w-auto max-w-[260px] object-contain"
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/header.png";
                  }}
                />
                <Link
                  href="/settings"
                  className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Settings size={22} strokeWidth={1.8} />
                </Link>
              </div>
            </div>

            <div className="w-full px-4">

              {/* DYNAMIC HOME BANNER */}
              {announcement ? (
                <div className="mb-6 animate-fade-in w-full">
                  <div className="relative overflow-hidden rounded-[28px] gold-glow cursor-pointer group aspect-[21/9] md:aspect-[32/9]">
                    {/* Image Background */}
                    {announcement.image_url ? (
                      <>
                        <img
                          src={announcement.image_url}
                          alt={announcement.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#002C5F] to-[#001833]"></div>
                    )}

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 z-10">
                      <h3 className="text-white text-xl md:text-3xl font-playfair font-bold uppercase tracking-widest mb-2">
                        {announcement.title}
                      </h3>
                      {announcement.description && (
                        <p className="text-gray-200 text-xs md:text-sm font-medium line-clamp-2 max-w-2xl bg-black/20 backdrop-blur-sm p-2 rounded-lg border border-white/10 inline-block">
                          {announcement.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 1.2. SEARCH BAR - Style simple avec contour */}
              <div ref={searchBarRef} className="mt-4 mb-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (deepSearchResults.length > 0) {
                      const item = deepSearchResults[0];
                      const categoryData = getCategoryData(item.categories);
                      const slug = categoryData?.restaurant?.slug;
                      const categoryName = categoryData?.name;

                      if (slug && categoryName) {
                        router.push(`/menu/${slug}?section=${encodeURIComponent(categoryName)}`);
                      }
                    }
                  }}
                  className="relative"
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Search size={18} strokeWidth={1.5} />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'fr' ? "Rechercher un plat, un menu..." : "Search for a dish, a menu..."}
                    className="w-full bg-white border border-gray-300 rounded-xl py-3 pl-11 pr-5 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  {deepSearchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-200 overflow-hidden z-50 animate-fade-in-up">
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
                          const href = restoSlug && categoryName
                            ? `/menu/${restoSlug}?section=${encodeURIComponent(categoryName)}`
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

              {/* Titre de bienvenue et numéro de table */}
              {tableNumber && (
                <div className="mb-5 animate-fade-in">
                  <div className="text-left">
                    {/* Titre */}
                    <h1 className="text-[#003058] text-xl sm:text-2xl font-bold mb-1 leading-tight">
                      {language === 'fr' ? (
                        'Découvrez nos délicieux plats'
                      ) : (
                        'Order Easier'
                      )}
                    </h1>

                    {/* Sous-titre */}
                    <p className="text-[#003058] text-sm sm:text-base font-normal -mt-1">
                      {language === 'fr'
                        ? `Vous êtes à la table ${tableNumber}`
                        : `You are at table ${tableNumber}`}
                    </p>
                  </div>
                </div>
              )}

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
                          className="flex-shrink-0 bg-white rounded-xl border border-gray-300 transition-all p-3 w-32 group"
                        >
                          <div className="w-full h-20 bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center">
                            <Utensils size={24} className="text-gray-300" />
                          </div>
                          <h3 className="text-[10px] font-bold text-gray-900 line-clamp-2 mb-1 leading-tight">
                            {item.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-orange-500">
                              {formatPrice(item.price)}
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


              {/* 2. SECTION CATEGORIES - CURATED LIST */}
              <CategoryGrid
                categories={filteredCategories}
                language={language as 'fr' | 'en'}
                onCategoryClick={handleCategoryClick}
              />

              {/* 3. ORDER STATUS - Commandes récents */}
              {(orderHistory.length > 0 || items.length > 0) && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-radisson-blue text-xs font-bold tracking-[0.15em] uppercase">
                      {language === 'fr' ? "SUIVI DE COMMANDE" : "ORDER TRACKING"}
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
                        className="flex-shrink-0 w-[280px] bg-white border border-gray-300 rounded-xl p-3 transition-all group"
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
                          <span className="text-lg font-bold text-gray-900">{formatPrice(totalPrice)}</span>
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
                          className="flex-shrink-0 w-[280px] bg-white border border-gray-300 rounded-xl p-3 transition-all group"
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
                            <span className="text-lg font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
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

              {/* 4. FEATURED ITEMS - Plats mis en avant (is_featured) */}
              <ProductGrid items={featuredItems} />

              {/* 4. CARTES PRINCIPALES - 3 VENUES */}
              <div className="mb-10 space-y-4">
                <p className="text-radisson-blue text-xs font-bold tracking-[0.15em] uppercase">
                  {language === 'fr' ? "Nos Univers" : "Our Universes"}
                </p>

                <div className="space-y-4 relative z-20">
                  {MAIN_VENUES
                    .filter(v => !activeVenue || v.id === activeVenue || v.id === 'drinks')
                    .map((venue, index) => {
                      const venueData = language === 'en' ? venue.en : venue.fr;

                      return (
                        <Link
                          key={venue.id}
                          href={venue.href}
                          className="bg-white rounded-[24px] overflow-hidden border border-gray-200 transition-all duration-300 cursor-pointer group block"
                        >
                          <div className="h-44 relative overflow-hidden">
                            <img
                              src={venue.image}
                              alt={venueData.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                            {venue.badge && (
                              <div className="absolute top-4 right-4">
                                <span className="px-3 py-1.5 bg-[#C5A065]/90 text-white text-[10px] font-bold tracking-wider uppercase rounded-full">
                                  {venue.badge}
                                </span>
                              </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              <h3 className="text-white text-[22px] font-semibold tracking-tight">
                                {venueData.name}
                              </h3>
                              <p className="text-white/60 text-sm mt-1">{venueData.subtitle}</p>
                            </div>
                          </div>
                          <div className="px-5 py-4 flex items-center justify-between">
                            <p className="text-gray-400 text-xs font-medium tracking-wide">{venueData.description}</p>
                            <div
                              className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#C5A065] transition-all duration-300"
                            >
                              <ChevronRight size={16} className="text-gray-300 group-hover:text-white transition-colors" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 py-6 pb-24 border-t border-gray-50">
          <div className="text-center text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.4em] font-bold opacity-40">
            BLU TABLE • N&apos;Djamena
          </div>
        </footer>
      </div>
    </>
  );
}
