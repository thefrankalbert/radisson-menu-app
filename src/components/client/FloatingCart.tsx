"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Price } from "./Price";
import { hasRealPhoto } from "./Photo";
import { formatCartCount } from "./BottomNav";

export function ClientFloatingCart() {
    const { totalItems, totalPrice, items } = useCart();
    const { language } = useLanguage();
    const pathname = usePathname() ?? "";

    if (totalItems === 0) return null;
    if (pathname.startsWith("/cart") || pathname.startsWith("/admin")) return null;

    const label = language === "en" ? "View cart" : "Voir le panier";
    const thumbItems = items.filter((i) => hasRealPhoto(i.image_url)).slice(0, 3);

    return (
        <Link
            href="/cart"
            /* `fixed` se cale sur la fenêtre, pas sur la coque : sans max-w + mx-auto
               la barre traverserait tout l'écran en desktop. */
            className="fixed inset-x-0 bottom-[92px] z-20 mx-auto flex max-w-lg items-center gap-3 rounded-[var(--radius-modal)] bg-[var(--color-ink)] px-3 py-2.5 text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10),0_4px_6px_-4px_rgba(0,0,0,0.06)] max-[512px]:left-3.5 max-[512px]:right-3.5"
            aria-label={`${label} (${totalItems})`}
        >
            {thumbItems.length > 0 ? (
                <div className="flex">
                    {thumbItems.map((item, i) => (
                        <div
                            key={item.id}
                            className="h-[30px] w-[30px] overflow-hidden rounded-full border-2 border-[var(--color-ink)]"
                            style={{ marginLeft: i === 0 ? 0 : -10 }}
                        >
                            <Image
                                src={item.image_url!}
                                alt=""
                                width={30}
                                height={30}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <ShoppingBag className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
            )}

            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="shrink-0 rounded-[var(--radius-tag)] bg-white px-[7px] py-0.5 text-[11px] font-bold leading-none tabular-nums text-[var(--color-ink)]">
                    {formatCartCount(totalItems)}
                </span>
                <span className="truncate text-[13.5px] font-medium">{label}</span>
            </div>

            <Price
                value={totalPrice}
                size={13.5}
                className="shrink-0 text-white"
                unitClassName="text-white/55"
            />
        </Link>
    );
}
