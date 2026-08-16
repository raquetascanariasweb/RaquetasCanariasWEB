-- ═══════════════════════════════════════════════════════════════
-- SPORTBALIN — Migración 008: decremento atómico de stock
-- Crea una función RPC para restar stock de forma atómica al
-- confirmar un pago, evitando condiciones de carrera.
-- ═══════════════════════════════════════════════════════════════

create or replace function decrement_stock(
  p_product_id uuid,
  p_size text,
  p_color text,
  p_quantity int
)
returns void
language plpgsql
as $$
declare
  v_track boolean;
  v_variant_id uuid;
  v_current int;
begin
  if p_quantity <= 0 then
    return;
  end if;

  -- Variante: hay talla o color
  if p_size is not null or p_color is not null then
    select id, stock_quantity, track_inventory
    into v_variant_id, v_current, v_track
    from product_variants
    where product_id = p_product_id
      and size = coalesce(p_size, '')
      and color_slug = coalesce(p_color, '')
    for update;

    if found and coalesce(v_track, false) then
      update product_variants
      set stock_quantity = greatest(0, stock_quantity - p_quantity)
      where id = v_variant_id;

      update products
      set stock_quantity = coalesce((
        select sum(stock_quantity)
        from product_variants
        where product_id = p_product_id
      ), 0),
      in_stock = coalesce((
        select sum(stock_quantity)
        from product_variants
        where product_id = p_product_id
      ), 0) > 0
      where id = p_product_id;
    end if;
  else
    -- Producto sin variantes
    select stock_quantity, track_inventory
    into v_current, v_track
    from products
    where id = p_product_id
    for update;

    if found and coalesce(v_track, false) then
      update products
      set stock_quantity = greatest(0, stock_quantity - p_quantity),
          in_stock = greatest(0, stock_quantity - p_quantity) > 0
      where id = p_product_id;
    end if;
  end if;
end;
$$;
