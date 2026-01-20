"use client";

import { Home, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function BottomNav() {
    const pathname = usePathname();
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

    const navItems = [
        {
            icon: Home,
            label: language === 'fr' ? "Accueil" : "Home",
            href: "/",
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-safe">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 min-w-[72px] ${
                                item.active
                                    ? "text-[#002C5F]"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <div className="relative">
                                {/* Active indicator background */}
                                {item.active && (
                                    <div className="absolute -inset-2 bg-[#002C5F]/5 rounded-full" />
                                )}
                                <Icon
                                    size={22}
                                    strokeWidth={item.active ? 2.5 : 1.8}
                                    className="relative z-10"
                                />
                                {/* Badge for cart */}
                                {item.badge && (
                                    <span className="absolute -top-2 -right-2 z-20 bg-[#C5A065] text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-semibold tracking-wide ${
                                item.active ? "font-bold" : ""
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
