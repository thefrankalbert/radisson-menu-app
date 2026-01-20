"use client";

import { useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";

export default function TableCapture() {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    useEffect(() => {
        const tableFromUrl = searchParams.get('table');
        const savedTable = localStorage.getItem('saved_table') || localStorage.getItem('table_number');

        if (tableFromUrl) {
            console.log('Capture table:', tableFromUrl);
            localStorage.setItem('saved_table', tableFromUrl);
            localStorage.setItem('table_number', tableFromUrl); // Legacy support
        } else if (savedTable && !pathname.startsWith('/admin')) {
            // Persist the table number in the URL if missing (except admin)
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('table', savedTable);
            window.history.replaceState(null, '', currentUrl.toString());
        }
    }, [searchParams, pathname]);

    return null;
}
