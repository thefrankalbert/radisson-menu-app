import { createClient } from "@/lib/supabase-server";
import AdsClient, { Ad } from "@/components/admin/AdsClient";

export const dynamic = 'force-dynamic';

export default async function AdsPage() {
    const supabase = await createClient();

    const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

    // Mapper les données DB vers l'interface UI
    const ads: Ad[] = (announcements || []).map((ann: any) => ({
        id: ann.id,
        title: ann.title,
        description: ann.description || "",
        image_url: ann.image_url,
        category: mapTypeToCategory(ann.type),
        is_active: ann.is_active,
        start_date: ann.start_date,
        end_date: ann.end_date,
        views: ann.views || 0 // Si la colonne n'existe pas, 0 par défaut
    }));

    return <AdsClient initialAds={ads} />;
}

function mapTypeToCategory(type: string): string {
    // Mapping basique des types DB vers les catégories visuelles
    switch (type) {
        case 'home_banner':
            return 'Restaurant'; // Par défaut
        case 'popup':
            return 'Lobby';
        case 'sidebar':
            return 'Panorama';
        default:
            return 'Restaurant';
    }
}
