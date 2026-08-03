"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState, useMemo, useCallback, useEffect, useSyncExternalStore } from "react";
import { MapPin, Search, QrCode, ChevronDown, User } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getTranslatedContent } from "@/utils/translation";
import { HomeSearchOverlay } from "./HomeSearchOverlay";
import ItemDetailSheet from "./ItemDetailSheet";
import type { ClientMenuItem } from "./MenuItemCard";
import type { MenuItem } from "@/types/admin";

const QRScanner = dynamic(() => import("@/components/QRScanner"), { ssr: false, loading: () => null });

const RECENT_KEY = "blutable_recent_searches";
const TABLE_KEY = "saved_table";
const MAX_RECENT = 4;

const COPY = {
    youAreAt: { fr: "Vous êtes au", en: "You are at" },
    table: { fr: "Table", en: "Table" },
    account: { fr: "Compte et préférences", en: "Account and settings" },
    searchPlaceholder: { fr: "Rechercher un plat, une boisson…", en: "Search a dish or a drink…" },
    scanQR: { fr: "Scanner un QR code", en: "Scan a QR code" },
} as const;

/** Accents et casse ignorés : « crème » doit sortir sur « creme ». */
function normalize(s: string): string {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const noopSubscribe = () => () => {};

interface Props {
    venueName: string;
    venueNameEn?: string;
    /** Corpus complet interrogeable, déjà chargé par la page. */
    allItems: MenuItem[];
    /** Cartes des plats les plus commandés, affichées avant toute frappe. */
    popularItems: ClientMenuItem[];
    restaurantIdFor: (item: MenuItem) => string;
    toClientItem: (item: MenuItem) => ClientMenuItem;
}

export function HomeHeaderClient({
    venueName,
    venueNameEn,
    allItems,
    popularItems,
    restaurantIdFor,
    toClientItem,
}: Props) {
    const { language } = useLanguage();
    const lang = language === "en" ? "en" : "fr";
    const say = (k: keyof typeof COPY) => COPY[k][lang];

    const [isQROpen, setIsQROpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [recent, setRecent] = useState<string[]>([]);
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);

    // Le numéro de table vit dans localStorage (posé par le scan QR / l'URL).
    // useSyncExternalStore garde le rendu serveur à null, sans écart d'hydratation.
    const tableNum = useSyncExternalStore(
        noopSubscribe,
        () => {
            try {
                return localStorage.getItem(TABLE_KEY);
            } catch {
                return null;
            }
        },
        () => null,
    );

    const closeSearch = useCallback(() => {
        setIsSearchOpen(false);
        setSearchQuery("");
    }, []);

    // Les récents sont relus à l'ouverture — pas de setState dans un effet.
    const openSearch = useCallback(() => {
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            const parsed: unknown = raw ? JSON.parse(raw) : [];
            if (Array.isArray(parsed)) {
                setRecent(parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT));
            }
        } catch {
            // stockage indisponible ou corrompu : on ouvre sans historique
        }
        setIsSearchOpen(true);
    }, []);

    const pushRecent = useCallback(
        (term: string) => {
            const clean = term.trim();
            if (clean.length < 2) return;
            const next = [clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(
                0,
                MAX_RECENT,
            );
            setRecent(next);
            try {
                localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            } catch {
                // navigation privée : les récents restent en mémoire seulement
            }
        },
        [recent],
    );

    useEffect(() => {
        if (!isSearchOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSearch();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isSearchOpen, closeSearch]);

    const fullById = useMemo(() => new Map(allItems.map((it) => [it.id, it])), [allItems]);

    const searchResults = useMemo(() => {
        const q = normalize(searchQuery.trim());
        if (!q) return [];
        return allItems
            .filter((it) => {
                const name = getTranslatedContent(lang, it.name, it.name_en);
                const desc = getTranslatedContent(lang, it.description ?? "", it.description_en);
                return normalize(name).includes(q) || normalize(desc).includes(q);
            })
            .slice(0, 40)
            .map(toClientItem);
    }, [searchQuery, allItems, lang, toClientItem]);

    const openDetail = useCallback(
        (id: string) => {
            const it = fullById.get(id);
            if (it) setDetailItem(it);
        },
        [fullById],
    );

    const displayName = getTranslatedContent(lang, venueName, venueNameEn);

    return (
        <>
            <header className="flex items-center justify-between bg-white px-4 pb-2.5 pt-3.5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                        <MapPin className="h-3.5 w-3.5 text-[var(--color-ink-2)]" />
                    </div>
                    <div className="min-w-0">
                        <div className="font-mono text-xs font-medium uppercase tracking-[0.4px] text-[var(--color-ink-muted)]">
                            {say("youAreAt")}
                        </div>
                        <Link
                            href="/settings"
                            className="flex min-w-0 items-center gap-1 text-[14px] font-semibold leading-tight tracking-[-0.02em] text-[var(--color-ink)]"
                        >
                            <span className="truncate">{displayName}</span>
                            {tableNum && (
                                <span className="shrink-0 whitespace-nowrap text-[var(--color-ink-2)]">
                                    &nbsp;·&nbsp;{say("table")} {tableNum}
                                </span>
                            )}
                            <ChevronDown
                                className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-muted)]"
                                strokeWidth={2}
                            />
                        </Link>
                    </div>
                </div>
                <Link
                    href="/settings"
                    className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--color-divider)] bg-[var(--color-surface-alt)]"
                    aria-label={say("account")}
                >
                    <User className="h-[18px] w-[18px] text-[var(--color-ink-2)]" strokeWidth={2} />
                </Link>
            </header>

            <div className="px-4 pb-3.5 pt-1.5">
                <div className="flex h-11 items-center gap-2.5 rounded-[var(--radius-search)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)] px-3">
                    <Search
                        className="h-[17px] w-[17px] shrink-0 text-[var(--color-ink-muted)]"
                        strokeWidth={2}
                    />
                    <button
                        type="button"
                        onClick={openSearch}
                        className="flex-1 text-left text-[13.5px] tracking-[-0.01em] text-[var(--color-ink-muted)]"
                    >
                        {say("searchPlaceholder")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsQROpen(true)}
                        aria-label={say("scanQR")}
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-[var(--color-ink)] transition-transform duration-150 active:scale-95"
                    >
                        <QrCode className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                    </button>
                </div>
            </div>

            {isSearchOpen && (
                <HomeSearchOverlay
                    lang={lang}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    closeSearch={closeSearch}
                    recent={recent}
                    popularItems={popularItems}
                    searchResults={searchResults}
                    fullById={fullById}
                    openDetail={openDetail}
                    pushRecent={pushRecent}
                    restaurantIdFor={restaurantIdFor}
                />
            )}

            {detailItem && (
                <ItemDetailSheet
                    item={detailItem}
                    isOpen={!!detailItem}
                    onClose={() => setDetailItem(null)}
                    restaurantId={restaurantIdFor(detailItem)}
                />
            )}

            {isQROpen && <QRScanner isOpen={isQROpen} onClose={() => setIsQROpen(false)} />}
        </>
    );
}
