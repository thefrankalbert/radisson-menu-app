"use client";

import useSWR from "swr";
import { use, useEffect, useMemo } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { MenuScreen } from "@/components/client/MenuScreen";
import { MenuScreenSkeleton } from "@/components/client/MenuScreenSkeleton";
import type { MenuItem, Category, Restaurant } from "@/types/admin";

interface MenuPageProps {
    params: Promise<{ slug: string }>;
}

interface MenuData {
    restaurant: Restaurant;
    categories: Category[];
    items: MenuItem[];
}

/** Colonnes réellement présentes sur `menu_items` (cf. types/admin.ts).
 *  Nommer une colonne absente fait échouer la requête entière en 400. */
const MENU_ITEM_COLUMNS = `id, name, name_en, description, description_en, price, image_url,
    is_available, is_featured, is_popular, dietary_flags, preparation_time,
    category_id, restaurant_id, display_order, created_at,
    options:item_options(*),
    price_variants:item_price_variants(*)`;

const fetchMenuData = async (slug: string): Promise<MenuData> => {
    const { data: restaurant, error: resError } = await supabase
        .from("restaurants")
        .select("id, name, name_en, slug, image_url, is_active, created_at")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

    if (resError || !restaurant) throw new Error("Restaurant introuvable");

    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, name_en, restaurant_id, display_order, created_at")
        .eq("restaurant_id", restaurant.id)
        .order("display_order", { ascending: true });

    const categoryIds = (categories ?? []).map((c: Category) => c.id);
    let items: MenuItem[] = [];

    if (categoryIds.length > 0) {
        // Les options et variantes arrivent dans la même requête : trois allers-
        // retours séquentiels faisaient clignoter la fiche détail à l'ouverture.
        const { data, error } = await supabase
            .from("menu_items")
            .select(MENU_ITEM_COLUMNS)
            .in("category_id", categoryIds)
            .order("display_order", { ascending: true });

        if (error) throw new Error(error.message);
        items = (data ?? []) as unknown as MenuItem[];
    }

    return {
        restaurant: restaurant as Restaurant,
        categories: (categories ?? []) as Category[],
        items,
    };
};

export default function MenuDetailPage({ params }: MenuPageProps) {
    const { slug } = use(params);
    const searchParams = useSearchParams();
    const { setLastVisitedMenuUrl } = useCart();

    const { data, error, isLoading, mutate } = useSWR<MenuData>(
        slug ? `menu-${slug}` : null,
        () => fetchMenuData(slug),
        {
            revalidateOnFocus: false, // le realtime ci-dessous couvre les mises à jour
            revalidateOnReconnect: true,
            dedupingInterval: 60000,
            errorRetryCount: 2,
            keepPreviousData: true,
            onError: () => toast.error("Une erreur est survenue lors du chargement de la carte."),
        },
    );

    // L'onglet « Carte » de la barre du bas revient sur la dernière carte vue.
    useEffect(() => {
        if (slug) setLastVisitedMenuUrl(`/menu/${slug}`);
    }, [slug, setLastVisitedMenuUrl]);

    useEffect(() => {
        if (!slug) return;
        const channel = supabase
            .channel(`menu-sync-${slug}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => mutate())
            .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => mutate())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [slug, mutate]);

    const categories = useMemo(() => data?.categories ?? [], [data?.categories]);

    // `?section=` porte un nom de catégorie (lien depuis les tuiles de l'accueil).
    const sectionName = searchParams.get("section");
    const initialCategoryId = useMemo(() => {
        if (!sectionName) return null;
        const match = categories.find(
            (c) =>
                c.name.toLowerCase() === sectionName.toLowerCase() ||
                c.name_en?.toLowerCase() === sectionName.toLowerCase(),
        );
        return match?.id ?? null;
    }, [sectionName, categories]);

    if (error) return notFound();
    if (isLoading && !data) return <MenuScreenSkeleton />;
    if (!data) return null;

    return (
        <MenuScreen
            restaurantName={data.restaurant.name}
            restaurantNameEn={data.restaurant.name_en}
            restaurantId={data.restaurant.id}
            categories={categories}
            items={data.items}
            initialCategoryId={initialCategoryId}
        />
    );
}
