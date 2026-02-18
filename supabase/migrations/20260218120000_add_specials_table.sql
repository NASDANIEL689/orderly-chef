-- Create specials table for managing discounts and special offers
CREATE TABLE IF NOT EXISTS public.specials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Create index for efficient queries
CREATE INDEX idx_specials_menu_item_id ON public.specials(menu_item_id);
CREATE INDEX idx_specials_is_active ON public.specials(is_active);
CREATE INDEX idx_specials_dates ON public.specials(start_date, end_date);

ALTER TABLE public.specials ENABLE ROW LEVEL SECURITY;

-- Staff can read active specials
DROP POLICY IF EXISTS "Staff read active specials" ON public.specials;
CREATE POLICY "Staff read active specials"
ON public.specials
FOR SELECT
USING (
  is_active = true
  OR EXISTS (
    SELECT 1 FROM public.staff_users su
    WHERE su.user_id = auth.uid() AND su.role = 'admin'
  )
);

-- Admins can manage all specials
DROP POLICY IF EXISTS "Admin manage specials" ON public.specials;
CREATE POLICY "Admin manage specials"
ON public.specials
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

-- Create a view for order analytics to calculate profit
CREATE OR REPLACE VIEW public.order_analytics AS
SELECT
  o.id,
  o.created_at,
  DATE(o.created_at) as order_date,
  DATE_TRUNC('week', o.created_at) as order_week,
  DATE_TRUNC('month', o.created_at) as order_month,
  o.subtotal,
  o.tax,
  o.total,
  o.amount_paid,
  o.status,
  o.payment_method,
  (o.total - COALESCE((SELECT SUM(CASE 
    WHEN s.discount_type = 'percentage' THEN (oi.unit_price * s.discount_value / 100)
    ELSE s.discount_value 
  END)
  FROM public.order_items oi
  LEFT JOIN public.menu_items mi ON oi.menu_item_id = mi.id
  LEFT JOIN public.specials s ON mi.id = s.menu_item_id 
    AND s.is_active = true
    AND o.created_at >= s.start_date 
    AND o.created_at < s.end_date
  WHERE oi.order_id = o.id), 0)) as profit
FROM public.orders o;

-- Create a view for daily analytics
CREATE OR REPLACE VIEW public.daily_analytics AS
SELECT
  order_date,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(subtotal) as total_subtotal,
  SUM(tax) as total_tax,
  SUM(total) as total_revenue,
  SUM(profit) as total_profit,
  AVG(profit) as avg_profit_per_order,
  MAX(profit) as highest_order_profit,
  MIN(profit) as lowest_order_profit
FROM public.order_analytics
WHERE status = 'completed'
GROUP BY order_date
ORDER BY order_date DESC;

GRANT SELECT ON public.order_analytics TO authenticated;
GRANT SELECT ON public.daily_analytics TO authenticated;
