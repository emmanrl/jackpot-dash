-- Create payment settings table
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL CHECK (provider IN ('remita', 'paystack')),
  is_enabled boolean NOT NULL DEFAULT false,
  public_key text,
  secret_key text,
  merchant_id text,
  api_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(provider)
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage payment settings
CREATE POLICY "Admins can view payment settings"
ON public.payment_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payment settings"
ON public.payment_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment settings"
ON public.payment_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Insert default payment providers
INSERT INTO public.payment_settings (provider, is_enabled)
VALUES 
  ('remita', false),
  ('paystack', false);