-- Add category column to jackpots table
ALTER TABLE public.jackpots 
ADD COLUMN category text DEFAULT 'hourly';

-- Add index for better query performance
CREATE INDEX idx_jackpots_category ON public.jackpots(category);