-- Create admin_wallet table to track admin jackpot earnings
CREATE TABLE IF NOT EXISTS public.admin_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_wallet ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin wallet
CREATE POLICY "Admins can view admin wallet"
  ON public.admin_wallet FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update admin wallet
CREATE POLICY "Admins can update admin wallet"
  ON public.admin_wallet FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert initial admin wallet record
INSERT INTO public.admin_wallet (balance) VALUES (0.00)
ON CONFLICT DO NOTHING;

-- Add draw_id and jackpot_id to winners table for detailed view
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS total_participants INTEGER DEFAULT 0;
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS total_pool_amount NUMERIC DEFAULT 0.00;