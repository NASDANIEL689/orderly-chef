-- Create staff table for access control
CREATE TABLE IF NOT EXISTS public.staff_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Staff can read their own role; admins can manage staff
DROP POLICY IF EXISTS "staff_users read own" ON public.staff_users;
CREATE POLICY "staff_users read own"
ON public.staff_users
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_users admin manage" ON public.staff_users;
CREATE POLICY "staff_users admin manage"
ON public.staff_users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
);

-- Tighten access for categories and menu items
DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access on menu_items" ON public.menu_items;

DROP POLICY IF EXISTS "Staff read categories" ON public.categories;
CREATE POLICY "Staff read categories"
ON public.categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin manage categories" ON public.categories;
CREATE POLICY "Admin manage categories"
ON public.categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Staff read menu_items" ON public.menu_items;
CREATE POLICY "Staff read menu_items"
ON public.menu_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin manage menu_items" ON public.menu_items;
CREATE POLICY "Admin manage menu_items"
ON public.menu_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
);

-- Lock down orders: public can insert, staff can read, admin can update
DROP POLICY IF EXISTS "Allow public read access on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update on orders" ON public.orders;

DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Staff read orders" ON public.orders;
CREATE POLICY "Staff read orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
      AND su.role = 'admin'
  )
);

-- Order items: public can insert, staff can read
DROP POLICY IF EXISTS "Allow public read on order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public insert on order_items" ON public.order_items;

DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items"
ON public.order_items
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Staff read order_items" ON public.order_items;
CREATE POLICY "Staff read order_items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid()
  )
);

-- Reviews stay public read/insert only
DROP POLICY IF EXISTS "Allow public read access on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;

CREATE POLICY "Allow public read access on reviews"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on reviews"
ON public.reviews
FOR INSERT
WITH CHECK (true);

-- Secure public order creation via RPC
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
  RETURNING id, order_number INTO new_order_id, new_order_number;

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
