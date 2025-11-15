-- Add auth settings table
CREATE TABLE IF NOT EXISTS public.auth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_verification_enabled BOOLEAN DEFAULT false,
  google_auth_enabled BOOLEAN DEFAULT false,
  google_client_id TEXT,
  google_client_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage auth settings
CREATE POLICY "Admins can manage auth settings"
ON public.auth_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow everyone to view auth settings (to check if features are enabled)
CREATE POLICY "Everyone can view auth settings"
ON public.auth_settings
FOR SELECT
USING (true);

-- Insert default settings
INSERT INTO public.auth_settings (phone_verification_enabled, google_auth_enabled)
VALUES (false, false)
ON CONFLICT DO NOTHING;