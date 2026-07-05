-- ============================================================================
-- Enforce admin_users.is_active dans tous les contrôles d'accès.
--
-- Constat audit 2026-07-05 : l'UI /admin/users permet de désactiver un admin
-- (is_active = false) mais ni is_admin(), ni les policies RLS phase 2c ne
-- vérifiaient ce flag -> un admin désactivé gardait un accès complet.
--
-- NULL est traité comme actif (coalesce true) pour ne pas verrouiller
-- d'éventuelles lignes historiques sans valeur ; la désactivation UI écrit
-- explicitement false.
--
-- A APPLIQUER EN PROD MANUELLEMENT (SQL editor), comme les migrations
-- précédentes (projet hors MCP).
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where (id = auth.uid() or email = (auth.jwt() ->> 'email'))
      and coalesce(is_active, true)
  );
$$;

-- Les policies phase 2c interrogeaient admin_users sans filtre is_active.
-- On les fait passer par is_admin() (SECURITY DEFINER, pas de récursion RLS),
-- source unique de vérité pour "est un admin actif".

drop policy if exists "Admin manage orders" on public.orders;
create policy "Admin manage orders" on public.orders
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admin manage order_items" on public.order_items;
create policy "Admin manage order_items" on public.order_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
