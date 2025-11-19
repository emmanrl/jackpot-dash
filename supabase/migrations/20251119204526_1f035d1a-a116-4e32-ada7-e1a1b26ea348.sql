-- Add withdrawal provider settings to payment_settings
ALTER TABLE payment_settings 
ADD COLUMN IF NOT EXISTS is_withdrawal_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS withdrawal_fee_percentage numeric DEFAULT 0.00;

-- Add comment for clarity
COMMENT ON COLUMN payment_settings.is_withdrawal_enabled IS 'Indicates if this provider can be used for withdrawals';
COMMENT ON COLUMN payment_settings.withdrawal_fee_percentage IS 'Fee percentage for withdrawals using this provider';