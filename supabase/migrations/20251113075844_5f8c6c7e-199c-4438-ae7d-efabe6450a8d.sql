-- First alter the check constraint to include flutterwave
ALTER TABLE payment_settings DROP CONSTRAINT IF EXISTS payment_settings_provider_check;
ALTER TABLE payment_settings ADD CONSTRAINT payment_settings_provider_check CHECK (provider IN ('paystack', 'remita', 'flutterwave'));

-- Add flutterwave to payment_settings if not exists
INSERT INTO payment_settings (provider, is_enabled)
VALUES ('flutterwave', false)
ON CONFLICT DO NOTHING;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'Jackpot Platform',
  site_logo_url text,
  terms_of_service text,
  privacy_policy text,
  faq jsonb DEFAULT '[]'::jsonb,
  contact_email text,
  contact_phone text,
  support_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site_settings
CREATE POLICY "Everyone can view site settings"
ON site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert site settings"
ON site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default site settings
INSERT INTO site_settings (site_name)
VALUES ('Jackpot Platform');

-- Create trigger for site_settings updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();