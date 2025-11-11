-- Add a sequence column to tickets table to track order per jackpot
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_sequence INTEGER;

-- Create a function to get the next ticket sequence for a jackpot
CREATE OR REPLACE FUNCTION get_next_ticket_sequence(p_jackpot_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
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

-- Add jackpot_number column to jackpots to track jackpot sequence
ALTER TABLE jackpots ADD COLUMN IF NOT EXISTS jackpot_number INTEGER;

-- Create a sequence for jackpot numbers
CREATE SEQUENCE IF NOT EXISTS jackpot_number_seq START WITH 1;