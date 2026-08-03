"use client";

import { useState } from "react";
import { MenuItemCard, type ClientMenuItem } from "./MenuItemCard";
import { CardAddControl } from "./CardAddControl";
import ItemDetailSheet from "./ItemDetailSheet";
import { useLanguage } from "@/context/LanguageContext";
import type { MenuItem } from "@/types/admin";

interface Props {
    /** Données d'affichage (une par carte), parallèles à `full`. */
    display: ClientMenuItem[];
    /** Plats complets (même ordre et même longueur que `display`). */
    full: MenuItem[];
    variant: "featured" | "list";
    containerClassName: string;
    /** Résout le restaurant d'un plat (Blu Table héberge plusieurs cartes). */
    restaurantIdFor: (item: MenuItem) => string;
}

/**
 * Relie les cartes plats de l'accueil au panier et à la fiche détail, comme sur
 * l'écran carte : le « + » ajoute un plat simple directement (ou ouvre la fiche
 * s'il y a des options), et taper la carte ouvre la fiche — sans quitter l'accueil.
 */
export function HomeItemsSection({
    display,
    full,
    variant,
    containerClassName,
    restaurantIdFor,
}: Props) {
    const { language } = useLanguage();
    const en = language === "en";
    const [selected, setSelected] = useState<MenuItem | null>(null);
    const selectedRestaurantId = selected ? restaurantIdFor(selected) : "";

    return (
        <>
            <div className={containerClassName}>
                {display.map((d, i) => {
                    const it = full[i];
                    if (!it) return null;
                    return (
                        <MenuItemCard
                            key={d.id}
                            item={d}
                            variant={variant}
                            onOpen={() => setSelected(it)}
                            addControl={
                                <CardAddControl
                                    item={it}
                                    restaurantId={restaurantIdFor(it)}
                                    onOpen={() => setSelected(it)}
                                    placement={variant === "featured" ? "photo" : "corner"}
                                    addLabel={en ? `Add ${d.name}` : `Ajouter ${d.name}`}
                                    decreaseLabel={en ? "Decrease quantity" : "Diminuer la quantité"}
                                    increaseLabel={en ? "Increase quantity" : "Augmenter la quantité"}
                                    removeLabel={en ? "Remove from cart" : "Retirer du panier"}
                                />
                            }
                        />
                    );
                })}
            </div>
            <ItemDetailSheet
                item={selected}
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                restaurantId={selectedRestaurantId}
            />
        </>
    );
}
