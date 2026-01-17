"use client";

import { Home, Search, ShoppingCart, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();
    const { totalItems } = useCart();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] pb-safe pt-2">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                <Link href="/" aria-label="Aller à la page d'accueil" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === "/" ? "text-radisson-blue" : "text-gray-400 hover:text-gray-600"}`}>
                    <Home size={24} strokeWidth={pathname === "/" ? 2.5 : 2} aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Accueil</span>
                </Link>

                {/* Search/Menu - let's make it a 'Discover' link or inactive if no global menu page exists */}
                {/* For this specific task, if no global /menu page, maybe we omit or just link home? */}
                {/* I will disable it or make it link to Home for now until /menu exists, or check lastVisitedMenuUrl */}

                <Link href="/cart" aria-label={`Voir mon panier (${totalItems} articles)`} className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === "/cart" ? "text-radisson-blue" : "text-gray-400 hover:text-gray-600"}`}>
                    <div className="relative">
                        <ShoppingCart size={24} strokeWidth={pathname === "/cart" ? 2.5 : 2} aria-hidden="true" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-radisson-gold text-radisson-blue text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Panier</span>
                </Link>

                {/* History Link - forcing tab switch via query param would be ideal but for now just link */}
                {/* Using a simple state or context would be better but let's stick to Link */}
                {/* I will make it look like a separate item even if it goes to same page */}
                <Link href="/orders" aria-label="Voir mon historique de commandes" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${pathname === "/orders" ? "text-radisson-blue" : "text-gray-400 hover:text-gray-600"}`}>
                    <Receipt size={24} strokeWidth={pathname === "/orders" ? 2.5 : 2} aria-hidden="true" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Historique</span>
                </Link>
            </div>
        </div>
    );
}
