-- Add Remita to payment settings if not exists
INSERT INTO payment_settings (provider, is_enabled, public_key, secret_key, merchant_id, api_key)
VALUES ('remita', false, NULL, NULL, NULL, NULL)
ON CONFLICT (provider) DO NOTHING;