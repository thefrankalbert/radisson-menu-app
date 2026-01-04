"use client";

import useSWR from 'swr';
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryNav from "@/components/CategoryNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "react-hot-toast";

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
}

interface MenuPageProps {
    params: {
        slug: string;
    };
}

// --- Fetcher optimisé pour SWR ---
const fetchMenuData = async (slug: string) => {
    // 1. Fetch Restaurant
    const { data: resData, error: resError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

    if (resError || !resData) throw new Error("Restaurant introuvable");

    // 2. Fetch Categories
    const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*, name_en')
        .eq('restaurant_id', resData.id)
        .order('id', { ascending: true });

    // 3. Fetch Items
    let items: MenuItem[] = [];
    const categoryIds = catData?.map((c: any) => c.id) || [];
    if (categoryIds.length > 0) {
        const { data: itemData, error: itemError } = await supabase
            .from('menu_items')
            .select('*, name_en, description_en')
            .in('category_id', categoryIds);

        if (itemData) items = itemData as MenuItem[];
    }

    return {
        restaurant: resData as Restaurant,
        categories: (catData || []) as Category[],
        items: items
    };
};

export default function MenuDetailPage({ params }: MenuPageProps) {
    const { slug } = params;
    const { t, language } = useLanguage();

    // SWR Implementation
    const { data, error, isLoading } = useSWR(
        slug ? `menu-${slug}` : null,
        () => fetchMenuData(slug),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
            dedupingInterval: 60000, // 1 minute
            errorRetryCount: 2,
            onError: (err) => {
                console.error("SWR Error:", err);
                toast.error("Une erreur est survenue lors du chargement du menu.");
            }
        }
    );

    const restaurant = data?.restaurant;
    const categories = data?.categories || [];
    const items = data?.items || [];

    if (error) return notFound();

    // --- Skeleton Loading State (Luxe & Fast feel) ---
    if (isLoading && !data) return (
        <main className="min-h-screen bg-radisson-light pb-24 relative overflow-hidden">
            {/* Skeleton Header */}
            <div className="h-14 w-full bg-white/60 border-b border-gray-100 flex items-center justify-center mb-8">
                <div className="h-4 w-32 bg-gray-200/40 rounded shimmer" />
            </div>

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-4 space-y-12">
                {[1, 2].map((i) => (
                    <div key={i}>
                        <div className="h-8 w-48 bg-gray-200/50 rounded-lg mb-8 shimmer" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-32 bg-white rounded-3xl border border-gray-100 p-4 flex gap-4 overflow-hidden relative">
                                    <div className="flex-1 space-y-4 py-2">
                                        <div className="h-5 w-3/4 bg-gray-100 rounded-lg shimmer" />
                                        <div className="h-3 w-1/2 bg-gray-50 rounded-md shimmer" />
                                        <div className="h-4 w-1/4 bg-gray-100 rounded-md mt-auto shimmer" />
                                    </div>
                                    <div className="w-24 h-24 bg-gray-50 rounded-2xl shimmer" />
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

    // Robust Translation Helper
    const getTranslatedText = (frText: string, enText?: string | null) => {
        if (language === 'en' && enText && enText.trim() !== '') {
            return enText;
        }
        return frText || "";
    };

    const navCategories = categories.map((c) => ({ id: c.id, name: getTranslatedText(c.name, c.name_en) }));

    return (
        <main className="min-h-screen bg-radisson-light pb-24 pt-32 md:pt-56 animate-fade-in relative">
            {/* Category Quick Nav Bar - Sticky Client Component */}
            {navCategories.length > 0 && <CategoryNav categories={navCategories} />}

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-0">
                {/* Categories Section */}
                {categories && categories.length > 0 ? (
                    categories.map((category) => {
                        const categoryName = getTranslatedText(category.name, category.name_en);
                        return (
                            <section key={category.id} id={`cat-${category.id}`} className="mb-8 md:mb-16 lg:mb-20 scroll-mt-24 md:scroll-mt-32">
                                <div className="flex items-center gap-3 md:gap-6 mb-4 md:mb-8">
                                    <h2 className="text-base md:text-2xl lg:text-3xl font-bold text-radisson-blue uppercase tracking-[0.2em] whitespace-nowrap">
                                        {categoryName}
                                    </h2>
                                    <div className="h-[0.5px] md:h-[1px] w-full bg-radisson-gold/30" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {getItemsForCategory(category.id).length > 0 ? (
                                        getItemsForCategory(category.id).map((item) => (
                                            <MenuItemCard
                                                key={item.id}
                                                item={{
                                                    ...item,
                                                    name: getTranslatedText(item.name, item.name_en),
                                                    description: getTranslatedText(item.description, item.description_en)
                                                }}
                                                restaurantId={restaurant?.id || ""}
                                            />
                                        ))
                                    ) : (
                                        <div className="col-span-full bg-white rounded-2xl p-10 text-center text-gray-400 italic text-sm shadow-sm border border-gray-100">
                                            {t('menu_empty')}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )
                    })
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
