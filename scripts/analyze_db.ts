
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Utiliser SERVICE_ROLE_KEY si disponible pour contourner RLS et avoir les vrais comptes, sinon anon
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erreur: Variables d\'environnement manquantes (URL ou KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAnalysis() {
    console.log('--- Rapport d\'Analyse Base de Données ---\n');

    // 1. Restaurants existants
    console.log('1. Restaurants existants (SELECT id, name, slug FROM restaurants):');
    const { data: restaurants, error: restoError } = await supabase
        .from('restaurants')
        .select('id, name, slug');

    if (restoError) console.error('Erreur restaurants:', restoError.message);
    else console.table(restaurants);

    console.log('\n2. Volume de données:');

    // Compte Orders
    const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    // Compte Menu Items
    const { count: itemsCount, error: itemsError } = await supabase
        .from('menu_items')
        .select('*', { count: 'exact', head: true });

    // Compte Admin Users
    // Note: admin_users access might fail if RLS prevents listing names without service key, checking count only
    const { count: adminsCount, error: adminsError } = await supabase
        .from('admin_users')
        .select('*', { count: 'exact', head: true });

    const volumes = [
        { table_name: 'orders', count: ordersError ? `Erreur: ${ordersError.message}` : ordersCount },
        { table_name: 'menu_items', count: itemsError ? `Erreur: ${itemsError.message}` : itemsCount },
        { table_name: 'admin_users', count: adminsError ? `Erreur: ${adminsError.message}` : adminsCount },
    ];

    console.table(volumes);
}

runAnalysis();
