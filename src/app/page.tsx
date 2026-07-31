import { HomeScreen } from "@/components/client/HomeScreen";
import { loadHomeData } from "@/lib/menu-data";
import { APP_CONFIG } from "@/lib/constants";

// La carte bouge peu : la page est mise en cache et régénérée toutes les 60s.
// Elle ne lit ni cookies ni paramètres d'URL — la redirection des QR (`?v=`)
// est faite par le middleware, précisément pour préserver ce cache.
export const revalidate = 60;

/** N'Djamena est en UTC+1 toute l'année — pas d'heure d'été à gérer. */
const VENUE_UTC_OFFSET_HOURS = 1;

export default async function Page() {
    const { restaurants, categories, items } = await loadHomeData();

    // L'heure sert au message d'accueil. Elle est figée à la régénération de la
    // page, donc au plus 60s de décalage : sans conséquence pour un message qui
    // ne change qu'à 11h et 17h.
    const venueHour = (new Date().getUTCHours() + VENUE_UTC_OFFSET_HOURS) % 24;

    return (
        <HomeScreen
            venueName={APP_CONFIG.hotel}
            restaurants={restaurants}
            categories={categories}
            items={items}
            hour={venueHour}
        />
    );
}
