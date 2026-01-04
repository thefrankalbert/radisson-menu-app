"use client";

import {
  Bed,
  Waves,
  Armchair,
  Sun,
  UtensilsCrossed,
  Wine,
  ChevronRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

// Map slugs or names to icons
const getIconForRestaurant = (slug: string) => {
  if (slug.includes('room-service')) return Bed;
  if (slug.includes('pool-bar')) return Waves;
  if (slug.includes('lobby-bar')) return Armchair;
  if (slug.includes('panorama')) return Sun;
  if (slug.includes('tapas')) return UtensilsCrossed;
  if (slug.includes('boissons') || slug.includes('drinks')) return Wine;
  return UtensilsCrossed;
};

// Map slugs to descriptions
const getDescriptionForRestaurant = (slug: string, lang: string) => {
  const descriptions: Record<string, { fr: string, en: string }> = {
    'room-service': { fr: "Service en chambre", en: "In-room dining" },
    'pool-bar': { fr: "Détente au bord de l'eau", en: "Relaxation by the water" },
    'lobby-bar': { fr: "Snacks & Burgers", en: "Snacks & Burgers" },
    'panorama': { fr: "Restaurant - Lounge - Bar", en: "Restaurant - Lounge - Bar" },
    'tapas': { fr: "Petites bouchées", en: "Small bites" },
    'boissons': { fr: "Cocktails & Vins", en: "Cocktails & Wines" },
    'drinks': { fr: "Cocktails & Vins", en: "Cocktails & Wines" },
  };

  const key = Object.keys(descriptions).find(k => slug.includes(k));
  if (key) return descriptions[key][lang as 'fr' | 'en'] || descriptions[key]['fr'];
  return lang === 'fr' ? "Découvrez notre carte" : "Discover our menu";
};

export default function Home() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const { t, language } = useLanguage();

  useEffect(() => {
    async function fetchRestaurants() {
      const { data } = await supabase.from('restaurants').select('*');
      if (data) setRestaurants(data);
    }
    fetchRestaurants();
  }, []);

  return (
    <div className="flex-1 w-full bg-radisson-light pb-20 pt-28 md:pt-48">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Restaurant Grid with Overlap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 lg:gap-10 -mt-8 md:-mt-16 lg:-mt-20 relative z-20">
          {restaurants.map((restaurant, index) => {
            const Icon = getIconForRestaurant(restaurant.slug);
            const description = getDescriptionForRestaurant(restaurant.slug, language);
            const href = `/menu/${restaurant.slug}`;

            return (
              <Link
                key={restaurant.id}
                href={href}
                prefetch={true}
                className="group bg-white rounded-2xl md:rounded-3xl shadow-soft border border-gray-100/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col active:scale-95 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-1.5 w-full bg-radisson-blue opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="p-5 md:p-8 lg:p-10 flex flex-col items-start relative h-full">
                  <div className="absolute top-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-700">
                    <Icon size={120} strokeWidth={1} className="hidden md:block" />
                    <Icon size={80} strokeWidth={1} className="md:hidden" />
                  </div>

                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-50 flex items-center justify-center text-radisson-blue mb-4 md:mb-6 group-hover:bg-radisson-blue group-hover:text-white transition-all duration-500 shadow-sm border border-gray-100 group-hover:rotate-12">
                    <Icon size={20} className="md:size-32" />
                  </div>

                  <h3 className="text-sm md:text-lg lg:text-xl font-bold text-radisson-blue uppercase tracking-wide mb-2 md:mb-3 group-hover:text-radisson-gold transition-colors">
                    {restaurant.name}
                  </h3>

                  <p className="text-gray-400 text-[10px] md:text-sm leading-relaxed mb-6 md:mb-8 font-medium">
                    {description}
                  </p>

                  <div className="mt-auto flex items-center text-[9px] md:text-xs font-bold text-radisson-blue uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                    {t('view_menu')}
                    <ChevronRight size={10} className="ml-1.5 md:size-14 text-radisson-gold" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* My Orders History Link Removed - Moved to Cart Page */}
      </div>

      <footer className="mt-20 md:mt-32 py-10 md:py-16 border-t border-gray-100">
        <div className="text-center text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.4em] font-medium opacity-60">
          Radisson Blu Hotel • N&apos;Djamena
        </div>
      </footer>
    </div>
  );
}
