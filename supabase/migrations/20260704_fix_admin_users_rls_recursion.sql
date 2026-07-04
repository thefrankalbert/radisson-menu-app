-- ============================================================================
-- Fix 42P17: infinite recursion detected in policy for relation "admin_users"
--
-- Cause : la policy SELECT "Admin only view admin_users" sur public.admin_users
-- avait pour condition  auth.uid() IN (SELECT id FROM admin_users)  -> elle
-- interroge admin_users dans sa propre condition => récursion infinie.
-- Consequence : TOUTE table dont une policy lit admin_users (item_options,
-- item_price_variants, announcements, orders, order_items...) renvoie 500 en
-- lecture cote client, car l'evaluation traverse la policy recursive.
--
-- Correctif : remplacer la condition auto-referente par la fonction
-- public.is_admin() (SECURITY DEFINER, deja presente depuis phase2b). Etant
-- SECURITY DEFINER, elle lit admin_users en bypassant RLS -> pas de recursion.
-- is_admin() est executable par anon ET authenticated (verifie), donc les
-- lectures client (anon) qui traversent admin_users ne cassent plus.
-- ============================================================================

drop policy if exists "Admin only view admin_users" on public.admin_users;

create policy "Admins view admin_users" on public.admin_users
  for select
  using (public.is_admin());
