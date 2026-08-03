import { select, exitWith, dim, bold, formatPrice } from "./client.mjs";

/** Accents et casse ignorés : « creme » doit retrouver « Crème ». */
export function normalise(s) {
    return String(s ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");
}

const UUID_LIKE = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export const ITEM_COLUMNS =
    "id,name,name_en,description,description_en,price,image_url,is_available,is_featured,is_popular,category_id,restaurant_id";

/**
 * Retrouve UN plat à partir d'une référence libre : identifiant complet, début
 * d'identifiant, ou fragment de nom.
 *
 * Si plusieurs plats correspondent, la commande s'arrête et les affiche plutôt
 * que d'en choisir un : changer le mauvais prix passerait inaperçu.
 */
export async function resolveItem(ref) {
    if (!ref) exitWith("Il manque la référence du plat (identifiant ou fragment de nom).");

    if (UUID_LIKE.test(ref)) {
        const [item] = await select("menu_items", { select: ITEM_COLUMNS, id: `eq.${ref}` });
        if (!item) exitWith(`Aucun plat avec l'identifiant ${ref}.`);
        return item;
    }

    const all = await select("menu_items", { select: ITEM_COLUMNS });
    const needle = normalise(ref);
    const matches = all.filter(
        (i) =>
            i.id.startsWith(ref) ||
            normalise(i.name).includes(needle) ||
            normalise(i.name_en).includes(needle),
    );

    if (matches.length === 0) exitWith(`Aucun plat ne correspond à « ${ref} ».`);
    if (matches.length > 1) {
        console.error(`\n${matches.length} plats correspondent à « ${ref} » :\n`);
        for (const m of matches.slice(0, 15)) {
            console.error(`  ${dim(m.id.slice(0, 8))}  ${bold(m.name)}  ${formatPrice(m.price)}`);
        }
        if (matches.length > 15) console.error(dim(`  … et ${matches.length - 15} autres`));
        exitWith("Précisez la référence (identifiant ou début d'identifiant).");
    }
    return matches[0];
}

/** Retrouve une carte par slug exact ou fragment. */
export async function resolveMenu(ref) {
    const all = await select("restaurants", { select: "id,name,slug,is_active" });
    const needle = normalise(ref);
    const matches = all.filter(
        (r) => r.slug === ref || normalise(r.slug).includes(needle) || normalise(r.name).includes(needle),
    );

    if (matches.length === 0) {
        exitWith(
            `Aucune carte ne correspond à « ${ref} ».`,
            `Cartes disponibles : ${all.map((r) => r.slug).join(", ")}`,
        );
    }
    if (matches.length > 1) {
        exitWith(
            `Plusieurs cartes correspondent à « ${ref} » :`,
            matches.map((m) => `${m.slug} (${m.name})`).join(", "),
        );
    }
    return matches[0];
}

/** Retrouve une catégorie, éventuellement restreinte à une carte. */
export async function resolveCategory(ref, restaurantId) {
    const params = { select: "id,name,name_en,restaurant_id" };
    if (restaurantId) params.restaurant_id = `eq.${restaurantId}`;

    const all = await select("categories", params);
    const needle = normalise(ref);
    const matches = all.filter(
        (c) => c.id === ref || normalise(c.name).includes(needle) || normalise(c.name_en).includes(needle),
    );

    if (matches.length === 0) exitWith(`Aucune catégorie ne correspond à « ${ref} ».`);
    if (matches.length > 1) {
        exitWith(
            `Plusieurs catégories correspondent à « ${ref} » :`,
            matches.map((m) => `${m.name} (${m.id.slice(0, 8)})`).join(", "),
            "Ajoutez --menu <carte> pour lever l'ambiguïté.",
        );
    }
    return matches[0];
}

/** Analyse `--clé valeur` et `--drapeau`. Le reste devient positionnel. */
export function parseArgs(argv) {
    const flags = {};
    const positional = [];

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith("--")) {
            positional.push(arg);
            continue;
        }
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith("--")) {
            flags[key] = true;
        } else {
            flags[key] = next;
            i++;
        }
    }
    return { flags, positional };
}

/** Interprète on/off/oui/non ; renvoie null si ce n'en est pas un. */
export function parseOnOff(value) {
    const v = normalise(value);
    if (["on", "oui", "yes", "true", "1", "dispo"].includes(v)) return true;
    if (["off", "non", "no", "false", "0", "indispo"].includes(v)) return false;
    return null;
}

/** Même règle que l'application : un chemin « placeholder » ne vaut pas une photo. */
export function hasRealPhoto(url) {
    if (!url) return false;
    const lower = String(url).toLowerCase();
    return !lower.includes("placeholder") && !lower.includes("/default");
}
