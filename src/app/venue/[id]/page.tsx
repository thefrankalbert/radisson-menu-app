import { redirect } from "next/navigation";
import { resolveVenueSlug, normalizeTableNumber } from "@/lib/venue-routing";

/**
 * Ancienne route « lieu », remplacée par `/menu/<slug>`.
 *
 * Plus rien n'y renvoie dans l'application, mais des liens partagés et des
 * favoris peuvent encore la viser : on redirige vers la carte correspondante
 * plutôt que de laisser une page à l'ancien habillage.
 */
export default async function VenueRedirectPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const [{ id }, query] = await Promise.all([params, searchParams]);

    const rawTable = query.table;
    const table = normalizeTableNumber(Array.isArray(rawTable) ? rawTable[0] : rawTable);
    const suffix = table ? `?table=${encodeURIComponent(table)}` : "";

    const slug = resolveVenueSlug(id);
    redirect(slug ? `/menu/${slug}${suffix}` : `/${suffix}`);
}
