/**
 * Types d'authentification pour l'administration
 * Remplace les "any" par des types stricts
 */

// Rôles disponibles dans le système
export type AdminRole = 'superadmin' | 'admin' | 'caissier' | 'chef' | 'serveur';

// Interface utilisateur authentifié (compatible avec Supabase User)
export interface AuthUser {
    id: string;
    email?: string; // Optional pour compatibilité avec Supabase User
    role?: AdminRole;
    user_metadata?: {
        full_name?: string;
        avatar_url?: string;
    };
    app_metadata?: {
        provider?: string;
        role?: AdminRole;
    };
    created_at?: string;
    last_sign_in_at?: string;
}

// Interface utilisateur admin (enrichie avec données métier)
export interface AdminUserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name?: string;
    role: AdminRole;
    is_active: boolean;
    last_login?: string;
    created_at: string;
    created_by?: string;
}

// Props standard pour les composants admin qui reçoivent un utilisateur
export interface AdminComponentProps {
    user: AuthUser | null;
}

// Session utilisateur
export interface UserSession {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    token_type: string;
    user: AuthUser;
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<AdminRole, {
    label: string;
    level: number;
    permissions: string[];
}> = {
    superadmin: {
        label: "Super Admin",
        level: 100,
        permissions: ['*']
    },
    admin: {
        label: "Administrateur",
        level: 80,
        permissions: ['dashboard', 'orders', 'items', 'categories', 'reports', 'settings', 'users']
    },
    caissier: {
        label: "Caissier",
        level: 60,
        permissions: ['dashboard', 'orders', 'pos']
    },
    chef: {
        label: "Chef Cuisine",
        level: 40,
        permissions: ['kitchen', 'orders']
    },
    serveur: {
        label: "Serveur",
        level: 20,
        permissions: ['orders', 'pos']
    }
};

// Helper pour vérifier les permissions
export function hasPermission(user: AuthUser | null, permission: string): boolean {
    if (!user?.role) return false;
    const roleConfig = ROLE_PERMISSIONS[user.role];
    if (!roleConfig) return false;
    return roleConfig.permissions.includes('*') || roleConfig.permissions.includes(permission);
}

// Helper pour vérifier le niveau d'accès
export function hasAccessLevel(user: AuthUser | null, minLevel: number): boolean {
    if (!user?.role) return false;
    const roleConfig = ROLE_PERMISSIONS[user.role];
    return roleConfig ? roleConfig.level >= minLevel : false;
}

// Helper pour convertir Supabase User vers AuthUser
// Cette fonction assure la compatibilité de types entre Supabase et notre app
export function toAuthUser(supabaseUser: {
    id: string;
    email?: string;
    role?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
    created_at?: string;
    last_sign_in_at?: string;
} | null): AuthUser | null {
    if (!supabaseUser) return null;

    // Valider que le role est un AdminRole valide
    const validRoles: AdminRole[] = ['superadmin', 'admin', 'caissier', 'chef', 'serveur'];
    const role = supabaseUser.role && validRoles.includes(supabaseUser.role as AdminRole)
        ? (supabaseUser.role as AdminRole)
        : undefined;

    return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        role,
        user_metadata: supabaseUser.user_metadata as AuthUser['user_metadata'],
        app_metadata: supabaseUser.app_metadata as AuthUser['app_metadata'],
        created_at: supabaseUser.created_at,
        last_sign_in_at: supabaseUser.last_sign_in_at,
    };
}
