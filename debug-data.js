const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    try {
        // 1. Read .env.local
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error(".env.local file not found!");
            return;
        }

        const envConfig = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // remove quotes
            }
        });

        const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase credentials in .env.local");
            return;
        }

        // 2. Init Supabase
        const supabase = createClient(supabaseUrl, supabaseKey);

        const targetSlug = 'carte-panorama-restaurant';
        console.log(`Checking data for slug: ${targetSlug}`);

        // 3. Fetch Restaurant
        const { data: restaurant, error: rError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', targetSlug)
            .single();

        if (rError) {
            console.error("Error fetching restaurant:", rError);
            return;
        }

        if (!restaurant) {
            console.error("Restaurant not found.");
            return;
        }

        console.log(`Found Restaurant: ${restaurant.name} (ID: ${restaurant.id})`);

        // 4. Fetch Categories
        const { data: categories, error: cError } = await supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', restaurant.id);

        if (cError) {
            console.error("Error fetching categories:", cError);
            return;
        }

        console.log(`Found ${categories.length} categories:`);
        categories.forEach(c => {
            console.log(` - ${c.name} (ID: ${c.id})`);
        });

        // 5. Check for "Tapas"
        const tapasCategories = categories.filter(c => c.name.toLowerCase().includes('tapas'));
        if (tapasCategories.length > 0) {
            console.log(`\nSUCCESS: Found ${tapasCategories.length} categories matching 'Tapas':`);
            tapasCategories.forEach(c => console.log(` - ${c.name}`));

            // Check items for these categories
            const catIds = tapasCategories.map(c => c.id);
            const { data: items, error: iError } = await supabase
                .from('menu_items')
                .select('*')
                .in('category_id', catIds);

            if (items) {
                console.log(`Found ${items.length} items in Tapas categories.`);
                items.forEach(i => console.log(`   * ${i.name} (Available: ${i.is_available})`));
            }

        } else {
            console.log("\nFAILURE: No category found with 'Tapas' in the name.");
            console.log("Categories found:", categories.map(c => c.name));
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
}

main();
