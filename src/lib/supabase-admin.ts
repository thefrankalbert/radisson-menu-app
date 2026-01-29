import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec privilèges SERVICE_ROLE
 * À UTILISER UNIQUEMENT CÔTÉ SERVEUR (Admin Actions)
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase Service Role configuration');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
