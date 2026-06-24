-- ============================================================================
-- Phase 2b - RPCs additionnels (ADDITIF, backward-compatible, safe avant deploy)
--  - get_order v2 : ajoute restaurant_id (requis pour "modifier" -> re-panier)
--  - cancel_order : annule (statut 'cancelled') une commande pending dans la fenetre
--    7 min, verifie par token. Remplace le DELETE (qui etait refuse par RLS).
--  - is_admin : appartenance admin_users par id OU email (pour le middleware /admin)
-- ============================================================================

create or replace function public.get_order(p_id uuid, p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'id', o.id,
    'created_at', o.created_at,
    'status', o.status,
    'table_number', o.table_number,
    'restaurant_id', o.restaurant_id,
    'total_price', o.total_price,
    'tip_amount', o.tip_amount,
    'payment_method', o.payment_method,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'menu_item_id', oi.menu_item_id,
        'quantity', oi.quantity,
        'price_at_order', oi.price_at_order,
        'name', mi.name,
        'name_en', mi.name_en,
        'image_url', mi.image_url
      ))
      from order_items oi
      left join menu_items mi on mi.id = oi.menu_item_id
      where oi.order_id = o.id
    ), '[]'::jsonb)
  ) into v
  from orders o
  where o.id = p_id and o.access_token = p_token;

  if v is null then raise exception 'not_found'; end if;
  return v;
end;
$$;
revoke all on function public.get_order(uuid,uuid) from public;
grant execute on function public.get_order(uuid,uuid) to anon, authenticated;

create or replace function public.cancel_order(p_id uuid, p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_status text; v_created timestamptz;
begin
  select status, created_at into v_status, v_created
  from orders where id = p_id and access_token = p_token;
  if not found then raise exception 'not_found'; end if;
  if v_status <> 'pending' then raise exception 'not_cancellable'; end if;
  if now() - v_created > interval '7 minutes' then raise exception 'window_expired'; end if;

  update orders set status = 'cancelled', updated_at = now()
  where id = p_id and access_token = p_token;
  return jsonb_build_object('id', p_id, 'status', 'cancelled');
end;
$$;
revoke all on function public.cancel_order(uuid,uuid) from public;
grant execute on function public.cancel_order(uuid,uuid) to anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid()
       or email = (auth.jwt() ->> 'email')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
