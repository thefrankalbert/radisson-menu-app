"use server"

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { AdminRole } from "@/types/admin";

/**
 * Wrapper poyr sécuriser les actions serveur
 */
async function protectedAction<T>(
    logic: (supabase: any, user: any) => Promise<T>,
    requiredRole: AdminRole[] = ['superadmin', 'admin']
): Promise<{ data?: T; error?: string }> {
    const supabase = await createClient();

    // 1. Vérification de l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Non authentifié" };
    }

    // 2. Vérification du rôle
    const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('email', user.email)
        .single();

    if (!adminUser || !requiredRole.includes(adminUser.role as AdminRole)) {
        return { error: "Permission refusée" };
    }

    try {
        const result = await logic(supabase, user);
        return { data: result };
    } catch (error: any) {
        console.error("Server Action Error:", error);
        return { error: error.message || "Une erreur serveur est survenue" };
    }
}

/**
 * Mise à jour des paramètres de l'établissement
 */
export async function updateEstablishmentSettingsAction(settings: any) {
    return protectedAction(async (supabase) => {
        const { error } = await supabase
            .from('settings')
            .upsert({
                key: 'establishment_settings',
                value: settings,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'key'
            });

        if (error) throw error;

        revalidatePath('/admin/settings');
        return { success: true };
    }, ['superadmin']);
}

/**
 * Création d'un nouvel administrateur (Auth + Profil)
 */
export async function createAdminUserAction(formData: any) {
    return protectedAction(async (supabase, currentUser) => {
        // 1. Validation métier
        if (formData.role === 'superadmin') {
            const { count } = await supabase
                .from('admin_users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'superadmin');

            if (count && count >= 2) {
                throw new Error("Limite de Super Admins atteinte (max 2)");
            }
        }

        // 2. Création Auth (Côté Serveur via Admin Client)
        const adminClient = createAdminClient();
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
            email: formData.email,
            password: formData.password,
            email_confirm: true,
            user_metadata: { full_name: formData.full_name }
        });

        if (authError) throw authError;

        // 3. Insertion Profil
        const { error: insertError } = await supabase
            .from('admin_users')
            .insert({
                user_id: authUser.user.id,
                email: formData.email,
                full_name: formData.full_name,
                role: formData.role,
                is_active: true,
                created_by: currentUser.id
            });

        if (insertError) {
            // Rollback: supprimer le user auth créé
            console.error("Profile insert failed, rolling back auth user:", insertError);
            try {
                const { error: deleteError } = await adminClient.auth.admin.deleteUser(authUser.user.id);
                if (deleteError) {
                    console.error("CRITICAL: Failed to rollback auth user creation:", deleteError);
                    // On continue quand même pour signaler l'erreur originale
                }
            } catch (rollbackError) {
                console.error("CRITICAL: Rollback exception:", rollbackError);
            }
            throw new Error(`Échec de création du profil: ${insertError.message}`);
        }

        revalidatePath('/admin/users');
        return { success: true };
    }, ['superadmin', 'admin']);
}

/**
 * Suppression d'un administrateur
 */
export async function deleteAdminUserAction(adminId: string, authUserId?: string) {
    return protectedAction(async (supabase) => {
        // Suppression du profil
        const { error } = await supabase
            .from('admin_users')
            .delete()
            .eq('id', adminId);

        if (error) throw error;

        // Si on a le user_id, on supprime aussi le compte Auth
        if (authUserId) {
            const adminClient = createAdminClient();
            await adminClient.auth.admin.deleteUser(authUserId);
        }

        revalidatePath('/admin/users');
        return { success: true };
    }, ['superadmin']);
}

/**
 * Mise à jour du statut d'une commande
 */
export async function updateOrderStatusAction(orderId: string, status: string) {
    return protectedAction(async (supabase) => {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (error) throw error;

        revalidatePath('/admin/orders');
        revalidatePath('/admin/kitchen');
        return { success: true };
    }, ['superadmin', 'admin', 'chef', 'serveur', 'caissier']);
}
