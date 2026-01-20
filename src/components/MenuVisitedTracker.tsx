"use client";

import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function MenuVisitedTracker() {
    const { setLastVisitedMenuUrl } = useCart();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith("/menu/")) {
            setLastVisitedMenuUrl(pathname);
        }
    }, [pathname, setLastVisitedMenuUrl]);

    return null;
}
