-- Add email configuration columns to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS email_from_name TEXT DEFAULT 'JackpotWin',
ADD COLUMN IF NOT EXISTS email_from_address TEXT,
ADD COLUMN IF NOT EXISTS resend_api_key TEXT;