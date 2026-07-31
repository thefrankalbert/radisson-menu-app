import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Charge `.env.local` sans dépendance. Ce qui est déjà dans l'environnement du
 * shell gagne, pour pouvoir viser ponctuellement un autre projet.
 */
function loadEnv() {
    const file = resolve(ROOT, ".env.local");
    if (!existsSync(file)) return;

    for (const line of readFileSync(file, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        if (process.env[key] !== undefined) continue;
        process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
}

loadEnv();

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Accès direct à PostgREST, sans `@supabase/supabase-js`.
 *
 * La bibliothèque instancie un client temps réel à la construction, qui exige
 * un WebSocket natif — absent avant Node 22. Un outil en ligne de commande doit
 * marcher sur la machine qu'on a sous la main, pas sur une version précise de
 * Node : ici tout passe par `fetch`, présent depuis Node 18.
 */
function request(key, path, init = {}) {
    if (!BASE_URL) {
        exitWith(
            "NEXT_PUBLIC_SUPABASE_URL est introuvable.",
            "Lancez la commande depuis la racine du projet, où se trouve .env.local.",
        );
    }
    return fetch(`${BASE_URL}/rest/v1/${path}`, {
        ...init,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            ...(init.headers ?? {}),
        },
    });
}

async function readBody(response, context) {
    const text = await response.text();
    if (!response.ok) {
        let message = text;
        try {
            message = JSON.parse(text).message ?? text;
        } catch {
            // corps non-JSON : on garde le texte brut
        }
        exitWith(`${context} : ${message || `HTTP ${response.status}`}`);
    }
    return text.length > 0 ? JSON.parse(text) : [];
}

function anonKey() {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!key) exitWith("NEXT_PUBLIC_SUPABASE_ANON_KEY est introuvable dans .env.local.");
    return key;
}

/**
 * Clé de service, exigée pour toute écriture : les politiques RLS bloquent la
 * clé anon (vérifié — un PATCH sur menu_items ne touche aucune ligne).
 *
 * Elle n'est volontairement pas rangée dans `.env.local`, que l'application lit
 * aussi : une clé de service dans un fichier chargé côté application est une
 * fuite en puissance. On la fournit le temps de la commande.
 */
export function serviceKey() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
        exitWith(
            "SUPABASE_SERVICE_ROLE_KEY n'est pas définie — écriture impossible.",
            "Récupérez-la dans Supabase → Project Settings → API → service_role,",
            "puis lancez la commande ainsi (la clé ne reste pas sur le disque) :",
            "",
            "  SUPABASE_SERVICE_ROLE_KEY='...' npm run menu -- available 'Mojito' off",
            "",
            "Ou, pour toute une session :",
            "",
            "  export SUPABASE_SERVICE_ROLE_KEY='...'",
        );
    }
    return key;
}

/** Lecture. `params` est un objet de filtres PostgREST (`{ select, id: 'eq.…' }`). */
export async function select(tableName, params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await request(anonKey(), `${tableName}?${query}`, { method: "GET" });
    return readBody(response, `Lecture de ${tableName}`);
}

/** Mise à jour. Renvoie les lignes modifiées, pour pouvoir vérifier l'effet réel. */
export async function update(tableName, filters, patch) {
    const query = new URLSearchParams(filters).toString();
    const response = await request(serviceKey(), `${tableName}?${query}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(patch),
    });
    return readBody(response, `Mise à jour de ${tableName}`);
}

export function exitWith(...lines) {
    console.error(`\n${red("✖")} ${lines.join("\n  ")}\n`);
    process.exit(1);
}

// --- Affichage ------------------------------------------------------------

const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const wrap = (code) => (s) => (useColour ? `[${code}m${s}[0m` : String(s));

export const bold = wrap("1");
export const dim = wrap("2");
export const red = wrap("31");
export const green = wrap("32");
export const yellow = wrap("33");
export const cyan = wrap("36");

/** Longueur visible : les codes couleur ne comptent pas dans l'alignement. */
function visibleLength(s) {
    return String(s ?? "").replace(/\[[0-9;]*m/g, "").length;
}

export function formatPrice(value) {
    return `${Number(value).toLocaleString("fr-FR")} FCFA`;
}

/** Tableau aligné, sans dépendance. */
export function table(rows, columns) {
    if (rows.length === 0) {
        console.log(dim("  (aucun résultat)"));
        return;
    }
    const widths = columns.map((c) =>
        Math.max(c.header.length, ...rows.map((r) => visibleLength(c.value(r)))),
    );
    const line = (cells) =>
        "  " +
        cells
            .map((cell, i) => String(cell ?? "") + " ".repeat(Math.max(0, widths[i] - visibleLength(cell))))
            .join("  ");

    console.log(dim(line(columns.map((c) => c.header))));
    for (const row of rows) console.log(line(columns.map((c) => c.value(row))));
}
