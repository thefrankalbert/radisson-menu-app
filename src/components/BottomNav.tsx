"use client";

import { Home, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function BottomNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { language } = useLanguage();
    const { totalItems } = useCart();

    // Ne pas afficher la navigation sur les pages admin
    if (pathname.startsWith("/admin")) {
        return null;
    }

    const isActive = (path: string) => {
        if (path === "/") return pathname === "/";
        return pathname.startsWith(path);
    };

    // Construire l'URL de l'accueil en préservant les query params
    const getHomeHref = () => {
        const params = new URLSearchParams();
        // Préserver les paramètres v et table s'ils existent
        const v = searchParams.get('v');
        const table = searchParams.get('table');
        if (v) params.set('v', v);
        if (table) params.set('table', table);
        const queryString = params.toString();
        return queryString ? `/?${queryString}` : '/';
    };

    const navItems = [
        {
            icon: Home,
            label: language === 'fr' ? "Accueil" : "Home",
            href: getHomeHref(),
            active: isActive("/") && !isActive("/venue") && !isActive("/menu") && !isActive("/cart") && !isActive("/orders")
        },
        {
            icon: ShoppingBag,
            label: language === 'fr' ? "Panier" : "Cart",
            href: "/cart",
            active: isActive("/cart"),
            badge: totalItems > 0 ? totalItems : null
        },
        {
            icon: Clock,
            label: language === 'fr' ? "Historique" : "History",
            href: "/orders",
            active: isActive("/orders")
        }
    ];

    return (
        <nav
            aria-label={language === 'fr' ? "Navigation principale" : "Main navigation"}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe shadow-none"
            suppressHydrationWarning
        >

            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const handleClick = () => {
                        // Si c'est le bouton Accueil et qu'on a des query params, marquer comme navigation
                        if (item.href.startsWith('/') && item.href.includes('?')) {
                            sessionStorage.setItem('navigating_to_home', 'true');
                        }
                    };

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleClick}
                            aria-label={item.badge ? `${item.label} (${item.badge} ${language === 'fr' ? 'articles' : 'items'})` : item.label}
                            aria-current={item.active ? "page" : undefined}
                            className={`relative flex flex-col items-center justify-center gap-1 py-2 px-3 transition-colors duration-150 min-w-[72px] ${item.active
                                ? "text-black"
                                : "text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {/* Active indicator top bar */}
                            {item.active && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-black rounded-b-sm" />
                            )}

                            <div className="relative">
                                <Icon
                                    size={24}
                                    strokeWidth={item.active ? 2.5 : 2}
                                    className="relative z-10"
                                    aria-hidden="true"
                                />
                                {/* Badge for cart */}
                                {item.badge && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute -top-2 -right-2 z-20 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border border-white"
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium tracking-wide ${item.active ? "font-semibold" : ""
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}

            </div>
        </nav>
    );
}
