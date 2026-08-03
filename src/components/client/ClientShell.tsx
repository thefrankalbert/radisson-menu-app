"use client";

import { usePathname } from "next/navigation";
import { ClientBottomNav } from "./BottomNav";
import { ClientFloatingCart } from "./FloatingCart";

/**
 * Coque de l'interface convive : plein écran, une seule zone scrollable, barre
 * d'onglets en bas. `h-dvh` + `overscroll-contain` donnent le comportement d'une
 * app native plutôt que d'une page web (pas de rebond, pas de barre qui saute).
 *
 * L'admin partage la racine mais pas cette coque — il garde son propre châssis.
 */
export function ClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname() ?? "";

    if (pathname.startsWith("/admin")) {
        return <main id="main-content">{children}</main>;
    }

    return (
        <div className="client-ui flex h-dvh flex-col overflow-hidden bg-white">
            <main id="main-content" className="relative flex-1 overflow-y-auto overscroll-contain">
                <div className="mx-auto max-w-lg">{children}</div>
            </main>
            <ClientFloatingCart />
            <ClientBottomNav />
        </div>
    );
}
