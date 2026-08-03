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

/** Slug de la carte des boissons — commune à tous les points de vente. */
export const DRINKS_SLUG = "carte-des-boissons";

/**
 * Groupes de cartes servis ensemble à une même table (repris de l'ancien
 * VENUE_CONFIG). Le convive assis à une table Panorama ne doit voir que la carte
 * Panorama ; à une table Lobby ou Pool, les deux (elles partagent l'espace).
 * Les Boissons s'ajoutent partout, elles sont communes.
 */
const RESTAURANT_GROUPS: string[][] = [
    ["carte-panorama-restaurant"],
    ["carte-lobby-bar-snacks", "pool-bar"],
];

/**
 * Cartes à proposer quand le convive est arrivé par le QR d'une table donnée :
 * son groupe + les Boissons. Renvoie null si le lieu est inconnu (on montre
 * alors tout, comme une visite directe de l'accueil).
 */
export function venueGroupSlugs(venueSlug: string | null | undefined): string[] | null {
    if (!venueSlug) return null;
    if (venueSlug === DRINKS_SLUG) return [DRINKS_SLUG];

    const group = RESTAURANT_GROUPS.find((g) => g.includes(venueSlug));
    if (!group) return null;
    return [...group, DRINKS_SLUG];
}

/** Extrait le slug de carte d'une URL `/menu/<slug>` (dernière carte visitée). */
export function slugFromMenuUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    const m = url.match(/^\/menu\/([a-z0-9-]+)/i);
    return m ? m[1] : null;
}

/** Numéro de table utilisable : mêmes bornes que la validation à la commande. */
export function normalizeTableNumber(value: string | null | undefined): string | null {
    if (!value) return null;
    const cleaned = value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 15);
    return cleaned.length > 0 ? cleaned : null;
}
