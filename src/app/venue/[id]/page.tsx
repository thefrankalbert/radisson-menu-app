"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryNav from "@/components/CategoryNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import { toast } from "react-hot-toast";

// Configuration des venues avec leurs sous-menus
// IMPORTANT: Les slugs doivent correspondre exactement à ceux de la base Supabase
const VENUE_CONFIG: Record<string, {
    name_fr: string;
    name_en: string;
    submenus: {
        id: string;
        slug: string;
        name_fr: string;
        name_en: string;
        filterCategory?: string;
        excludeCategory?: string;
    }[];
}> = {
    'panorama': {
        name_fr: 'Panorama Restaurant',
        name_en: 'Panorama Restaurant',
        submenus: [
            {
                id: 'panorama-main',
                slug: 'carte-panorama-restaurant',
                name_fr: "Panorama",
                name_en: 'Panorama',
                // Removed excludeCategory to show EVERYTHING (Tapas included) in the main tab if user wants
            },
            {
                id: 'panorama-tapas',
                slug: 'carte-panorama-restaurant',
                name_fr: "Tapas",
                name_en: 'Tapas',
                filterCategory: 'Tapas' // We keep this one to have a dedicated "Shortcu" tab for Tapas only
            }
        ]
    },
    'lobby': {
        name_fr: 'Lobby & Pool',
        name_en: 'Lobby & Pool',
        submenus: [
            { id: 'lobby', slug: 'carte-lobby-bar-snacks', name_fr: 'Lobby Bar', name_en: 'Lobby Bar' },
            { id: 'pool', slug: 'pool-bar', name_fr: 'Pool', name_en: 'Pool' }
        ]
    },
    'drinks': {
        name_fr: 'Carte des Boissons',
        name_en: 'Drinks Menu',
        submenus: [
            { id: 'drinks', slug: 'carte-des-boissons', name_fr: 'Boissons', name_en: 'Drinks' }
        ]
    }
};

// Types
interface Category {
    id: string;
    name: string;
    name_en?: string | null;
    restaurant_id: string;
    display_order?: number;
}

interface ItemOption {
    id: string;
    menu_item_id?: string;
    name_fr: string;
    name_en?: string;
    display_order: number;
    is_default: boolean;
}

interface ItemPriceVariant {
    id: string;
    menu_item_id?: string;
    variant_name_fr: string;
    variant_name_en?: string;
    price: number;
    display_order: number;
    is_default: boolean;
}

interface MenuItem {
    id: string;
    name: string;
    name_en?: string | null;
    description: string;
    description_en?: string | null;
    price: number;
    image_url: string;
    category_id: string;
    is_vegetarian: boolean;
    is_spicy: boolean;
    display_order?: number;
    options?: ItemOption[];
    price_variants?: ItemPriceVariant[];
}

interface Restaurant {
    id: string;
    slug: string;
    name: string;
    name_en?: string;
}

interface VenueData {
    restaurant: Restaurant | null;
    categories: Category[];
    items: MenuItem[];
    error?: string;
}

interface VenuePageProps {
    params: {
        id: string;
    };
}

