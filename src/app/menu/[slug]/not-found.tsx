import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

/**
 * Carte introuvable : slug inconnu, ou carte désactivée depuis l'impression du
 * QR posé sur la table. Le convive a un téléphone en main et personne à qui
 * demander : on lui dit quoi faire plutôt que de le laisser sur un 404 brut.
 */
export default function MenuNotFound() {
    return (
        <div className="flex min-h-full flex-col items-center justify-center px-8 py-24 text-center">
            <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[var(--radius-modal)] border border-[var(--color-divider)] bg-[var(--color-surface-alt)]">
                <UtensilsCrossed className="h-8 w-8 text-[var(--color-ink-soft)]" strokeWidth={1.6} />
            </div>
            <h1 className="text-[18px] font-semibold tracking-[-0.4px] text-[var(--color-ink)]">
                Carte introuvable
            </h1>
            <p className="mt-1.5 max-w-[280px] text-[13px] leading-[1.5] text-[var(--color-ink-muted)]">
                Cette carte n&apos;est plus disponible. Retrouvez les restaurants et bars de
                l&apos;hôtel depuis l&apos;accueil, ou demandez à votre serveur.
            </p>
            <Link
                href="/"
                className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--color-brand)] px-6 text-[14px] font-semibold text-white transition-transform duration-150 active:scale-[0.98]"
            >
                Voir les cartes
            </Link>
        </div>
    );
}
