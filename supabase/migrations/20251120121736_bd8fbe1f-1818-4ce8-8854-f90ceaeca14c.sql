-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS withdrawal_status_notification ON transactions;

-- Now drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS notify_withdrawal_status() CASCADE;

-- We handle notifications directly in the approve-transaction edge function now,
-- so this trigger is no longer needed