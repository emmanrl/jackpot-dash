-- Create favorite_jackpots table for bookmarking system
CREATE TABLE public.favorite_jackpots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  jackpot_id UUID NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, jackpot_id)
);

-- Enable RLS
ALTER TABLE public.favorite_jackpots ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorite_jackpots
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own favorites
CREATE POLICY "Users can add favorites"
ON public.favorite_jackpots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can remove favorites"
ON public.favorite_jackpots
FOR DELETE
USING (auth.uid() = user_id);

-- Add indices for performance
CREATE INDEX idx_favorite_jackpots_user_id ON public.favorite_jackpots(user_id);
CREATE INDEX idx_favorite_jackpots_jackpot_id ON public.favorite_jackpots(jackpot_id);