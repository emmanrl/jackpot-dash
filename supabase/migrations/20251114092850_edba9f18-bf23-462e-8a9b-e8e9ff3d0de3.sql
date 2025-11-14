-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own achievements"
ON public.achievements
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements"
ON public.achievements
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(achievement_type);

-- Create function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_ticket_count INTEGER;
  v_win_count INTEGER;
  v_xp INTEGER;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO v_ticket_count
  FROM tickets
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_win_count
  FROM winners
  WHERE user_id = p_user_id;

  SELECT experience_points INTO v_xp
  FROM profiles
  WHERE id = p_user_id;

  -- Award ticket purchase achievements
  IF v_ticket_count >= 10 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'tickets_10', jsonb_build_object('count', v_ticket_count))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_ticket_count >= 50 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'tickets_50', jsonb_build_object('count', v_ticket_count))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_ticket_count >= 100 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'tickets_100', jsonb_build_object('count', v_ticket_count))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Award win achievements
  IF v_win_count >= 1 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'first_win', jsonb_build_object('count', v_win_count))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_win_count >= 5 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'wins_5', jsonb_build_object('count', v_win_count))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  -- Award XP achievements
  IF v_xp >= 100 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'xp_100', jsonb_build_object('xp', v_xp))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;

  IF v_xp >= 500 THEN
    INSERT INTO achievements (user_id, achievement_type, metadata)
    VALUES (p_user_id, 'xp_500', jsonb_build_object('xp', v_xp))
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;