"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { CartItem } from "@/context/CartContext";
import type { UpsellItem } from "./UpsellSection";

interface CartRecommendation {
    type: "drinks" | "desserts" | "mains";
    title: { fr: string; en: string };
    searchQuery: string;
}

/**
 * Suggère la suite logique du repas d'après ce qui est déjà au panier :
 * un plat sans boisson appelle une boisson, un repas complet appelle un dessert.
 * La détection se fait sur le nom de catégorie ET sur le nom du plat, car
 * toutes les cartes ne nomment pas leurs catégories de la même façon.
 */
export function useCartUpsell(items: CartItem[], currentRestaurantId: string | null) {
    const [upsellItems, setUpsellItems] = useState<UpsellItem[]>([]);
    const [recommendation, setRecommendation] = useState<CartRecommendation | null>(null);

    const cartAnalysis = useMemo(() => {
        const has = (categoryPattern: RegExp, namePattern: RegExp) =>
            items.some(
                (item) =>
                    item.category_name?.toLowerCase().match(categoryPattern) ||
                    item.name.toLowerCase().match(namePattern),
            );

        return {
            hasMain: has(
                /plat|main|spécialité|grillade|burgers/,
                /riz|brochette|burger|filet|entrecôte|poulet|poisson|braisé|pâtes|pasta/,
            ),
            hasDrinks: has(
                /boisson|drink|cocktail|wine|vin|coffee|cafe|thé|tea|soft|soda|bière|beer/,
                /coca|fanta|sprite|eau|water|jus|juice|bière|beer|vin|wine|cocktail|soda|café|coffee|thé|tea|tonic|ginger/,
            ),
            hasDesserts: has(
                /dessert|glace|sucre|sweet|fruit|pâtisserie/,
                /dessert|glace|ice cream|gâteau|cake|crème|cream|fruit|tarte|mousse|fondant|tiramisu|salade de fruit/,
            ),
            hasStarters: has(
                /entrée|starter|snack|tapas|apéritif/,
                /entrée|starter|salade|soup|velouté|nems|samoussa/,
            ),
        };
    }, [items]);

    const itemCount = items.length;

    useEffect(() => {
        let cancelled = false;

        const reset = () => {
            if (cancelled) return;
            setRecommendation(null);
            setUpsellItems([]);
        };

        const run = async () => {
            if (!currentRestaurantId || itemCount === 0) return reset();

            const { hasMain, hasDrinks, hasDesserts, hasStarters } = cartAnalysis;
            let reco: CartRecommendation | null = null;

            if (hasMain && !hasDrinks) {
                reco = {
                    type: "drinks",
                    title: { fr: "Une boisson fraîche ?", en: "A fresh drink?" },
                    searchQuery: "boisson",
                };
            } else if (hasMain && hasDrinks && !hasDesserts) {
                reco = {
                    type: "desserts",
                    title: { fr: "Une petite douceur ?", en: "Something sweet?" },
                    searchQuery: "dessert",
                };
            } else if (hasStarters && !hasMain) {
                reco = {
                    type: "mains",
                    title: { fr: "Un plat de résistance ?", en: "A main course?" },
                    searchQuery: "plat",
                };
            } else if (hasMain && hasDrinks && hasDesserts) {
                reco = {
                    type: "drinks",
                    title: { fr: "Un dernier verre ?", en: "One last drink?" },
                    searchQuery: "boisson",
                };
            }

            if (!reco) return reset();

            try {
                const { data: currentResto } = await supabase
                    .from("restaurants")
                    .select("slug")
                    .eq("id", currentRestaurantId)
                    .single();

                const slug: string = currentResto?.slug ?? "";
                const searchRestaurantIds = [currentRestaurantId];

                // Panorama et Lobby n'ont pas de carte boissons : elle est portée
                // par une carte séparée, qu'il faut donc inclure dans la recherche.
                if (slug.includes("panorama") || slug.includes("lobby")) {
                    const { data: drinksResto } = await supabase
                        .from("restaurants")
                        .select("id")
                        .eq("slug", "carte-des-boissons")
                        .single();
                    if (drinksResto && !searchRestaurantIds.includes(drinksResto.id)) {
                        searchRestaurantIds.push(drinksResto.id);
                    }
                }

                let categoryQuery = supabase
                    .from("categories")
                    .select("id, name, name_en, restaurants!inner(id, slug)")
                    .in("restaurants.id", searchRestaurantIds);

                if (reco.type === "drinks") {
                    categoryQuery = categoryQuery.or(
                        "name.ilike.%boisson%,name.ilike.%soda%,name.ilike.%jus%,name.ilike.%bière%,name.ilike.%vin%,name.ilike.%cocktail%,name.ilike.%spiritueux%",
                    );
                } else if (reco.type === "desserts") {
                    categoryQuery = categoryQuery.or(
                        "name.ilike.%dessert%,name.ilike.%douceur%,name.ilike.%glace%,name.ilike.%fruit%",
                    );
                } else {
                    categoryQuery = categoryQuery.ilike("name", `%${reco.searchQuery}%`);
                }

                const { data: categories } = await categoryQuery;
                if (!categories || categories.length === 0) return reset();

                const { data: menuItems } = await supabase
                    .from("menu_items")
                    .select("id, name, name_en, price, image_url, category_id, categories(name)")
                    .in(
                        "category_id",
                        categories.map((c: { id: string }) => c.id),
                    )
                    .eq("is_available", true)
                    .limit(6);

                if (cancelled) return;

                setRecommendation(reco);
                setUpsellItems(
                    (menuItems ?? []).map((mi: Record<string, unknown>) => ({
                        id: mi.id as string,
                        name: mi.name as string,
                        name_en: mi.name_en as string | undefined,
                        price: mi.price as number,
                        image_url: mi.image_url as string | undefined,
                        category_name: (mi.categories as { name?: string } | null)?.name,
                    })),
                );
            } catch {
                // Les suggestions sont un bonus : leur échec ne doit jamais
                // empêcher de passer commande.
                reset();
            }
        };

        void run();
        return () => {
            cancelled = true;
        };
    }, [currentRestaurantId, itemCount, cartAnalysis]);

    return { upsellItems, recommendation };
}
