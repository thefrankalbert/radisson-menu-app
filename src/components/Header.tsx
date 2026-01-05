"use client";

import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";

function HeaderContent({ title }: HeaderProps) {
    const pathname = usePathname();
    const params = useParams();
    const { language, setLanguage, t } = useLanguage();
    const [restaurantName, setRestaurantName] = useState<string>("");

    const isHome = pathname === "/";
    const isMenuPage = pathname.startsWith("/menu/");

    // Fetch restaurant name if on menu page
    useEffect(() => {
        if (isMenuPage && params?.slug) {
            const fetchRestaurant = async () => {
                const { data } = await supabase
                    .from('restaurants')
                    .select('name')
                    .eq('slug', params.slug)
                    .single();

                if (data) {
                    setRestaurantName(data.name);
                }
            };
            fetchRestaurant();
        }
    }, [isMenuPage, params?.slug]);

    const displayTitle = title || (isMenuPage && restaurantName) || "Blu Table";

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm transition-all duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 md:h-20 flex items-center justify-between">

                    {/* Left: Spacer (removed Hamburger) or Back */}
                    <div className="flex-1 flex items-center">
                        {!isHome && (
                            <Link href="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-gray-900" />
                            </Link>
                        )}
                    </div>

                    {/* Center: Title */}
                    <div className="flex-[2] flex justify-center">
                        <h1 className="text-gray-900 font-bold text-base md:text-lg tracking-tight">
                            {displayTitle}
                        </h1>
                    </div>

                    {/* Right: Language */}
                    <div className="flex-1 flex justify-end">
                        <button
                            onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                            className="p-2 flex items-center gap-1.5 text-xl transition-opacity active:opacity-60"
                            title={language === "fr" ? "Switch to English" : "Passer en Français"}
                        >
                            {language === "fr" ? "🇫🇷" : "🇺🇸"}
                            <span className="text-[10px] font-bold text-gray-400 hidden sm:inline">{language.toUpperCase()}</span>
                        </button>
                    </div>

                </div>
            </div>
        </header>
    );
}

interface HeaderProps {
    title?: string;
    showBackButton?: boolean;
    variant?: "light" | "dark";
}

export default function Header(props: HeaderProps) {
    return (
        <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse" />}>
            <HeaderContent {...props} />
        </Suspense>
    );
}
