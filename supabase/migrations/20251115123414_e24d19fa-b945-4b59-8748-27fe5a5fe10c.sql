-- Add initial_prize_pool column to jackpots table to track pool growth
ALTER TABLE public.jackpots 
ADD COLUMN IF NOT EXISTS initial_prize_pool numeric DEFAULT 0.00;

-- Update existing jackpots to set initial_prize_pool to current prize_pool
UPDATE public.jackpots 
SET initial_prize_pool = prize_pool 
WHERE initial_prize_pool = 0.00 OR initial_prize_pool IS NULL;

-- Enable realtime for tickets table so we can listen to new ticket purchases
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;