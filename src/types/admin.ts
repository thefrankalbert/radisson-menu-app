// Types pour l'administration

// Rôles d'administration avec niveaux d'accès
export type AdminRole = 'superadmin' | 'admin' | 'caissier' | 'chef' | 'serveur';

// Description des rôles
export const ROLE_DESCRIPTIONS: Record<AdminRole, { label: string; description: string; level: number }> = {
    superadmin: {
        label: "Super Admin",
        description: "Accès complet - peut créer d'autres admins (max 2)",
        level: 100
    },
    admin: {
        label: "Administrateur",
        description: "Gestion complète sauf création de superadmin",
        level: 80
    },
    caissier: {
        label: "Caissier",
        description: "Caisse, paiements, factures, remboursements",
        level: 60
    },
    chef: {
        label: "Chef Cuisine",
        description: "Réception et validation des commandes en cuisine",
        level: 40
    },
    serveur: {
        label: "Serveur",
        description: "Prise de commandes et service",
        level: 20
    }
};

export type AdminUser = {
    id: string;
    user_id?: string;
    email: string;
    full_name?: string;
    role: AdminRole;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    created_by?: string;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export type OrderItem = {
    id: string;
    name: string;
    quantity: number;
    price: number;
    menu_item_id?: string;
};

export type Order = {
    id: string;
    table_number: string;
    total_price: number;
    total_amount?: number;
    status: OrderStatus;
    created_at: string;
    restaurant_id?: string;
    venue_id?: string;
    table_id?: string;
    items?: OrderItem[];
};

export type Restaurant = {
    id: string;
    name: string;
    name_en?: string;
    slug: string;
    image_url?: string;
    is_event?: boolean;
    is_active?: boolean;
    qr_code_url?: string;
    created_at: string;
};

export type Category = {
    id: string;
    name: string;
    name_en?: string;
    restaurant_id: string;
    display_order?: number;
    created_at: string;
};

export type MenuItem = {
    id: string;
    name: string;
    name_en?: string;
    description?: string;
    description_en?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    is_featured: boolean;
    category_id: string;
    category?: Category;
    display_order?: number;
    created_at: string;
    // Relations pour options et variantes
    options?: ItemOption[];
    price_variants?: ItemPriceVariant[];
};

// Option sélectionnable (ex: saveurs de jus - même prix)
export type ItemOption = {
    id: string;
    menu_item_id: string;
    name_fr: string;
    name_en?: string;
    display_order: number;
    is_default: boolean;
    created_at: string;
};

// Variante de prix (ex: Verre/Bouteille - prix différents)
export type ItemPriceVariant = {
    id: string;
    menu_item_id: string;
    variant_name_fr: string;
    variant_name_en?: string;
    price: number;
    display_order: number;
    is_default: boolean;
    created_at: string;
};

export type Announcement = {
    id: string;
    title: string;
    title_en?: string;
    description?: string;
    description_en?: string;
    image_url?: string;
    start_date: string;
    end_date?: string;
    is_active: boolean;
    restaurant_id?: string;
    created_at: string;
};

export type DashboardStats = {
    ordersToday: number;
    revenueToday: number;
    activeItems: number;
    activeCards: number;
    ordersTrend?: number;
    revenueTrend?: number;
};

export type PopularItem = {
    id: string;
    name: string;
    image_url?: string;
    order_count: number;
};

// Types pour le système multi-venue
export type Venue = {
    id: string;
    name: string;
    name_en?: string;
    slug: string;
    description?: string;
    description_en?: string;
    image_url?: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
};

export type Zone = {
    id: string;
    venue_id: string;
    name: string;
    name_en?: string;
    prefix: string; // 'P', 'PL', 'PE', 'L', 'LE'
    description?: string;
    display_order: number;
    created_at: string;
};

export type Table = {
    id: string;
    zone_id: string;
    table_number: string;
    display_name: string; // 'P01', 'PL05', etc.
    capacity: number;
    is_active: boolean;
    qr_code_url?: string;
    created_at: string;
    zone?: Zone;
};

// Types pour les paramètres
export type Setting = {
    id: string;
    key: string;
    value: unknown;
    description?: string;
    updated_at: string;
    created_at: string;
};

export type SettingsMap = {
    restaurant_name: string;
    currency: string;
    currency_symbol: string;
    default_language: 'fr' | 'en';
    notification_sound: boolean;
    auto_accept_orders: boolean;
    order_timeout_minutes: number;
};
