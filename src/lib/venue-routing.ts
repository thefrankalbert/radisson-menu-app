/**
 * Correspondance entre le paramètre `?v=` des QR codes déjà imprimés et la carte
 * à ouvrir. Les QR encodent `https://theblutable.com/?v=<venue>&table=<n>`
 * (cf. src/app/admin/qrcodes/page.tsx) : ces codes sont sur les tables, on ne
 * peut pas les réimprimer, donc cette table de correspondance est un contrat.
 *
 * Historiquement seuls Panorama et Lobby recevaient un `v`. Les alias plus
 * larges couvrent les codes produits à la main et les valeurs alternatives que
 * l'ancien accueil acceptait déjà (`?restaurant=`, `?venue=`).
 */
const VENUE_TO_SLUG: Record<string, string> = {
    panorama: "carte-panorama-restaurant",
    "carte-panorama-restaurant": "carte-panorama-restaurant",
    tapas: "carte-panorama-restaurant",

    lobby: "carte-lobby-bar-snacks",
    "carte-lobby-bar-snacks": "carte-lobby-bar-snacks",
    "lobby-bar": "carte-lobby-bar-snacks",

    pool: "pool-bar",
    "pool-bar": "pool-bar",

    drinks: "carte-des-boissons",
    boissons: "carte-des-boissons",
    "carte-des-boissons": "carte-des-boissons",
};

/** Renvoie le slug de carte visé par un `?v=`, ou null si inconnu. */
export function resolveVenueSlug(value: string | null | undefined): string | null {
    if (!value) return null;
    const key = value.trim().toLowerCase();
    return VENUE_TO_SLUG[key] ?? null;
}

/** Numéro de table utilisable : mêmes bornes que la validation à la commande. */
export function normalizeTableNumber(value: string | null | undefined): string | null {
    if (!value) return null;
    const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 15);
    return cleaned.length > 0 ? cleaned : null;
}
