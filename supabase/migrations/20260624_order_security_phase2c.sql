-- ============================================================================
-- Phase 2c - DURCISSEMENT (a appliquer SEULEMENT APRES deploy du code 40abcc4)
-- Retire l'acces anon direct a orders/order_items (ferme l'IDOR H4/H7 + tampering H3).
-- Le client passe desormais par les RPCs SECURITY DEFINER (create_order/get_order/
-- cancel_order) qui bypassent RLS. Les pages /admin sont authentifiees -> policy admin.
-- Verifie avant: aucun acces client direct a orders/order_items (confirme dans le code).
-- ============================================================================

-- Retirer les policies permissives anon (with_check/using = true)
drop policy if exists "Public can insert orders"          on public.orders;
drop policy if exists "Public can view restaurant orders" on public.orders;
drop policy if exists "Public can update orders status"   on public.orders;

drop policy if exists "Public can insert order items" on public.order_items;
drop policy if exists "Public can view order items"   on public.order_items;
drop policy if exists "Public can update order items" on public.order_items;

-- Acces complet pour les admins authentifies (KDS, POS, dashboard, gestion commandes).
-- Verifie l'appartenance a admin_users par id OU email (couvre les deux modeles d'identite).
create policy "Admin manage orders" on public.orders
  for all to authenticated
  using (
    auth.uid() in (select id from admin_users)
    or (auth.jwt() ->> 'email') in (select email from admin_users)
  )
  with check (
    auth.uid() in (select id from admin_users)
    or (auth.jwt() ->> 'email') in (select email from admin_users)
  );

create policy "Admin manage order_items" on public.order_items
  for all to authenticated
  using (
    auth.uid() in (select id from admin_users)
    or (auth.jwt() ->> 'email') in (select email from admin_users)
  )
  with check (
    auth.uid() in (select id from admin_users)
    or (auth.jwt() ->> 'email') in (select email from admin_users)
  );
