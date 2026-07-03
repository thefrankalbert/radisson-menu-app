'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="fr">
            <body style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 24 }}>
                <div>
                    <h1 style={{ fontSize: 22, marginBottom: 8 }}>Oups, une erreur est survenue</h1>
                    <p style={{ opacity: 0.7, marginBottom: 16 }}>Veuillez recharger la page.</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 24px', borderRadius: 999, background: '#2563eb', color: '#fff', border: 'none', fontSize: 15, cursor: 'pointer' }}
                    >
                        Recharger
                    </button>
                </div>
            </body>
        </html>
    );
}
