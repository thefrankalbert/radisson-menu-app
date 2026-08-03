import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MenuScreen } from "@/components/client/MenuScreen";
import { MenuRealtimeRefresh } from "@/components/client/MenuRealtimeRefresh";
import { loadMenuData, loadActiveMenuSlugs } from "@/lib/menu-data";
import { APP_CONFIG } from "@/lib/constants";

// Chaque carte est mise en cache et régénérée toutes les 60s. Auparavant la page
// était rendue côté client : le téléphone téléchargeait le JS, puis enchaînait
// trois requêtes Supabase (carte → catégories → plats) avant d'afficher quoi que
// ce soit. Le convive qui scanne attendait ce cycle complet à chaque ouverture.
export const revalidate = 60;

/** Pré-génère les cartes connues : la page arrive déjà construite après un scan. */
export async function generateStaticParams() {
    const slugs = await loadActiveMenuSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const data = await loadMenuData(slug);
    if (!data) return { title: `${APP_CONFIG.name} | ${APP_CONFIG.hotel}` };

    return {
        title: `${data.restaurant.name} | ${APP_CONFIG.name}`,
        description: `Consultez la carte ${data.restaurant.name} du ${APP_CONFIG.hotel} et commandez depuis votre table.`,
    };
}

export default async function MenuDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const data = await loadMenuData(slug);

    if (!data) notFound();

    return (
        <>
            <MenuScreen
                restaurantName={data.restaurant.name}
                restaurantNameEn={data.restaurant.name_en}
                restaurantId={data.restaurant.id}
                categories={data.categories}
                items={data.items}
            />
            <MenuRealtimeRefresh slug={slug} />
        </>
    );
}
