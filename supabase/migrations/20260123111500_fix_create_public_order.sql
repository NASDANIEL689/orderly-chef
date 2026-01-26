-- Fix ambiguous column reference in create_public_order
CREATE OR REPLACE FUNCTION public.create_public_order(
  items JSONB,
  customer_name TEXT,
  customer_phone TEXT,
  order_type TEXT,
  notes TEXT
)
RETURNS TABLE (order_id UUID, order_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id UUID;
  new_order_number TEXT;
  item JSONB;
  item_qty INTEGER;
  item_price NUMERIC;
  item_total NUMERIC;
  computed_subtotal NUMERIC := 0;
BEGIN
  IF order_type NOT IN ('takeaway', 'online') THEN
    RAISE EXCEPTION 'Invalid order type';
  END IF;

  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Order must include items';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    item_qty := COALESCE((item->>'quantity')::INTEGER, 0);
    item_price := COALESCE((item->>'unit_price')::NUMERIC, 0);
    IF item_qty <= 0 OR item_price <= 0 THEN
      RAISE EXCEPTION 'Invalid item data';
    END IF;
    item_total := item_qty * item_price;
    computed_subtotal := computed_subtotal + item_total;
  END LOOP;

  INSERT INTO public.orders (
    order_type,
    customer_name,
    customer_phone,
    subtotal,
    tax,
    total,
    payment_method,
    notes
  )
  VALUES (
    order_type,
    customer_name,
    customer_phone,
    computed_subtotal,
    0,
    computed_subtotal,
    'online',
    notes
  )
  RETURNING id, public.orders.order_number INTO new_order_id, new_order_number;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    item_qty := COALESCE((item->>'quantity')::INTEGER, 0);
    item_price := COALESCE((item->>'unit_price')::NUMERIC, 0);
    item_total := item_qty * item_price;
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      item_name,
      quantity,
      unit_price,
      total_price,
      notes
    )
    VALUES (
      new_order_id,
      NULL,
      item->>'item_name',
      item_qty,
      item_price,
      item_total,
      NULLIF(item->>'notes', '')
    );
  END LOOP;

  RETURN QUERY SELECT new_order_id, new_order_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_public_order(JSONB, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
