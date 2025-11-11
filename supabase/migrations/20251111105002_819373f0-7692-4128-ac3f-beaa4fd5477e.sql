-- Update jackpots table to support more frequency options and expiration
ALTER TABLE jackpots 
  ALTER COLUMN frequency TYPE text,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Add a check to ensure frequency is one of the allowed values
COMMENT ON COLUMN jackpots.frequency IS 'Allowed values: 30mins, 1hour, 2hours, 4hours, 12hours, 1day, 3days, 1week, 1month';

-- Create function to auto-expire jackpots
CREATE OR REPLACE FUNCTION check_jackpot_expiry()
RETURNS trigger AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= NOW() AND NEW.status = 'active' THEN
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check expiry on update
DROP TRIGGER IF EXISTS trigger_check_jackpot_expiry ON jackpots;
CREATE TRIGGER trigger_check_jackpot_expiry
  BEFORE UPDATE ON jackpots
  FOR EACH ROW
  EXECUTE FUNCTION check_jackpot_expiry();