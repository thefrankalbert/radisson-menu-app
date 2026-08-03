"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, ShoppingBag, Clock, User } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

type TabKey = "home" | "menu" | "cart" | "orders" | "account";

interface TabDef {
    key: TabKey;
    href: string;
    Icon: React.ComponentType<LucideProps>;
    match: (path: string) => boolean;
    badge?: boolean;
}

const LABELS: Record<TabKey, { fr: string; en: string }> = {
    home: { fr: "Accueil", en: "Home" },
    menu: { fr: "Carte", en: "Menu" },
    cart: { fr: "Panier", en: "Cart" },
    orders: { fr: "Commandes", en: "Orders" },
    account: { fr: "Compte", en: "Account" },
};

/** Compteur panier compact — au-delà de 99 le chiffre exact n'aide plus. */
export function formatCartCount(n: number): string {
    return n > 99 ? "99+" : String(n);
}

export function ClientBottomNav() {
    const path = usePathname() ?? "";
    const { totalItems, lastVisitedMenuUrl } = useCart();
    const { language } = useLanguage();

    if (path.startsWith("/admin")) return null;

    const tabs: TabDef[] = [
        { key: "home", href: "/", Icon: Home, match: (p) => p === "/" },
        {
            key: "menu",
            href: lastVisitedMenuUrl ?? "/",
            Icon: UtensilsCrossed,
            match: (p) => p.startsWith("/menu") || p.startsWith("/venue"),
        },
        {
            key: "cart",
            href: "/cart",
            Icon: ShoppingBag,
            match: (p) => p.startsWith("/cart"),
            badge: true,
        },
        { key: "orders", href: "/orders", Icon: Clock, match: (p) => p.startsWith("/orders") },
        { key: "account", href: "/settings", Icon: User, match: (p) => p.startsWith("/settings") },
    ];

    return (
        <nav
            aria-label={language === "en" ? "Main navigation" : "Navigation principale"}
            className="relative z-30 border-t border-[var(--color-divider)] bg-white"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
            <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
                {tabs.map((tab) => {
                    const active = tab.match(path);
                    const label = LABELS[tab.key][language === "en" ? "en" : "fr"];
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className="relative flex flex-col items-center justify-center gap-1"
                            aria-current={active ? "page" : undefined}
                            aria-label={
                                tab.badge && totalItems > 0 ? `${label} (${totalItems})` : label
                            }
                        >
                            <span className="relative">
                                <tab.Icon
                                    className={
                                        active
                                            ? "text-[var(--color-brand)]"
                                            : "text-[var(--color-ink-muted)]"
                                    }
                                    width={22}
                                    height={22}
                                    strokeWidth={active ? 2.2 : 1.8}
                                    aria-hidden="true"
                                />
                                {tab.badge && totalItems > 0 && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-white bg-[var(--color-brand)] px-1 text-[10px] font-bold tabular-nums text-white"
                                    >
                                        {formatCartCount(totalItems)}
                                    </span>
                                )}
                            </span>
                            <span
                                className={`text-[10.5px] tracking-[-0.1px] ${
                                    active
                                        ? "font-semibold text-[var(--color-brand)]"
                                        : "font-medium text-[var(--color-ink-muted)]"
                                }`}
                            >
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
