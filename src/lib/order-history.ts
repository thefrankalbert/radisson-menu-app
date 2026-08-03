export const ORDER_HISTORY_KEY = "order_history";

export interface HistoryOrder {
    id: string;
    date: string;
    items: { name: string; quantity: number; price: number; option?: string; variant?: string }[];
    totalPrice: number;
    tableNumber: string;
    status: string;
}

function isValidHistoryOrder(value: unknown): value is HistoryOrder {
    if (!value || typeof value !== "object") return false;
    const o = value as Record<string, unknown>;
    return (
        typeof o.id === "string" &&
        typeof o.date === "string" &&
        Array.isArray(o.items) &&
        o.items.every((i: unknown) => {
            if (!i || typeof i !== "object") return false;
            const line = i as Record<string, unknown>;
            return (
                typeof line.name === "string" &&
                typeof line.quantity === "number" &&
                typeof line.price === "number"
            );
        }) &&
        typeof o.totalPrice === "number" &&
        typeof o.tableNumber === "string" &&
        typeof o.status === "string"
    );
}

/**
 * Journal des commandes passées depuis cet appareil. Il vit dans localStorage,
 * où n'importe quoi peut avoir été écrit : les entrées mal formées sont écartées
 * plutôt que de faire planter l'écran Commandes.
 */
export function readOrderHistory(): HistoryOrder[] {
    try {
        const raw = localStorage.getItem(ORDER_HISTORY_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValidHistoryOrder);
    } catch {
        return [];
    }
}

export function writeOrderHistory(orders: HistoryOrder[]): void {
    try {
        localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orders));
    } catch {
        // stockage plein ou indisponible : l'historique est un confort, pas la
        // source de vérité — la commande est déjà partie en cuisine.
    }
}

/** Reflète dans le journal local une annulation confirmée par le serveur. */
export function markOrderCancelledInHistory(orderId: string | null): void {
    if (!orderId) return;
    const history = readOrderHistory();
    const next = history.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o));
    writeOrderHistory(next);
}
