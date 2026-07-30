"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Category {
    id: string;
    name: string;
}

const OBSERVER_OPTIONS: IntersectionObserverInit = {
    rootMargin: "-170px 0px -55% 0px",
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
};

/** header 63 + chips 48 + barre de titre ~58 : le haut de section atterrit
 *  juste sous la pile collante (cf. `scroll-mt-[170px]` des sections). */
const STICKY_OFFSET = 169;

interface CategoryNavProps {
    categories: Category[];
    /** Décalage haut (px) où les pastilles deviennent collantes. */
    topOffset?: number;
    /** Notifié à chaque changement de catégorie active (clic ou scroll-spy). */
    onActiveChange?: (categoryId: string) => void;
}

export function CategoryNav({ categories, topOffset = 0, onActiveChange }: CategoryNavProps) {
    const [activeCategory, setActiveCategory] = useState<string>("");
    const scrollerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
    // Vrai pendant un défilement déclenché par un clic sur pastille : le
    // scroll-spy ne doit pas reprendre la main (il clignoterait à travers les
    // sections traversées). Relâché au premier vrai geste de l'utilisateur.
    const programmaticScrollRef = useRef(false);
    const scrollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearScrollTimers = useCallback(() => {
        scrollTimersRef.current.forEach(clearTimeout);
        scrollTimersRef.current = [];
    }, []);

    useEffect(() => clearScrollTimers, [clearScrollTimers]);

    useEffect(() => {
        if (activeCategory) onActiveChange?.(activeCategory);
    }, [activeCategory, onActiveChange]);

    // Un défilement programmatique n'émet ni wheel ni touchstart : ces deux
    // signaux veulent donc dire « l'utilisateur a repris la main ».
    useEffect(() => {
        const scroller = document.getElementById("main-content");
        if (!scroller) return;
        const release = () => {
            programmaticScrollRef.current = false;
            clearScrollTimers();
        };
        scroller.addEventListener("wheel", release, { passive: true });
        scroller.addEventListener("touchstart", release, { passive: true });
        return () => {
            scroller.removeEventListener("wheel", release);
            scroller.removeEventListener("touchstart", release);
        };
    }, [clearScrollTimers]);

    // Recentre la pastille active dans son rail horizontal.
    useEffect(() => {
        const activeButton = buttonRefs.current.get(activeCategory);
        const container = scrollerRef.current;
        if (!activeButton || !container) return;
        container.scrollTo({
            left: activeButton.offsetLeft - container.offsetWidth / 2 + activeButton.offsetWidth / 2,
            behavior: "smooth",
        });
    }, [activeCategory]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (programmaticScrollRef.current) return;

            let bestEntry: IntersectionObserverEntry | null = null;
            let bestRatio = 0;
            entries.forEach((entry) => {
                if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
                    bestRatio = entry.intersectionRatio;
                    bestEntry = entry;
                }
            });

            if (bestEntry) {
                setActiveCategory((bestEntry as IntersectionObserverEntry).target.id.replace("cat-", ""));
            }
        }, OBSERVER_OPTIONS);

        categories.forEach((category) => {
            const element = document.getElementById(`cat-${category.id}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories]);

    const scrollToCategory = (id: string) => {
        setActiveCategory(id);
        programmaticScrollRef.current = true;
        clearScrollTimers();

        // Les ancres de section sont loin dans une liste d'images chargées
        // paresseusement : à mesure qu'elles se décodent, la position de la cible
        // continue de descendre et un saut unique tombe trop court. On réapplique
        // la correction sur quelques minuteries, le temps que la mise en page se
        // stabilise.
        const alignOnce = () => {
            const scroller = document.getElementById("main-content");
            const element = document.getElementById(`cat-${id}`);
            if (!scroller || !element) return;
            const delta = element.getBoundingClientRect().top - STICKY_OFFSET;
            const maxTop = scroller.scrollHeight - scroller.clientHeight;
            scroller.scrollTop = Math.max(0, Math.min(scroller.scrollTop + delta, maxTop));
        };

        alignOnce();
        scrollTimersRef.current = [60, 180, 360, 650, 1000].map((ms) => setTimeout(alignOnce, ms));
    };

    if (categories.length === 0) return null;

    return (
        <div
            className="scrollbar-hide sticky z-30 flex h-12 items-center border-b border-[var(--color-divider)] bg-white"
            style={{ top: topOffset }}
        >
            <div
                ref={scrollerRef}
                className="scrollbar-hide flex w-full items-center gap-1.5 overflow-x-auto px-4"
            >
                {categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                        <button
                            key={category.id}
                            type="button"
                            ref={(el) => {
                                if (el) buttonRefs.current.set(category.id, el);
                                else buttonRefs.current.delete(category.id);
                            }}
                            onClick={() => scrollToCategory(category.id)}
                            aria-current={isActive ? "true" : undefined}
                            className={`shrink-0 whitespace-nowrap rounded-[var(--radius-pill)] border px-[15px] py-2 text-[13px] font-medium leading-[1.4] tracking-[-0.1px] transition-colors duration-150 active:scale-[0.98] ${
                                isActive
                                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                                    : "border-[var(--color-divider)] bg-white text-[var(--color-ink-2)]"
                            }`}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
