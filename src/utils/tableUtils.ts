// Système multi-espaces avec tables spécifiques

export type SpaceType = 'panorama' | 'lobby-bar' | 'default';

// Générer les tables selon l'espace
export function getTablesForSpace(space: SpaceType): string[] {
    switch (space) {
        case 'panorama':
            // Panorama: P01-P20 (intérieur), PL01-PL12 (lunch), PE01-PE05 (terrasse)
            const panoramaTables: string[] = [];
            for (let i = 1; i <= 20; i++) {
                panoramaTables.push(`P${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 12; i++) {
                panoramaTables.push(`PL${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 5; i++) {
                panoramaTables.push(`PE${i.toString().padStart(2, '0')}`);
            }
            return panoramaTables;

        case 'lobby-bar':
            // Lobby Bar: L01-L10 (intérieur), LE01-LE10 (terrasse)
            const lobbyTables: string[] = [];
            for (let i = 1; i <= 10; i++) {
                lobbyTables.push(`L${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 10; i++) {
                lobbyTables.push(`LE${i.toString().padStart(2, '0')}`);
            }
            return lobbyTables;

        default:
            // Par défaut, toutes les tables (pour compatibilité)
            const allTables: string[] = [];
            // Panorama
            for (let i = 1; i <= 20; i++) {
                allTables.push(`P${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 12; i++) {
                allTables.push(`PL${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 5; i++) {
                allTables.push(`PE${i.toString().padStart(2, '0')}`);
            }
            // Lobby Bar
            for (let i = 1; i <= 10; i++) {
                allTables.push(`L${i.toString().padStart(2, '0')}`);
            }
            for (let i = 1; i <= 10; i++) {
                allTables.push(`LE${i.toString().padStart(2, '0')}`);
            }
            return allTables;
    }
}

// Détecter l'espace depuis l'URL ou le slug du restaurant
export function detectSpaceFromSlug(slug: string): SpaceType {
    const slugLower = slug.toLowerCase();
    if (slugLower.includes('panorama')) {
        return 'panorama';
    }
    if (slugLower.includes('lobby-bar') || slugLower.includes('lobbybar')) {
        return 'lobby-bar';
    }
    return 'default';
}

// Détecter l'espace depuis les paramètres URL (pour les QR codes)
export function detectSpaceFromURL(): SpaceType {
    if (typeof window === 'undefined') return 'default';
    
    const params = new URLSearchParams(window.location.search);
    const space = params.get('space');
    
    if (space === 'panorama') return 'panorama';
    if (space === 'lobby-bar' || space === 'lobbybar') return 'lobby-bar';
    
    // Fallback: détecter depuis le pathname
    const pathname = window.location.pathname;
    if (pathname.includes('/menu/panorama')) return 'panorama';
    if (pathname.includes('/menu/lobby-bar') || pathname.includes('/menu/lobbybar')) return 'lobby-bar';
    
    return 'default';
}
