"use client";

import Link from "next/link";
import { Martini, Utensils } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// --- HELPERS ---
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

const getCategoryData = (categories: any) => {
    if (!categories) return null;
    const category = Array.isArray(categories) ? categories[0] : categories;
    const restaurants = category.restaurants;
    const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants;
    return {
        name: category.name,
        restaurant: restaurant
    };
};

interface ProductGridProps {
    items: any[];
}

export default function ProductGrid({ items }: ProductGridProps) {
    const { language } = useLanguage();

    if (!items || items.length === 0) return null;

    return (
        <div className="mb-10 mt-12 px-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">
                    {language === 'fr' ? "À LA UNE" : "FEATURED"}
                </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
                {items.map((item) => {
                    const categoryData = getCategoryData(item.categories);
                    const resto = categoryData?.restaurant;
                    const restoSlug = Array.isArray(resto) ? resto[0]?.slug : resto?.slug;
                    const categoryName = categoryData?.name || "";
                    const itemName = getTranslatedContent(language, item.name || "", item.name_en || null);
                    const price = typeof item.price === 'number' ? item.price.toLocaleString() : '0';

                    return (
                        <Link
                            key={item.id}
                            href={restoSlug ? `/menu/${restoSlug}` : "#"}
                            className="flex-shrink-0 w-[260px] bg-white border border-gray-200 rounded-3xl overflow-hidden transition-all duration-500 group"
                        >
                            <div className="relative h-40 bg-gray-50 overflow-hidden">
                                {item.image_url && !item.image_url.includes('placeholder') ? (
                                    <img
                                        src={item.image_url}
                                        alt={itemName}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-radisson-blue/5">
                                        {(categoryName.toLowerCase().includes('boisson') ||
                                            categoryName.toLowerCase().includes('cocktail') ||
                                            categoryName.toLowerCase().includes('vin') ||
                                            categoryName.toLowerCase().includes('bière') ||
                                            categoryName.toLowerCase().includes('drink') ||
                                            categoryName.toLowerCase().includes('beverage') ||
                                            categoryName.toLowerCase().includes('wine') ||
                                            categoryName.toLowerCase().includes('beer')) ? (
                                            <Martini size={40} className="text-radisson-blue/20" />
                                        ) : (
                                            <Utensils size={40} className="text-radisson-blue/20" />
                                        )}
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20">
                                    <span className="text-xs font-black text-gray-900">
                                        {price}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-sm font-black text-gray-900 mb-1 uppercase tracking-wider group-hover:text-radisson-blue transition-colors">
                                    {itemName}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {categoryData?.name}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
