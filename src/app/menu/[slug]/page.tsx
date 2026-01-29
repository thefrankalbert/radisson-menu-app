"use client";

import useSWR from 'swr';
import { Info } from "lucide-react";
import { notFound, useSearchParams } from "next/navigation";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryNav from "@/components/CategoryNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import { toast } from "react-hot-toast";
import { useEffect, useMemo, use } from "react";



// --- Types ---
interface Restaurant {
    id: string;
    slug: string;
    name: string;
}

interface Category {
    id: string;
    name: string;
    name_en?: string | null;
    restaurant_id: string;
}

interface ItemOption {
    id: string;
    name_fr: string;
    name_en?: string;
    display_order: number;
    is_default: boolean;
}

interface ItemPriceVariant {
    id: string;
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
    options?: ItemOption[];
    price_variants?: ItemPriceVariant[];
}

interface Announcement {
    id: string;
    title: string;
    description: string;
    image_url: string;
    type: 'standard' | 'home_banner' | 'contextual';
    start_date: string;
    end_date: string;
    restaurant_id: string;
}

interface MenuPageProps {
    params: Promise<{
        slug: string;
    }>;
}

interface MenuData {
    restaurant: Restaurant;
    categories: Category[];
    items: MenuItem[];
    announcement: Announcement | null;
}

