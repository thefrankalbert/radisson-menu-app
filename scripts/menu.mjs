#!/usr/bin/env node
/**
 * Gestion de la carte Blu Table depuis le terminal.
 *
 *   npm run menu -- <commande> [options]
 *
 * Les lectures se contentent de la clé anon. Les écritures exigent
 * SUPABASE_SERVICE_ROLE_KEY, fournie le temps de la commande — voir `help`.
 *
 * Toute écriture affiche l'avant/après et demande confirmation, sauf `--yes`.
 * `--dry-run` montre l'effet sans rien changer.
 */
import { createInterface } from "node:readline/promises";
import {
    select,
    update,
    exitWith,
    table,
    formatPrice,
    bold,
    dim,
    green,
    yellow,
    red,
    cyan,
    serviceKey,
} from "./lib/client.mjs";
import {
    resolveItem,
    resolveMenu,
    resolveCategory,
    parseArgs,
    parseOnOff,
    normalise,
    hasRealPhoto,
    ITEM_COLUMNS,
} from "./lib/resolve.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const command = positional[0];
const DRY = Boolean(flags["dry-run"]);
const ASSUME_YES = Boolean(flags.yes || flags.y);

// --- Garde-fou commun -----------------------------------------------------

async function confirm(question) {
    if (ASSUME_YES) return true;
    if (!process.stdin.isTTY) {
        exitWith("Confirmation impossible hors terminal interactif. Ajoutez --yes si c'est voulu.");
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(`${yellow("?")} ${question} ${dim("[o/N]")} `);
    rl.close();
    return ["o", "oui", "y", "yes"].includes(normalise(answer.trim()));
}

/** Applique une modification après avoir montré l'écart et demandé l'accord. */
async function applyChange({ label, before, after, run }) {
    // Vérifié avant d'afficher quoi que ce soit : inutile de faire confirmer une
    // modification qui échouera faute de clé.
    if (!DRY) serviceKey();

    console.log(`\n  ${dim("avant")}  ${before}`);
    console.log(`  ${dim("après")}  ${bold(after)}\n`);

    if (DRY) {
        console.log(`${cyan("→")} ${dim("--dry-run : rien n'a été modifié.")}\n`);
        return;
    }
    if (!(await confirm(label))) {
        console.log(`${dim("Annulé, rien n'a été modifié.")}\n`);
        return;
    }

    const rows = await run();
    if (!Array.isArray(rows) || rows.length === 0) {
        exitWith(
            "Aucune ligne n'a été modifiée.",
            "La clé de service est-elle correcte ? Les politiques RLS bloquent la clé anon en écriture.",
        );
    }

    console.log(`${green("✓")} ${rows.length} ligne${rows.length > 1 ? "s" : ""} enregistrée${rows.length > 1 ? "s" : ""}.\n`);
    console.log(dim("  La carte publique se régénère dans la minute (cache 60s)."));
    console.log(dim("  Les téléphones déjà ouverts dessus se rafraîchissent aussitôt.\n"));
}

// --- Lecture --------------------------------------------------------------

async function cmdMenus() {
    const [restaurants, items] = await Promise.all([
        select("restaurants", { select: "id,name,slug,is_active", order: "created_at" }),
        select("menu_items", { select: "id,restaurant_id,is_available" }),
    ]);

    const rows = restaurants.map((r) => {
        const own = items.filter((i) => i.restaurant_id === r.id);
        return {
            slug: r.slug,
            name: r.name,
            active: r.is_active === false ? red("non") : "oui",
            total: own.length,
            off: own.filter((i) => i.is_available === false).length,
        };
    });

    console.log(`\n${bold("Cartes")}\n`);
    table(rows, [
        { header: "SLUG", value: (r) => r.slug },
        { header: "NOM", value: (r) => r.name },
        { header: "ACTIVE", value: (r) => r.active },
        { header: "PLATS", value: (r) => r.total },
        { header: "INDISPO", value: (r) => (r.off > 0 ? red(r.off) : "0") },
    ]);
    console.log();
}

async function cmdCategories() {
    const restaurantId = flags.menu ? (await resolveMenu(flags.menu)).id : null;

    const params = { select: "id,name,name_en,restaurant_id,display_order", order: "display_order" };
    if (restaurantId) params.restaurant_id = `eq.${restaurantId}`;

    const [categories, restaurants, items] = await Promise.all([
        select("categories", params),
        select("restaurants", { select: "id,slug" }),
        select("menu_items", { select: "category_id,is_available" }),
    ]);

    const slugOf = Object.fromEntries(restaurants.map((r) => [r.id, r.slug]));

    console.log(`\n${bold("Catégories")}\n`);
    table(categories, [
        { header: "CATÉGORIE", value: (c) => c.name },
        { header: "EN", value: (c) => c.name_en ?? dim("—") },
        { header: "CARTE", value: (c) => slugOf[c.restaurant_id] ?? "?" },
        { header: "PLATS", value: (c) => items.filter((i) => i.category_id === c.id).length },
    ]);
    console.log();
}

async function cmdList() {
    const params = { select: ITEM_COLUMNS, order: "display_order" };

    if (flags.menu) params.restaurant_id = `eq.${(await resolveMenu(flags.menu)).id}`;
    if (flags.category) {
        const restaurantId = flags.menu ? (await resolveMenu(flags.menu)).id : null;
        params.category_id = `eq.${(await resolveCategory(flags.category, restaurantId)).id}`;
    }
    if (flags.unavailable) params.is_available = "eq.false";
    else if (flags.available) params.is_available = "eq.true";

    let rows = await select("menu_items", params);

    if (typeof flags.search === "string") {
        const needle = normalise(flags.search);
        rows = rows.filter(
            (i) => normalise(i.name).includes(needle) || normalise(i.name_en).includes(needle),
        );
    }

    const categories = await select("categories", { select: "id,name" });
    const categoryOf = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    console.log(`\n${bold(`${rows.length} plat${rows.length > 1 ? "s" : ""}`)}\n`);
    table(rows, [
        { header: "ID", value: (i) => dim(i.id.slice(0, 8)) },
        { header: "PLAT", value: (i) => i.name },
        { header: "CATÉGORIE", value: (i) => categoryOf[i.category_id] ?? "?" },
        { header: "PRIX", value: (i) => formatPrice(i.price) },
        { header: "DISPO", value: (i) => (i.is_available === false ? red("non") : green("oui")) },
        { header: "PHOTO", value: (i) => (hasRealPhoto(i.image_url) ? "oui" : dim("—")) },
    ]);
    console.log();
}

async function cmdShow() {
    const item = await resolveItem(positional[1]);
    const [categories, restaurants] = await Promise.all([
        select("categories", { select: "id,name", id: `eq.${item.category_id}` }),
        select("restaurants", { select: "id,name,slug", id: `eq.${item.restaurant_id}` }),
    ]);

    const line = (k, v) => console.log(`  ${dim(k.padEnd(14))} ${v}`);
    console.log(`\n${bold(item.name)}\n`);
    line("identifiant", item.id);
    line("nom (en)", item.name_en ?? dim("—"));
    line("description", item.description ?? dim("—"));
    line("descr. (en)", item.description_en ?? dim("—"));
    line("prix", formatPrice(item.price));
    line("catégorie", categories[0]?.name ?? "?");
    line("carte", restaurants[0] ? `${restaurants[0].name} (${restaurants[0].slug})` : "?");
    line("disponible", item.is_available === false ? red("non") : green("oui"));
    line("mis en avant", item.is_featured ? "oui" : "non");
    line("populaire", item.is_popular ? "oui" : "non");
    line("photo", hasRealPhoto(item.image_url) ? item.image_url : dim("aucune"));
    console.log();
}

// --- Écriture -------------------------------------------------------------

async function cmdAvailable() {
    const state = parseOnOff(positional[2]);
    if (state === null) exitWith("Précisez l'état : `available <plat> on` ou `off`.");

    const item = await resolveItem(positional[1]);
    if (item.is_available === state) {
        console.log(`\n${dim(`« ${item.name} » est déjà ${state ? "disponible" : "indisponible"}.`)}\n`);
        return;
    }

    await applyChange({
        label: `Passer « ${item.name} » en ${state ? "disponible" : "INDISPONIBLE"} ?`,
        before: `${item.name} — ${item.is_available === false ? red("indisponible") : green("disponible")}`,
        after: `${item.name} — ${state ? green("disponible") : red("indisponible")}`,
        run: () => update("menu_items", { id: `eq.${item.id}` }, { is_available: state }),
    });
}

async function cmdBulkAvailable() {
    const state = parseOnOff(positional[1]);
    if (state === null) {
        exitWith("Précisez l'état : `bulk-available on` ou `off`, avec --menu ou --category.");
    }
    if (!flags.menu && !flags.category) {
        exitWith("Précisez la portée : --menu <carte> ou --category <catégorie>.");
    }

    const params = { select: "id,name,is_available" };
    let scope;

    if (flags.menu) {
        const menu = await resolveMenu(flags.menu);
        params.restaurant_id = `eq.${menu.id}`;
        scope = `la carte « ${menu.name} »`;
    }
    if (flags.category) {
        const restaurantId = flags.menu ? (await resolveMenu(flags.menu)).id : null;
        const category = await resolveCategory(flags.category, restaurantId);
        params.category_id = `eq.${category.id}`;
        scope = `la catégorie « ${category.name} »`;
    }

    const rows = await select("menu_items", params);
    const toChange = rows.filter((i) => (i.is_available !== false) !== state);

    if (toChange.length === 0) {
        console.log(
            `\n${dim(`Tous les plats de ${scope} sont déjà ${state ? "disponibles" : "indisponibles"}.`)}\n`,
        );
        return;
    }

    console.log(`\n${bold(`${toChange.length} plat${toChange.length > 1 ? "s" : ""}`)} de ${scope} :\n`);
    for (const i of toChange.slice(0, 20)) console.log(`  ${i.name}`);
    if (toChange.length > 20) console.log(dim(`  … et ${toChange.length - 20} autres`));

    await applyChange({
        label: `Passer ces ${toChange.length} plats en ${state ? "disponible" : "INDISPONIBLE"} ?`,
        before: `${toChange.length} plats de ${scope}`,
        after: `tous ${state ? green("disponibles") : red("indisponibles")}`,
        run: () =>
            update("menu_items", { id: `in.(${toChange.map((i) => i.id).join(",")})` }, { is_available: state }),
    });
}

async function cmdPrice() {
    const price = Number(positional[2]);
    if (!Number.isFinite(price) || price < 0) {
        exitWith("Le prix doit être un nombre positif, en FCFA : `price <plat> 12000`.");
    }

    const item = await resolveItem(positional[1]);
    await applyChange({
        label: `Changer le prix de « ${item.name} » ?`,
        before: `${item.name} — ${formatPrice(item.price)}`,
        after: `${item.name} — ${formatPrice(price)}`,
        run: () => update("menu_items", { id: `eq.${item.id}` }, { price }),
    });
}

async function cmdRename() {
    const item = await resolveItem(positional[1]);

    const patch = {};
    if (typeof flags.fr === "string") patch.name = flags.fr;
    if (typeof flags.en === "string") patch.name_en = flags.en;
    if (Object.keys(patch).length === 0) exitWith("Indiquez au moins --fr « nom » et/ou --en « name ».");

    await applyChange({
        label: `Renommer « ${item.name} » ?`,
        before: `${item.name}${item.name_en ? dim(` / ${item.name_en}`) : ""}`,
        after: `${patch.name ?? item.name}${
            (patch.name_en ?? item.name_en) ? dim(` / ${patch.name_en ?? item.name_en}`) : ""
        }`,
        run: () => update("menu_items", { id: `eq.${item.id}` }, patch),
    });
}

async function cmdDescribe() {
    const item = await resolveItem(positional[1]);

    const patch = {};
    if (typeof flags.fr === "string") patch.description = flags.fr;
    if (typeof flags.en === "string") patch.description_en = flags.en;
    if (Object.keys(patch).length === 0) {
        exitWith("Indiquez au moins --fr « description » et/ou --en « description ».");
    }

    await applyChange({
        label: `Modifier la description de « ${item.name} » ?`,
        before: item.description ?? dim("(aucune)"),
        after: patch.description ?? item.description ?? dim("(aucune)"),
        run: () => update("menu_items", { id: `eq.${item.id}` }, patch),
    });
}

async function cmdPhoto() {
    const item = await resolveItem(positional[1]);
    const url = positional[2];
    if (!url) exitWith("Indiquez une URL, ou `none` pour retirer la photo.");

    const clearing = ["none", "aucune"].includes(normalise(url));
    if (!clearing && !/^https?:\/\//i.test(url)) {
        exitWith(
            "L'URL doit être absolue (https://…).",
            "Les chemins relatifs comme /images/x.jpg ne sont pas servis par l'application :",
            "c'est exactement ce qui laissait tous les plats sans photo.",
        );
    }

    await applyChange({
        label: clearing ? `Retirer la photo de « ${item.name} » ?` : `Changer la photo de « ${item.name} » ?`,
        before: hasRealPhoto(item.image_url) ? item.image_url : dim("aucune"),
        after: clearing ? dim("aucune (visuel de repli ivoire)") : url,
        run: () => update("menu_items", { id: `eq.${item.id}` }, { image_url: clearing ? null : url }),
    });
}

async function cmdFeature() {
    const state = parseOnOff(positional[2]);
    if (state === null) exitWith("Précisez l'état : `feature <plat> on` ou `off`.");

    const item = await resolveItem(positional[1]);
    await applyChange({
        label: `${state ? "Mettre en avant" : "Retirer de la mise en avant"} « ${item.name} » ?`,
        before: `mis en avant : ${item.is_featured ? "oui" : "non"}`,
        after: `mis en avant : ${state ? "oui" : "non"}`,
        run: () => update("menu_items", { id: `eq.${item.id}` }, { is_featured: state }),
    });
}

// --- Aide -----------------------------------------------------------------

function cmdHelp() {
    console.log(`
${bold("Gestion de la carte Blu Table")}

  ${dim("npm run menu -- <commande> [options]")}

${bold("Lecture")} ${dim("(aucune clé secrète nécessaire)")}
  menus                              Cartes, nombre de plats, indisponibles
  categories [--menu <carte>]        Catégories
  list [filtres]                     Plats
       --menu <carte>                  restreint à une carte
       --category <catégorie>          restreint à une catégorie
       --search <texte>                filtre sur le nom
       --unavailable | --available     filtre sur la disponibilité
  show <plat>                        Fiche complète d'un plat

${bold("Écriture")} ${dim("(SUPABASE_SERVICE_ROLE_KEY requise)")}
  available <plat> on|off            Disponibilité d'un plat
  bulk-available on|off --menu <c>   Disponibilité de toute une carte
  bulk-available on|off --category <c>  … ou de toute une catégorie
  price <plat> <montant>             Prix en FCFA
  rename <plat> --fr <nom> [--en <name>]
  describe <plat> --fr <texte> [--en <text>]
  photo <plat> <url|none>            Photo (URL absolue)
  feature <plat> on|off              Mise en avant sur l'accueil

${bold("Options globales")}
  --dry-run                          Montre l'effet sans rien modifier
  --yes                              Sans demander confirmation

${bold("Référence d'un plat")}
  Identifiant complet, début d'identifiant, ou fragment de nom.
  Si plusieurs plats correspondent, la commande s'arrête et les liste.

${bold("Exemples")}
  ${dim("npm run menu -- menus")}
  ${dim("npm run menu -- list --menu panorama --unavailable")}
  ${dim("npm run menu -- available 'Salade Croquante' off")}
  ${dim("npm run menu -- bulk-available off --category Desserts --dry-run")}
  ${dim("SUPABASE_SERVICE_ROLE_KEY='...' npm run menu -- price 4a3f9c21 14000")}

${bold("Clé de service")}
  Supabase → Project Settings → API → service_role.
  Elle n'est pas rangée dans .env.local, que l'application lit aussi :
  une clé de service dans ce fichier serait une fuite en puissance.
  Fournissez-la le temps de la commande, ou exportez-la pour la session.
`);
}

// --- Aiguillage -----------------------------------------------------------

const COMMANDS = {
    menus: cmdMenus,
    categories: cmdCategories,
    list: cmdList,
    show: cmdShow,
    available: cmdAvailable,
    "bulk-available": cmdBulkAvailable,
    price: cmdPrice,
    rename: cmdRename,
    describe: cmdDescribe,
    photo: cmdPhoto,
    feature: cmdFeature,
};

if (!command || flags.help || command === "help") {
    cmdHelp();
    process.exit(0);
}

const run = COMMANDS[command];
if (!run) {
    exitWith(`Commande inconnue : « ${command} ».`, "Lancez `npm run menu -- help` pour la liste.");
}

try {
    await run();
} catch (err) {
    exitWith(err instanceof Error ? err.message : String(err));
}
