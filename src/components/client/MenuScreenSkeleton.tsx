/**
 * Squelette de la carte. Il reprend exactement la géométrie du vrai écran
 * (header 63px, rail de pastilles 48px, cartes plat 104px) pour qu'aucun élément
 * ne saute au moment où les données arrivent.
 */
export function MenuScreenSkeleton() {
    return (
        <div className="w-full bg-white" aria-busy="true" aria-live="polite">
            <div className="flex h-[63px] items-center gap-2.5 border-b border-[var(--color-divider)] px-[14px]">
                <div className="h-[38px] w-[38px] shrink-0 rounded-full bg-[var(--color-surface-alt)]" />
                <div className="h-4 w-40 rounded bg-[var(--color-surface-alt)]" />
            </div>

            <div className="flex h-12 items-center gap-1.5 overflow-hidden border-b border-[var(--color-divider)] px-4">
                {[64, 88, 72, 96].map((w, i) => (
                    <div
                        key={i}
                        className="h-8 shrink-0 rounded-[var(--radius-pill)] bg-[var(--color-surface-alt)]"
                        style={{ width: w }}
                    />
                ))}
            </div>

            <div className="px-4 pt-4">
                <div className="mb-4 h-6 w-44 rounded bg-[var(--color-surface-alt)]" />
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex items-stretch gap-3.5 border-b border-[var(--color-divider)] py-[15px]"
                    >
                        <div className="flex min-w-0 flex-1 flex-col gap-2.5 py-1">
                            <div className="h-4 w-3/4 rounded bg-[var(--color-surface-alt)]" />
                            <div className="h-3 w-full rounded bg-[var(--color-surface-alt)]" />
                            <div className="mt-auto h-4 w-20 rounded bg-[var(--color-surface-alt)]" />
                        </div>
                        <div className="h-[104px] w-[104px] shrink-0 rounded-[var(--radius-card)] bg-[var(--color-surface-alt)]" />
                    </div>
                ))}
            </div>
        </div>
    );
}
