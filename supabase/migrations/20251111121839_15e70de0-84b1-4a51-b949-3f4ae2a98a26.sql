-- Update auto-create-jackpots to handle proper frequencies
-- Add realtime capabilities for jackpots table
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpots;

-- Create notification for draw warnings
CREATE OR REPLACE FUNCTION notify_upcoming_draws()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function would be called periodically to check for upcoming draws
  -- and create notifications for users who have tickets
  NULL;
END;
$$;