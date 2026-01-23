-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public read and insert access
CREATE POLICY "Allow public read access on reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert on reviews" ON public.reviews FOR INSERT WITH CHECK (true);
