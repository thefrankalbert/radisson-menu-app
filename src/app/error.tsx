'use client';

import { useEffect } from 'react';

const isChunkError = (error: Error) =>
    /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        `${error.name} ${error.message}`
    );

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('App error:', error);
        // Chunk périmé après un déploiement (service worker / cache) : un reload résout.
        // Garde-fou sessionStorage pour éviter une boucle de reload infinie.
        if (isChunkError(error) && !sessionStorage.getItem('chunk_reloaded')) {
            sessionStorage.setItem('chunk_reloaded', '1');
            window.location.reload();
        }
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
            <h1 className="text-2xl font-semibold">Oups, une erreur est survenue</h1>
            <p className="text-sm opacity-70">Veuillez réessayer. Si le problème persiste, rechargez la page.</p>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-medium"
                >
                    Réessayer
                </button>
                <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 rounded-full border font-medium"
                >
                    Recharger
                </button>
            </div>
        </div>
    );
}
