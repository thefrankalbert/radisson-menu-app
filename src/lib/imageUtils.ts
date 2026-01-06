
export const SAFE_IMAGES = {
    pool: "https://images.unsplash.com/photo-1572331165267-854da2b00ca1?q=80&w=800&auto=format&fit=crop",
    lobby: "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?q=80&w=800&auto=format&fit=crop",
    room: "https://images.unsplash.com/photo-1629891465228-442d87e0743b?q=80&w=800&auto=format&fit=crop",
    panorama: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop",
    tapas: "https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?q=80&w=800&auto=format&fit=crop",

    burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop",
    pizza: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=800&auto=format&fit=crop",
    salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=800&auto=format&fit=crop",
    dessert: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=800&auto=format&fit=crop",
    coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop",
    chicken: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop",
    meat: "https://images.unsplash.com/photo-1603073163308-9654c3fb70b5?q=80&w=800&auto=format&fit=crop",
    pasta: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=800&auto=format&fit=crop",

    african: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
    default: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop"
};

export const getSafeImageUrl = (query: string): string => {
    if (!query) return SAFE_IMAGES.default;
    const lower = query.toLowerCase();

    // Restaurants
    if (lower.includes('pool')) return SAFE_IMAGES.pool;
    if (lower.includes('lobby')) return SAFE_IMAGES.lobby;
    if (lower.includes('room') || lower.includes('service')) return SAFE_IMAGES.room;
    if (lower.includes('panorama') || lower.includes('toit') || lower.includes('roof')) return SAFE_IMAGES.panorama;
    if (lower.includes('tapas')) return SAFE_IMAGES.tapas;

    // Dishes
    if (lower.includes('burger')) return SAFE_IMAGES.burger;
    if (lower.includes('pizza')) return SAFE_IMAGES.pizza;
    if (lower.includes('salad') || lower.includes('salade')) return SAFE_IMAGES.salad;
    if (lower.includes('drink') || lower.includes('boisson') || lower.includes('cocktail') || lower.includes('vin') || lower.includes('wine')) return SAFE_IMAGES.drink;
    if (lower.includes('dessert') || lower.includes('cake') || lower.includes('sucre') || lower.includes('gateau')) return SAFE_IMAGES.dessert;
    if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('thé')) return SAFE_IMAGES.coffee;
    if (lower.includes('chicken') || lower.includes('poulet')) return SAFE_IMAGES.chicken;
    if (lower.includes('steak') || lower.includes('viande') || lower.includes('meat') || lower.includes('boeuf')) return SAFE_IMAGES.meat;
    if (lower.includes('pasta') || lower.includes('pate') || lower.includes('spaghetti')) return SAFE_IMAGES.pasta;
    if (lower.includes('ndole') || lower.includes('yassa') || lower.includes('mafe') || lower.includes('local')) return SAFE_IMAGES.african;

    return SAFE_IMAGES.default;
};
