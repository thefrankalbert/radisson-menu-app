-- ============================================================================
-- Phase 2a - Durcissement securite commandes (ADDITIF, backward-compatible)
-- Ne retire AUCUNE policy existante -> le code actuel continue de fonctionner.
-- Ajoute: token IDOR + RPC create_order (prix valide serveur) + RPC get_order
-- + verrou handle_new_user. Le durcissement des policies = Phase 2c (apres deploy code).
-- ============================================================================

-- 1) Verrouiller handle_new_user (fonction trigger, pas censee etre appelee en RPC)
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 2) Token par commande contre l'IDOR (additif ; les commandes existantes recoivent un token)
alter table public.orders
  add column if not exists access_token uuid not null default gen_random_uuid();

-- 3) RPC create_order : prix recalcule/valide cote serveur (anti-tampering H3)
--    Valide que chaque price_at_order soumis est SOIT le prix de base SOIT un prix
--    de variante legitime pour cet item (meme restaurant + dispo). Total recalcule.
create or replace function public.create_order(
  p_restaurant_id uuid,
  p_table_number  text    default null,
  p_room_number   text    default null,
  p_payment_method text   default 'cash',
  p_tip_amount    integer default 0,
  p_customer_notes text   default null,
  p_notes         text    default null,
  p_items         jsonb   default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_token    uuid;
  v_total    numeric := 0;
  v_item     jsonb;
  v_menu_id  uuid;
  v_qty      integer;
  v_submitted numeric;
  v_valid    numeric;
begin
  if not exists (select 1 from restaurants where id = p_restaurant_id and coalesce(is_active, true)) then
    raise exception 'invalid_restaurant';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;

  insert into orders(restaurant_id, table_number, room_number, payment_method,
                     tip_amount, customer_notes, notes, status, total_price)
  values (p_restaurant_id, p_table_number, p_room_number, coalesce(p_payment_method, 'cash'),
          greatest(coalesce(p_tip_amount, 0), 0), p_customer_notes, p_notes, 'pending', 0)
  returning id, access_token into v_order_id, v_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_menu_id   := (v_item->>'menu_item_id')::uuid;
    v_qty       := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    v_submitted := (v_item->>'price_at_order')::numeric;

    -- prix accepte = prix de base de l'item OU un prix de variante connu (meme resto + dispo)
    select p into v_valid from (
      select mi.price as p
      from menu_items mi
      where mi.id = v_menu_id and mi.restaurant_id = p_restaurant_id
        and coalesce(mi.is_available, true) and mi.price = v_submitted
      union
      select v.price as p
      from item_price_variants v
      join menu_items mi on mi.id = v.menu_item_id
      where v.menu_item_id = v_menu_id and mi.restaurant_id = p_restaurant_id
        and coalesce(mi.is_available, true) and v.price = v_submitted
    ) s
    limit 1;

    if v_valid is null then
      raise exception 'price_mismatch:%', v_menu_id;
    end if;

    insert into order_items(order_id, menu_item_id, quantity, price_at_order)
    values (v_order_id, v_menu_id, v_qty, v_valid);

    v_total := v_total + (v_valid * v_qty);
  end loop;

  v_total := v_total + greatest(coalesce(p_tip_amount, 0), 0);
  update orders set total_price = v_total where id = v_order_id;

  return jsonb_build_object('id', v_order_id, 'access_token', v_token, 'total_price', v_total);
end;
$$;

revoke all on function public.create_order(uuid,text,text,text,integer,text,text,jsonb) from public;
grant execute on function public.create_order(uuid,text,text,text,integer,text,text,jsonb) to anon, authenticated;

-- 4) RPC get_order : lecture d'UNE commande par token (anti-IDOR H4, suivi client)
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

  if v is null then
    raise exception 'not_found';
  end if;
  return v;
end;
$$;

revoke all on function public.get_order(uuid,uuid) from public;
grant execute on function public.get_order(uuid,uuid) to anon, authenticated;
