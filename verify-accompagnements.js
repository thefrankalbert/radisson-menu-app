const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gjlztittszelfjubbksy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbHp0aXR0c3plbGZqdWJia3N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNzcwNzksImV4cCI6MjA4Mjk1MzA3OX0.ksZ4blsKar75mO6THGpZida3kX-L8QVv1pb_ur9L5Rs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllOptions() {
    console.log("--- Listing de TOUTES les options d'articles ---");

    const { data: options, error } = await supabase
        .from('item_options')
        .select('*, menu_items(name)')
        .order('name_fr');

    if (error) console.error("Erreur:", error);
    else {
        console.log(`Total options: ${options.length}`);
        options.forEach(o => {
            console.log(` - [${o.menu_items?.name}] ${o.name_fr} / ${o.name_en || 'N/A'}`);
        });
    }
}

listAllOptions();
