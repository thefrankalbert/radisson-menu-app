"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Photo } from "./Photo";
import { Price } from "./Price";

export type ClientBadgeKind = "promo" | "new" | "popular" | "veg" | "spicy";

interface ClientBadge {
    kind: ClientBadgeKind;
    label: string;
}

export interface ClientMenuItem {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    price: number;
    oldPrice?: number | null;
    photoUrl?: string | null;
    badges?: ClientBadge[];
    isDrink?: boolean;
    isAvailable: boolean;
}

interface Props {
    item: ClientMenuItem;
    /** Cible de navigation (utilisée quand la carte n'est pas interactive). */
    href?: string;
    variant?: "list" | "featured";
    /** Mode interactif : taper la carte ouvre le détail du plat. */
    onOpen?: () => void;
    /** Contrôle « + » / stepper connecté au panier. Se positionne lui-même. */
    addControl?: ReactNode;
}

const PLUS_SHADOW =
    "shadow-[0_4px_6px_-1px_rgba(20,24,29,0.06),0_2px_4px_-2px_rgba(20,24,29,0.04)]";

export function MenuItemCard({ item, href, variant = "list", onOpen, addControl }: Props) {
    const interactive = typeof onOpen === "function";

    // L'affordance « + » : contrôle panier en mode interactif (il se positionne
    // lui-même), sinon un « + » décoratif sur les cartes de navigation.
    const plusSlot = (className: string) =>
        addControl ?? (
            <div
                aria-hidden
                className={`${className} flex items-center justify-center rounded-full bg-white ${PLUS_SHADOW}`}
            >
                <Plus className="h-[18px] w-[18px] text-[var(--color-ink)]" strokeWidth={2.6} />
            </div>
        );

    // Enveloppe : zone cliquable (interactif) ou lien de navigation. La carte
    // interactive reste un div onClick — jamais un bouton — pour ne pas imbriquer
    // le bouton « + » dans un autre élément interactif.
    const wrap = (className: string, children: ReactNode) =>
        interactive ? (
            <div onClick={onOpen} className={`${className} cursor-pointer`}>
                {children}
            </div>
        ) : (
            <Link href={href ?? "#"} className={className}>
                {children}
            </Link>
        );

    if (variant === "featured") {
        return wrap(
            "block w-[200px] shrink-0",
            <>
                <div className="relative h-[140px] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)]">
                    <Photo
                        src={item.photoUrl}
                        alt={item.name}
                        kind={item.isDrink ? "drink" : "food"}
                        fill
                        sizes="200px"
                    />
                    {item.badges?.[0] && (
                        <span className="absolute left-2 top-2">
                            <ItemBadge kind={item.badges[0].kind} label={item.badges[0].label} />
                        </span>
                    )}
                    {plusSlot("absolute bottom-2 right-2 h-[34px] w-[34px]")}
                </div>
                <div className="px-0.5 pt-2.5">
                    <div className="truncate text-[13.5px] font-semibold leading-[1.3] tracking-[-0.2px] text-[var(--color-ink)]">
                        {item.name}
                    </div>
                    <div className="mt-[5px] flex items-center gap-2">
                        <Price value={item.price} size={13.5} />
                    </div>
                </div>
            </>,
        );
    }

    return wrap(
        "flex items-stretch gap-3.5 border-b border-[var(--color-divider)] py-[15px]",
        <>
            <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                {item.badges && item.badges.length > 0 && (
                    <div className="flex flex-wrap items-center gap-[5px]">
                        {item.badges.map((b, i) => (
                            <ItemBadge key={i} kind={b.kind} label={b.label} />
                        ))}
                    </div>
                )}
                <div className="truncate text-[15.5px] font-semibold leading-[1.3] tracking-[-0.3px] text-[var(--color-ink)]">
                    {item.name}
                </div>
                {item.description && (
                    <p className="line-clamp-1 text-[12.5px] leading-[1.4] text-[var(--color-ink-muted)]">
                        {item.description}
                    </p>
                )}
                <div className="mt-auto flex items-center gap-2.5 pt-1">
                    <Price value={item.price} size={14.5} />
                    {item.oldPrice != null && (
                        <span className="text-[12.5px] tabular-nums text-[var(--color-ink-soft)] line-through">
                            <Price
                                value={item.oldPrice}
                                size={12.5}
                                className="font-normal text-[var(--color-ink-soft)]"
                                unitClassName="text-[var(--color-ink-soft)]"
                            />
                        </span>
                    )}
                </div>
            </div>
            <div className="relative shrink-0">
                <div className="relative h-[104px] w-[104px] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-divider)]">
                    <Photo
                        src={item.photoUrl}
                        alt={item.name}
                        kind={item.isDrink ? "drink" : "food"}
                        fill
                        sizes="104px"
                    />
                </div>
                {plusSlot("absolute -bottom-1.5 -right-1.5 h-[34px] w-[34px]")}
            </div>
        </>,
    );
}

const BADGE_CLASSES: Record<ClientBadgeKind, string> = {
    promo: "bg-[var(--color-promo)] text-white",
    popular: "bg-[var(--color-warning-bg)] text-[var(--color-warning-fg)]",
    new: "bg-[var(--color-brand-light)] text-[var(--color-brand)]",
    veg: "bg-[#eaf5ee] text-[var(--color-success)]",
    spicy: "bg-[#fdeeec] text-[var(--color-promo)]",
};

function ItemBadge({ kind, label }: { kind: ClientBadgeKind; label: string }) {
    return (
        <span
            className={`${BADGE_CLASSES[kind]} inline-flex items-center rounded-[var(--radius-tag)] px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.1px]`}
        >
            {label}
        </span>
    );
}
