-- Fix security warning: Set search_path for the function
DROP FUNCTION IF EXISTS get_next_ticket_sequence(UUID);

CREATE OR REPLACE FUNCTION get_next_ticket_sequence(p_jackpot_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(ticket_sequence), 0) + 1
  INTO next_seq
  FROM tickets
  WHERE jackpot_id = p_jackpot_id;
  
  RETURN next_seq;
END;
$$;