import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AdminClientShell from "@/components/admin/AdminClientShell";

// L'admin est protégé par authentification et lit des données par requête :
// jamais de pré-génération statique. Sans ça, le build tente de prérendre
// /admin/* et un worker peut planter (mémoire limitée / incompat Node du VPS),
// ce qui faisait échouer TOUT le build — donc bloquait le déploiement du menu.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // On peut garder cette sécurité même si le middleware est actif
    // Note: On ne redirige pas ici si on est sur /admin/login (géré par middleware ou client shell)

    return (
        <AdminClientShell user={user}>
            {children}
        </AdminClientShell>
    );
}
