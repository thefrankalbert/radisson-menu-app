import type { MenuItem, DietaryFlag } from "@/types/admin";

/**
 * Les régimes sont stockés dans un tableau `dietary_flags` libre, alimenté par
 * l'admin : les valeurs arrivent tantôt en anglais, tantôt en français, avec ou
 * sans accents. On normalise plutôt que d'exiger une casse exacte.
 */
function normalizeFlag(flag: DietaryFlag): string {
    return String(flag)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[\s_-]+/g, "");
}

const MATCHERS = {
    vegetarian: ["vegetarian", "vegetarien", "veggie", "vegan", "vegetalien"],
    spicy: ["spicy", "epice", "piquant", "hot", "pimente"],
    glutenFree: ["glutenfree", "sansgluten"],
} as const;

export type DietaryKind = keyof typeof MATCHERS;

export function hasDietaryFlag(item: Pick<MenuItem, "dietary_flags">, kind: DietaryKind): boolean {
    const flags = item.dietary_flags;
    if (!Array.isArray(flags) || flags.length === 0) return false;
    const normalized = flags.map(normalizeFlag);
    return MATCHERS[kind].some((needle) => normalized.some((f) => f.includes(needle)));
}
