import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AdminClientShell from "@/components/admin/AdminClientShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const supabase = createClient();

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
