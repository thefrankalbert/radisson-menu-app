-- Plafonne quantité, pourboire et cadence de commande côté serveur.
--
-- Contexte : create_order est exécutable par le rôle `anon`. Jusqu'ici la
-- quantité n'avait qu'un plancher (greatest(qty, 1)) et le pourboire qu'un
-- plancher à 0. Les seules limites hautes (30 articles par ligne, 30 secondes
-- entre deux commandes) vivaient dans l'interface et dans localStorage : elles
-- protègent l'usage normal, pas un appel direct à l'API avec la clé anon.
-- Sans ces bornes, on peut injecter en cuisine une commande à 1 000 000 unités
-- ou un pourboire à 2^31-1, et enchaîner les envois sans limite.
--
-- Rien d'autre ne change : la validation des prix, le jeton d'accès et la forme
-- de la valeur de retour sont identiques.

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
  v_tip      integer;
  -- Doit rester aligné sur MAX_ITEM_QTY (src/context/CartContext.tsx).
  c_max_qty       constant integer := 30;
  -- Un pourboire au-delà reste possible en espèces, de la main à la main.
  c_max_tip       constant integer := 500000;
  c_max_lines     constant integer := 60;
  c_order_cooldown constant interval := interval '20 seconds';
begin
  if not exists (select 1 from restaurants where id = p_restaurant_id and coalesce(is_active, true)) then
    raise exception 'invalid_restaurant';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_order';
  end if;
  if jsonb_array_length(p_items) > c_max_lines then
    raise exception 'too_many_lines';
  end if;

  v_tip := least(greatest(coalesce(p_tip_amount, 0), 0), c_max_tip);

  -- Cadence par table : le garde-fou de l'interface est effaçable, celui-ci non.
  -- Une table nulle est ignorée, sinon deux convives sans QR se bloqueraient.
  if p_table_number is not null and exists (
    select 1 from orders
    where restaurant_id = p_restaurant_id
      and table_number = p_table_number
      and created_at > now() - c_order_cooldown
  ) then
    raise exception 'order_too_soon';
  end if;

  insert into orders(restaurant_id, table_number, room_number, payment_method,
                     tip_amount, customer_notes, notes, status, total_price)
  values (p_restaurant_id, p_table_number, p_room_number, coalesce(p_payment_method, 'cash'),
          v_tip, p_customer_notes, p_notes, 'pending', 0)
  returning id, access_token into v_order_id, v_token;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_menu_id   := (v_item->>'menu_item_id')::uuid;
    v_qty       := least(greatest(coalesce((v_item->>'quantity')::int, 1), 1), c_max_qty);
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

  v_total := v_total + v_tip;
  update orders set total_price = v_total where id = v_order_id;

  return jsonb_build_object('id', v_order_id, 'access_token', v_token, 'total_price', v_total);
end;
$$;

-- Sert le contrôle de cadence ci-dessus.
create index if not exists orders_restaurant_table_created_idx
  on public.orders (restaurant_id, table_number, created_at desc);