export default function VenuePage({ params }: VenuePageProps) {
    const { id: venueId } = params;
    const { t, language } = useLanguage();

    const venueConfig = VENUE_CONFIG[venueId];

    // State management
    const [activeSubmenuIndex, setActiveSubmenuIndex] = useState(0);
    const [data, setData] = useState<VenueData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Obtenir le slug du sous-menu actif
    const activeSubmenu = venueConfig?.submenus[activeSubmenuIndex];
    const activeSubmenuSlug = activeSubmenu?.slug || 'not-found';

    // Fetch data when slug changes
    useEffect(() => {
        if (!venueConfig) return;

        const fetchData = async () => {
            setIsLoading(true);
            console.log("[VenuePage] Fetching data for slug:", activeSubmenuSlug);

            try {
                // 1. Fetch Restaurant
                const { data: resData, error: resError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('slug', activeSubmenuSlug)
                    .single();

                console.log("[VenuePage] Restaurant result:", { resData, resError });

                if (resError || !resData) {
                    console.error("Restaurant not found for slug:", activeSubmenuSlug, resError);
                    setData({ restaurant: null, categories: [], items: [], error: resError?.message || "Not found" });
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch Categories
                const { data: catData } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('restaurant_id', resData.id)
                    .order('display_order', { ascending: true });

                console.log("[VenuePage] Categories:", catData?.length || 0);

                // 3. Fetch Items
                let items: MenuItem[] = [];
                const categoryIds = catData?.map((c: Category) => c.id) || [];

                if (categoryIds.length > 0) {
                    const { data: itemData } = await supabase
                        .from('menu_items')
                        .select('*')
                        .in('category_id', categoryIds)
                        .eq('is_available', true)
                        .order('display_order', { ascending: true });

                    console.log("[VenuePage] Items:", itemData?.length || 0);

                    if (itemData && itemData.length > 0) {
                        const itemIds = itemData.map((i: MenuItem) => i.id);

                        // Fetch Options
                        const { data: optionsData } = await supabase
                            .from('item_options')
                            .select('*')
                            .in('menu_item_id', itemIds)
                            .order('display_order', { ascending: true });

                        // Fetch Price Variants
                        const { data: variantsData } = await supabase
                            .from('item_price_variants')
                            .select('*')
                            .in('menu_item_id', itemIds)
                            .order('display_order', { ascending: true });

                        items = itemData.map((item: MenuItem) => ({
                            ...item,
                            options: optionsData?.filter((o: ItemOption) => o.menu_item_id === item.id) || [],
                            price_variants: variantsData?.filter((v: ItemPriceVariant) => v.menu_item_id === item.id) || []
                        }));
                    }
                }

                console.log("[VenuePage] Data fetched successfully:", {
                    restaurant: resData.name,
                    categories: catData?.length || 0,
                    items: items.length
                });

                setData({
                    restaurant: resData as Restaurant,
                    categories: (catData || []) as Category[],
                    items: items
                });
            } catch (error) {
                console.error("[VenuePage] Fetch error:", error);
                toast.error(language === 'fr' ? "Erreur de chargement" : "Load error");
                setData({ restaurant: null, categories: [], items: [] });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeSubmenuSlug, venueConfig, language]);

    // Filtrage des données localement basé sur submenuConfig
    const restaurant = data?.restaurant;

    const categories = useMemo(() => {
        let cats = data?.categories || [];

        // Only filter if explicitly requested in config
        if (activeSubmenu?.filterCategory) {
            cats = cats.filter((c: Category) => c.name.toLowerCase().includes(activeSubmenu.filterCategory!.toLowerCase()));
        }

        // Only exclude if explicitly requested in config
        if (activeSubmenu?.excludeCategory) {
            cats = cats.filter((c: Category) => !c.name.toLowerCase().includes(activeSubmenu.excludeCategory!.toLowerCase()));
        }

        // IMPORTANT: By default, we DO NOT restrict items. All categories for the fetched restaurant slug are shown.
        // This fixes the issue where "Panorama" tab only showed "Plats" and hid "Tapas" because of restrictive logic.

        return cats;
    }, [data?.categories, activeSubmenu]);

    const items = useMemo(() => {
        const itms = data?.items || [];
        // Filtrer par les catégories restantes
        const catIds = new Set(categories.map((c: Category) => c.id));
        return itms.filter((i: MenuItem) => catIds.has(i.category_id));
    }, [data?.items, categories]);

    // Navigation categories
    const navCategories = useMemo(() =>
        categories.map((c: Category) => ({
            id: c.id,
            name: getTranslatedContent(language, c.name, c.name_en)
        }))
        , [categories, language]);

    const getItemsForCategory = useCallback((categoryId: string) => {
        return items.filter((item: MenuItem) => item.category_id === categoryId);
    }, [items]);

    if (!venueConfig) return notFound();

    // Loading state
    if (isLoading) {
        return (
            <main className="min-h-screen bg-[#F8FAFC] pb-12 pt-16 relative overflow-hidden">
                {/* Tabs skeleton */}
                {venueConfig.submenus.length > 1 && (
                    <div className="sticky top-16 z-40 bg-white border-b border-gray-100 px-4 py-3">
                        <div className="max-w-lg mx-auto">
                            <div className="h-11 bg-gray-100 rounded-xl shimmer" />
                        </div>
                    </div>
                )}
                <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-6 space-y-8">
                    {[1, 2].map((i) => (
                        <div key={i}>
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4 shimmer" />
                            <div className="space-y-3">
                                {[1, 2].map((j) => (
                                    <div key={j} className="h-24 bg-white rounded-xl border border-gray-100 shimmer" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#F8FAFC] pb-24 pt-16 animate-fade-in relative">
            {/* TABS - Remplace le header "Lobby & Pool" ou "Panorama" */}
            {venueConfig.submenus.length > 1 && (
                <div className="sticky top-16 z-40 bg-white border-b border-gray-100">
                    <div className="max-w-lg mx-auto px-4 py-3">
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center relative">
                            {/* Fond glissant pour l'onglet actif */}
                            <div
                                className="absolute h-[calc(100%-8px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
                                style={{
                                    width: `calc(${100 / venueConfig.submenus.length}% - 4px)`,
                                    left: `calc(${(activeSubmenuIndex * 100) / venueConfig.submenus.length}% + 2px)`
                                }}
                            />

                            {venueConfig.submenus.map((submenu, idx) => (
                                <button
                                    key={submenu.id}
                                    onClick={() => setActiveSubmenuIndex(idx)}
                                    className={`relative z-10 flex-1 py-2.5 text-sm font-bold transition-colors duration-200 rounded-lg ${idx === activeSubmenuIndex
                                        ? 'text-[#002C5F]'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    {language === 'en' ? submenu.name_en : submenu.name_fr}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Category Navigation - Scroll horizontal */}
            {navCategories.length > 0 && <CategoryNav categories={navCategories} />}

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 pt-4">
                {/* Categories Section */}
                {categories && categories.length > 0 ? (
                    <div className="space-y-8 mb-12">
                        {categories.map((category: Category) => {
                            const categoryName = getTranslatedContent(language, category.name, category.name_en);
                            const categoryItems = getItemsForCategory(category.id);

                            return (
                                <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-sm font-bold text-[#002C5F] uppercase tracking-wider whitespace-nowrap">
                                            {categoryName}
                                        </h2>
                                        <div className="h-px flex-1 bg-[#C5A065]/30" />
                                    </div>

                                    <div className="space-y-2">
                                        {categoryItems.length > 0 ? (
                                            categoryItems.map((item: MenuItem, index: number) => (
                                                <MenuItemCard
                                                    key={item.id}
                                                    item={{
                                                        ...item,
                                                        name: getTranslatedContent(language, item.name, item.name_en),
                                                        description: getTranslatedContent(language, item.description, item.description_en),
                                                        options: item.options,
                                                        price_variants: item.price_variants
                                                    }}
                                                    restaurantId={restaurant?.id || ""}
                                                    priority={index < 4 && categories.indexOf(category) === 0}
                                                    category={categoryName}
                                                />
                                            ))
                                        ) : (
                                            <div className="bg-white rounded-xl p-8 text-center text-gray-400 italic text-sm border border-gray-100">
                                                {t('menu_empty') || (language === 'fr' ? 'Aucun article disponible' : 'No items available')}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-[#C5A065]/10 rounded-full flex items-center justify-center mb-4">
                            <Info className="text-[#C5A065] w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-bold text-[#002C5F] mb-2">
                            {data?.error ? (language === 'fr' ? 'Erreur de connexion' : 'Connection Error') : (t('installation_progress') || (language === 'fr' ? 'Menu en préparation' : 'Menu coming soon'))}
                        </h2>
                        <p className="text-gray-500 text-sm max-w-xs">
                            {data?.error
                                ? `${data.error}. ${language === 'fr' ? 'Vérifiez vos variables Supabase.' : 'Check your Supabase variables.'}`
                                : (t('come_back_soon') || (language === 'fr' ? 'Revenez très bientôt' : 'Come back soon'))}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}
