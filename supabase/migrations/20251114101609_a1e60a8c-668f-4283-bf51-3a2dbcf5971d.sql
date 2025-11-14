-- Create user_follows table for following system
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows"
  ON public.user_follows
  FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.user_follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Create indexes for better query performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- Create user_activity_feed view for activity feed
CREATE OR REPLACE VIEW public.user_activity_feed AS
SELECT 
  t.user_id,
  'ticket_purchase' as activity_type,
  t.purchased_at as activity_date,
  jsonb_build_object(
    'ticket_id', t.id,
    'ticket_number', t.ticket_number,
    'jackpot_id', t.jackpot_id,
    'purchase_price', t.purchase_price
  ) as activity_data
FROM public.tickets t
UNION ALL
SELECT 
  w.user_id,
  'win' as activity_type,
  w.claimed_at as activity_date,
  jsonb_build_object(
    'win_id', w.id,
    'prize_amount', w.prize_amount,
    'jackpot_id', w.jackpot_id,
    'ticket_id', w.ticket_id
  ) as activity_data
FROM public.winners w
UNION ALL
SELECT 
  a.user_id,
  'achievement' as activity_type,
  a.achieved_at as activity_date,
  jsonb_build_object(
    'achievement_id', a.id,
    'achievement_type', a.achievement_type,
    'metadata', a.metadata
  ) as activity_data
FROM public.achievements a
ORDER BY activity_date DESC;