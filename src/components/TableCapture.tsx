"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export default function TableCapture() {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        const savedTable = localStorage.getItem('saved_table') || localStorage.getItem('table_number');
        const hasAnyParams = window.location.search.length > 0;

        if (tableFromUrl) {
            console.log('Capture table:', tableFromUrl);
            localStorage.setItem('saved_table', tableFromUrl);
            localStorage.setItem('table_number', tableFromUrl); // Legacy support
        } else if (savedTable && !pathname.startsWith('/admin')) {
            // Ne restaurer le paramètre table QUE si on n'est pas à la racine sans paramètres
            // À la racine sans paramètres, on veut nettoyer le localStorage et ouvrir le scanner
            const isRootWithoutParams = pathname === '/' && !hasAnyParams;
            
            if (!isRootWithoutParams) {
                // Persist the table number in the URL if missing (except admin and root without params)
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.set('table', savedTable);
                window.history.replaceState(null, '', currentUrl.toString());
            } else {
                // À la racine sans paramètres, ne pas restaurer - laisser le localStorage être nettoyé
                console.log('Racine sans paramètres - ne pas restaurer le paramètre table');
            }
        }
    }, [searchParams, pathname]);

    return null;
}
