-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu items table
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  order_type TEXT NOT NULL DEFAULT 'dine-in' CHECK (order_type IN ('dine-in', 'takeaway', 'online')),
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'online')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (POS systems typically allow all authenticated users)
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public read on order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION public.generate_order_number();

-- Insert sample categories (pizza shop only)
INSERT INTO public.categories (name, icon) VALUES
  ('Pizza', 'pizza'),
  ('Drinks', 'cup');

-- Insert sample menu items (pizzas and drinks only)
INSERT INTO public.menu_items (category_id, name, price, description) VALUES
  -- Kasi Special combos (choose any flavour: Meat Lovers, Mexican Chilli, Creamy Chicken, Phane Pizza)
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: One Large + Double Mini Decker', 220.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: One Large + Triple Mini Decker', 250.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: One Large + Quad Mini Decker', 280.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: Two Large + Single Mini Decker', 280.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: Two Large + Double Mini Decker', 300.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: Two Large + Triple Mini Decker', 350.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Pizza'), 'Kasi Special: Two Large + Quad Mini Decker', 380.00, 'Pick flavour: Meat Lovers / Mexican Chilli / Creamy Chicken / Phane Pizza'),
  ((SELECT id FROM public.categories WHERE name = 'Drinks'), 'Cola', 2.49, 'Classic cola'),
  ((SELECT id FROM public.categories WHERE name = 'Drinks'), 'Lemonade', 2.99, 'Fresh squeezed lemonade'),
  ((SELECT id FROM public.categories WHERE name = 'Drinks'), 'Iced Tea', 2.99, 'Brewed tea over ice'),
  ((SELECT id FROM public.categories WHERE name = 'Drinks'), 'Sparkling Water', 2.79, 'Lightly carbonated mineral water');

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;