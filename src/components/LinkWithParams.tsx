"use client";

import Link, { LinkProps } from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface LinkWithParamsProps extends LinkProps {
    children: ReactNode;
    className?: string;
}

export default function LinkWithParams({ href, children, ...props }: LinkWithParamsProps) {
    const searchParams = useSearchParams();
    const [finalHref, setFinalHref] = useState<string>(href.toString());

    useEffect(() => {
        const table = searchParams.get('table') || localStorage.getItem('saved_table');

        if (table) {
            try {
                const url = new URL(href.toString(), window.location.origin);
                url.searchParams.set('table', table);
                setFinalHref(url.pathname + url.search + url.hash);
            } catch (e) {
                // If href is not a valid relative/absolute path for URL constructor
                if (href.toString().startsWith('/')) {
                    const separator = href.toString().includes('?') ? '&' : '?';
                    setFinalHref(`${href}${separator}table=${table}`);
                }
            }
        } else {
            setFinalHref(href.toString());
        }
    }, [searchParams, href]);

    return (
        <Link href={finalHref} {...props}>
            {children}
        </Link>
    );
}