// --- Fetcher optimisé pour SWR ---
const fetchMenuData = async (slug: string): Promise<MenuData> => {
    // Configuration pour les QR codes : Panorama et Lobby doivent inclure les boissons
    const QR_CONFIG: Record<string, string[]> = {
        'carte-panorama-restaurant': ['carte-panorama-restaurant', 'carte-des-boissons'],
        'carte-lobby-bar-snacks': ['carte-lobby-bar-snacks', 'carte-des-boissons'],
    };

    // Déterminer les slugs à charger
    const slugsToLoad = QR_CONFIG[slug] || [slug];

    // 1. Fetch Restaurants (peut être plusieurs pour Panorama/Lobby + Boissons)
    const { data: restaurantsData, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .in('slug', slugsToLoad)
        .eq('is_active', true);

    if (resError || !restaurantsData || restaurantsData.length === 0) {
        throw new Error("Restaurant introuvable");
    }

    // Le restaurant principal est celui correspondant au slug scanné
    const mainRestaurant = restaurantsData.find(r => r.slug === slug) || restaurantsData[0];
    const restaurantIds = restaurantsData.map(r => r.id);
    const mainRestaurantId = mainRestaurant.id;

    // 2. Fetch Categories de tous les restaurants concernés
    const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*, name_en')
        .in('restaurant_id', restaurantIds)
        .order('id', { ascending: true });

    // Trier les catégories : d'abord celles du restaurant principal, puis les autres (boissons)
    if (catData) {
        catData.sort((a: any, b: any) => {
            const aIsMain = a.restaurant_id === mainRestaurantId;
            const bIsMain = b.restaurant_id === mainRestaurantId;
            if (aIsMain && !bIsMain) return -1;
            if (!aIsMain && bIsMain) return 1;
            return 0; // Conserver l'ordre original pour les catégories du même restaurant
        });
    }

    // 3. Fetch Items
    let items: MenuItem[] = [];
    const categoryIds = catData?.map((c: any) => c.id) || [];
    if (categoryIds.length > 0) {
        const { data: itemData, error: itemError } = await supabase
            .from('menu_items')
            .select('*, name_en, description_en')
            .in('category_id', categoryIds)
            .order('display_order', { ascending: true });

        if (itemData) {
            // 4. Fetch Options et Variantes pour chaque item
            const itemIds = itemData.map((i: any) => i.id);

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

            // Associer options et variantes aux items
            items = itemData.map((item: any) => ({
                ...item,
                options: optionsData?.filter((o: any) => o.menu_item_id === item.id) || [],
                price_variants: variantsData?.filter((v: any) => v.menu_item_id === item.id) || []
            })) as MenuItem[];
        }
    }

    // 5. Fetch Contextual Announcements
    let announcement: Announcement | null = null;
    const today = new Date().toISOString().split('T')[0];
    const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .eq('type', 'contextual')
        .eq('restaurant_id', mainRestaurantId)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at', { ascending: false })
        .limit(1);

    if (annData && annData.length > 0) {
        announcement = annData[0] as Announcement;
    }

    return {
        restaurant: mainRestaurant as Restaurant,
        categories: (catData || []) as Category[],
        items: items,
        announcement: announcement
    };
};

export default function MenuDetailPage({ params }: MenuPageProps) {
    const { slug } = use(params);
    const { t, language } = useLanguage();

    // SWR Implementation avec sync améliorée
    const { data, error, isLoading, mutate } = useSWR<MenuData>(
        slug ? `menu-${slug}` : null,
        () => fetchMenuData(slug),
        {
            revalidateOnFocus: true, // Recharge quand user revient sur l'onglet
            revalidateOnReconnect: true,
            dedupingInterval: 15000, // 15 secondes (réduit de 60s)
            refreshInterval: 30000, // Auto-refresh toutes les 30 secondes
            errorRetryCount: 2,
            onError: (err) => {
                console.error("SWR Error:", err);
                toast.error("Une erreur est survenue lors du chargement du menu.");
            }
        }
    );

    // Real-time subscription pour les changements de menu
    useEffect(() => {
        if (!slug) return;

        const channel = supabase.channel(`menu-sync-${slug}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                mutate(); // Recharge les données quand un plat change
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
                mutate(); // Recharge quand une catégorie change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [slug, mutate]);

    const restaurant = data?.restaurant;
    // Memoize categories pour éviter les re-renders inutiles
    const categories = useMemo(() => data?.categories || [], [data?.categories]);
    const items = useMemo(() => data?.items || [], [data?.items]);
    const announcement = data?.announcement;
    const searchParams = useSearchParams();
    const section = searchParams.get('section');

    useEffect(() => {
        if (section && categories.length > 0) {
            // Find category ID by name (case insensitive)
            const category = categories.find((c: { name: string; name_en?: string | null; id: string }) =>
                c.name.toLowerCase() === section.toLowerCase() ||
                (c.name_en && c.name_en.toLowerCase() === section.toLowerCase())
            );

            if (category) {
                // Short delay to ensure DOM is rendered after loading
                const timer = setTimeout(() => {
                    const element = document.getElementById(`cat-${category.id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [section, categories]);

    if (error) return notFound();

    // --- Skeleton Loading State (Luxe & Fast feel) ---
    if (isLoading && !data) return (
        <main className="min-h-screen bg-radisson-light pb-12 relative overflow-hidden">
            {/* Skeleton Header */}
            <div className="h-14 w-full bg-white/60 border-b border-gray-100 flex items-center justify-center mb-8">
                <div className="h-4 w-32 bg-gray-200/40 rounded shimmer" />
            </div>

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-4 space-y-12">
                {[1, 2].map((i) => (
                    <div key={i}>
                        <div className="h-8 w-48 bg-gray-200/50 rounded-lg mb-8 shimmer" />
                        <div className="grid grid-cols-1 gap-3">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-28 bg-white rounded-2xl border border-gray-300 shadow-sm p-3 flex items-center gap-4 overflow-hidden relative">
                                    <div className="w-24 h-24 bg-gray-50 rounded-xl flex-shrink-0 shimmer" />
                                    <div className="flex-1 flex flex-col justify-center space-y-3">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded shimmer" />
                                        <div className="h-3 w-full bg-gray-50 rounded shimmer" />
                                        <div className="h-4 w-1/4 bg-orange-50 rounded shimmer mt-1" />
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex-shrink-0 shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );

    const getItemsForCategory = (categoryId: string) => {
        return items.filter((item) => item.category_id === categoryId) || [];
    };


    const navCategories = categories.map((c) => ({ id: c.id, name: getTranslatedContent(language, c.name, c.name_en) }));

    return (
        <main className="min-h-screen bg-radisson-light pb-24 pt-16 animate-fade-in relative">
            {/* Category Quick Nav Bar - Sticky Client Component */}
            {navCategories.length > 0 && <CategoryNav categories={navCategories} />}

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-6">

                {/* CONTEXTUAL BANNER */}
                {announcement && (
                    <div className="mb-10 animate-fade-in w-full">
                        <div className="relative overflow-hidden rounded-[24px] shadow-lg border border-radisson-gold/20 aspect-[21/9] md:aspect-[32/9]">
                            {announcement.image_url ? (
                                <>
                                    <img
                                        src={announcement.image_url}
                                        alt={announcement.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-r from-radisson-blue to-[#001833]"></div>
                            )}

                            <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10">
                                <div className="bg-white/10 backdrop-blur-md rounded-full px-3 py-1 mb-3 w-fit border border-white/20">
                                    <span className="text-white text-[10px] uppercase font-bold tracking-widest">Offre Spéciale</span>
                                </div>
                                <h3 className="text-white text-xl md:text-2xl font-playfair font-bold uppercase tracking-widest mb-2 text-shadow-elegant">
                                    {announcement.title}
                                </h3>
                                {announcement.description && (
                                    <p className="text-gray-200 text-xs md:text-sm font-medium line-clamp-2 max-w-xl">
                                        {announcement.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Section */}
                {categories && categories.length > 0 ? (
                    <div className="space-y-12 mb-12">
                        {categories.map((category) => {
                            const categoryName = getTranslatedContent(language, category.name, category.name_en);
                            return (
                                <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-32">
                                    <div className="flex items-center gap-3 md:gap-6 mb-4">
                                        <h2 className="text-base md:text-xl font-bold text-[#002C5F] uppercase tracking-[0.2em] whitespace-nowrap">
                                            {categoryName}
                                        </h2>
                                        <div className="h-[1px] w-full bg-radisson-gold/20" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {getItemsForCategory(category.id).length > 0 ? (
                                            getItemsForCategory(category.id).map((item, index) => (
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
                                            <div className="col-span-full bg-white rounded-2xl p-10 text-center text-gray-400 italic text-sm shadow-sm border border-gray-300">
                                                {t('menu_empty')}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 md:py-32 text-center">
                        <Info className="text-radisson-gold mb-4 md:size-16" size={48} />
                        <h2 className="text-xl md:text-3xl font-bold text-radisson-blue mb-2">{t('installation_progress')}</h2>
                        <p className="text-gray-500 md:text-lg">{t('come_back_soon')}</p>
                    </div>
                )}
            </div>


        </main>
    );
}
