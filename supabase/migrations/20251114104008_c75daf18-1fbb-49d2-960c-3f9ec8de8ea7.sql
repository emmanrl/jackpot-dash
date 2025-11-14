-- Add winners_count column to jackpots table
ALTER TABLE public.jackpots 
ADD COLUMN winners_count integer NOT NULL DEFAULT 1 CHECK (winners_count >= 1 AND winners_count <= 10);

-- Add winner_rank column to winners table to track prize tier
ALTER TABLE public.winners 
ADD COLUMN winner_rank integer NOT NULL DEFAULT 1;