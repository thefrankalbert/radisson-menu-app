import { serviceKey, exitWith } from "./client.mjs";

const BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * Les commandes sont invisibles à la clé anon (les politiques RLS les réservent
 * au personnel), donc ces appels passent tous par la clé de service.
 */
async function ordersRequest(path, init = {}) {
    const key = serviceKey();
    const response = await fetch(`${BASE_URL}/rest/v1/${path}`, {
        ...init,
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            ...(init.headers ?? {}),
        },
    });

    const text = await response.text();
    if (!response.ok) {
        let message = text;
        try {
            message = JSON.parse(text).message ?? text;
        } catch {
            // corps non-JSON
        }
        exitWith(`Accès aux commandes : ${message || `HTTP ${response.status}`}`);
    }
    return text.length > 0 ? JSON.parse(text) : [];
}

export function listOrders(params) {
    return ordersRequest(`orders?${new URLSearchParams(params).toString()}`);
}

/**
 * Supprime des commandes et leurs lignes.
 *
 * `order_items` part en premier : selon la contrainte de clé étrangère, une
 * suppression dans l'autre sens échoue ou laisse des lignes orphelines.
 */
export async function deleteOrders(ids) {
    const filter = `in.(${ids.join(",")})`;
    await ordersRequest(`order_items?order_id=${encodeURIComponent(filter)}`, { method: "DELETE" });
    return ordersRequest(`orders?id=${encodeURIComponent(filter)}`, {
        method: "DELETE",
        headers: { Prefer: "return=representation" },
    });
}
