"use client";

import Image from "next/image";
import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";

function HeaderContent({ title, showBackButton, variant: propVariant }: HeaderProps) {
    const pathname = usePathname();
    const { language, setLanguage, t } = useLanguage();

    // Auto-detect variant based on route if not provided
    const variant = propVariant || (pathname === "/" ? "dark" : "light");
    const isDark = variant === "dark";

    // Map slugs to official titles
    const menuTitles: Record<string, string> = {
        "menu-room-service": "Room Service",
        "carte-pool-bar": "Pool Bar",
        "carte-lobby-bar-snacks": "Lobby Bar",
        "carte-panorama-restaurant": "Menu Panorama",
        "carte-tapas": "Tapas",
        "carte-des-boissons": language === "fr" ? "Carte des Boissons" : "Drinks Menu",
    };

    // Extract slug from path like /menu/pool-bar
    const slug = pathname.startsWith('/menu/') ? pathname.split('/').pop() : null;
    // Calculate Page Title based on slug
    let dynamicTitle = "";
    if (pathname === "/cart") {
        dynamicTitle = t("my_cart").toUpperCase();
    } else if (pathname === "/order-confirmed") {
        dynamicTitle = t("confirmed").toUpperCase();
    } else if (slug) {
        dynamicTitle = menuTitles[slug] || slug.replace(/carte-|menu-/g, '').replace(/-/g, ' ').toUpperCase();
    }

    // Default titles based on route
    const displayTitle = title || dynamicTitle || (pathname === "/" ? t("select_menu").toUpperCase() : "ROOM SERVICE");

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 w-full ${isDark ? "bg-radisson-blue/95 border-none shadow-none text-white" : "bg-white/90 border-b border-gray-100 shadow-soft backdrop-blur-md"} animate-fade-in transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`relative ${isDark ? "py-10 md:py-20 lg:py-24" : "py-6 md:py-10"} flex flex-col items-center justify-center text-center z-10`}>

                    {/* Back Button */}
                    {(showBackButton || pathname !== "/") && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2">
                            <Link href="/" className={`flex items-center gap-1.5 md:gap-2 ${isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-gray-50 hover:bg-gray-100 text-radisson-blue border-gray-200"} px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold transition-all border active:scale-95 backdrop-blur-md shadow-sm`}>
                                <ArrowLeft size={14} className="md:size-18" />
                                <span className="hidden sm:inline">{t("back").toUpperCase()}</span>
                            </Link>
                        </div>
                    )}

                    {/* Language Switcher */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2">
                        <button
                            onClick={() => setLanguage(language === "fr" ? "en" : "fr")}
                            className={`flex items-center gap-1.5 md:gap-2 ${isDark ? "bg-white/10 hover:bg-white/20 text-white border-white/20" : "bg-gray-50 hover:bg-gray-100 text-radisson-blue border-gray-200"} px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold transition-all border active:scale-95 backdrop-blur-md shadow-sm`}
                        >
                            <Globe size={14} className="md:size-18" />
                            <span>{language.toUpperCase()}</span>
                        </button>
                    </div>

                    {/* Center Content */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 md:w-48 lg:w-64 h-10 md:h-16 lg:h-20 mb-4 md:mb-8 transform transition-transform duration-700 hover:scale-105">
                            <Image
                                src={isDark ? "/logo-white.svg" : "/logo.svg"}
                                alt="Radisson Blu Logo"
                                fill
                                priority
                                className="object-contain"
                            />
                        </div>

                        <div className={`h-[1px] w-8 md:w-12 lg:w-16 ${isDark ? "bg-radisson-gold/50" : "bg-radisson-gold/50"} mb-4 md:mb-6 opacity-100 shadow-glow`} />

                        <h1 className={`${isDark ? "text-white/95" : "text-radisson-blue"} font-light text-[9px] md:text-sm lg:text-base tracking-[0.4em] md:tracking-[0.5em] uppercase animate-fade-in-up`}>
                            {displayTitle}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Background Decorative Element for Dark Variant */}
            {isDark && (
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center">
                    <div className="relative w-full h-full max-w-4xl">
                        <Image
                            src="/logo-white.svg"
                            alt=""
                            fill
                            className="object-contain scale-150 translate-y-32 blur-[2px]"
                        />
                    </div>
                </div>
            )}
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
        <Suspense fallback={<div className="h-20 bg-radisson-blue animate-pulse" />}>
            <HeaderContent {...props} />
        </Suspense>
    );
}
