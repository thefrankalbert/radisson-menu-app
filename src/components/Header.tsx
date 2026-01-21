"use client";

import { usePathname, useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function HeaderContent({ title }: HeaderProps) {
    const pathname = usePathname();
    const params = useParams();
    const [restaurantName, setRestaurantName] = useState<string>("");

    const isHomePage = pathname === "/";
    const isMenuPage = pathname.startsWith("/menu/");
    const isVenuePage = pathname.startsWith("/venue/");
    const isAdminPage = pathname.startsWith("/admin");
    const isSettingsPage = pathname === "/settings";
    const isOrdersPage = pathname === "/orders";
    const isCartPage = pathname === "/cart";
    const isOrderConfirmedPage = pathname === "/order-confirmed";

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

    // Ne pas afficher le header sur la page d'accueil, admin, settings, orders, cart, venue et order-confirmed
    if (isAdminPage || isHomePage || isSettingsPage || isOrdersPage || isCartPage || isVenuePage || isOrderConfirmedPage) {
        return null;
    }

    // Déterminer le titre à afficher
    let displayTitle = title || "Blu Table";
    if (isMenuPage && restaurantName) {
        displayTitle = restaurantName;
    } else if (isVenuePage && params?.id) {
        // Titre pour les pages venue
        const venueNames: Record<string, string> = {
            'panorama': 'Panorama',
            'lobby': 'Lobby & Pool',
            'drinks': 'Boissons'
        };
        displayTitle = venueNames[params.id as string] || "Blu Table";
    }

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm transition-all duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 md:h-20 flex items-center justify-between">
                    {/* Left side spacer to keep title centered */}
                    <div className="w-10" />

                    {/* Center: Title */}
                    <h1 className="text-gray-900 font-bold text-base md:text-lg tracking-tight text-center">
                        {displayTitle}
                    </h1>

                    {/* Right side spacer */}
                    <div className="w-10" />
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
