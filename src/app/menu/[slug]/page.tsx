"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { notFound } from "next/navigation";
import MenuItemCard from "@/components/MenuItemCard";
import CategoryNav from "@/components/CategoryNav";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

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

export default function MenuDetailPage({ params }: MenuPageProps) {
    const { slug } = params;
    const { t, language } = useLanguage();

    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch Restaurant
                const { data: resData, error: resError } = await supabase
                    .from('restaurants')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (resError || !resData) {
                    setError(true);
                    return;
                }
                setRestaurant(resData);

                // 2. Fetch Categories
                const { data: catData, error: catError } = await supabase
                    .from('categories')
                    .select('*, name_en')
                    .eq('restaurant_id', resData.id);

                if (catData) setCategories(catData);

                // 3. Fetch Items
                const categoryIds = catData?.map((c: any) => c.id) || [];
                if (categoryIds.length > 0) {
                    const { data: itemData, error: itemError } = await supabase
                        .from('menu_items')
                        .select('*, name_en, description_en')
                        .in('category_id', categoryIds);

                    if (itemData) setItems(itemData);
                }
            } catch (e) {
                console.error(e);
                setError(true);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [slug]);

    if (error) return notFound();

    // --- Skeleton Loading State (Luxe & Fast feel) ---
    if (loading) return (
        <main className="min-h-screen bg-radisson-light pb-24 relative overflow-hidden">
            {/* Skeleton Header */}
            <div className="h-14 w-full bg-white/60 border-b border-gray-100 flex items-center justify-center mb-8">
                <div className="h-4 w-32 bg-gray-200/50 rounded animate-pulse" />
            </div>

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-4 space-y-12">
                {/* Skeleton Section */}
                {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="h-6 w-40 bg-gray-200/80 rounded mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="h-28 bg-white rounded-2xl border border-gray-100/50 p-4 flex gap-4">
                                    <div className="flex-1 space-y-3 py-2">
                                        <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                        <div className="h-3 w-1/2 bg-gray-50 rounded" />
                                    </div>
                                    <div className="w-20 h-20 bg-gray-100 rounded-xl" />
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
