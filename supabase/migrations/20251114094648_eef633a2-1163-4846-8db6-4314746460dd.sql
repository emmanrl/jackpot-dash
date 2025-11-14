-- Create daily login rewards table
CREATE TABLE IF NOT EXISTS public.daily_login_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_days INTEGER NOT NULL DEFAULT 1,
  xp_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable RLS
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own login rewards"
ON public.daily_login_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create login rewards"
ON public.daily_login_rewards
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_daily_login_user_date ON public.daily_login_rewards(user_id, login_date);

-- Create bonus settings table
CREATE TABLE IF NOT EXISTS public.bonus_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bonus_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  percentage NUMERIC(5, 2),
  fixed_amount NUMERIC(10, 2),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bonus_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view active bonus settings"
ON public.bonus_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage bonus settings"
ON public.bonus_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to record daily login
CREATE OR REPLACE FUNCTION public.record_daily_login(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_login DATE;
  v_current_streak INTEGER;
  v_xp_reward INTEGER;
BEGIN
  -- Get last login date
  SELECT login_date, streak_days INTO v_last_login, v_current_streak
  FROM daily_login_rewards
  WHERE user_id = p_user_id
  ORDER BY login_date DESC
  LIMIT 1;

  -- Check if already logged in today
  IF v_last_login = CURRENT_DATE THEN
    RETURN 0;
  END IF;

  -- Calculate new streak
  IF v_last_login = CURRENT_DATE - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
  ELSE
    v_current_streak := 1;
  END IF;

  -- Calculate XP reward (5 XP base + 1 XP per streak day, max 50 XP)
  v_xp_reward := LEAST(5 + v_current_streak, 50);

  -- Insert login record
  INSERT INTO daily_login_rewards (user_id, login_date, streak_days, xp_awarded)
  VALUES (p_user_id, CURRENT_DATE, v_current_streak, v_xp_reward);

  -- Award XP to user
  PERFORM award_experience_points(p_user_id, v_xp_reward);

  RETURN v_xp_reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to apply signup bonus
CREATE OR REPLACE FUNCTION public.apply_signup_bonus(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_bonus_amount NUMERIC;
BEGIN
  -- Check for active signup bonus
  SELECT fixed_amount INTO v_bonus_amount
  FROM bonus_settings
  WHERE bonus_type = 'signup'
    AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  LIMIT 1;

  -- Apply bonus if found
  IF v_bonus_amount IS NOT NULL AND v_bonus_amount > 0 THEN
    PERFORM increment_wallet_balance(p_user_id, v_bonus_amount);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the handle_new_user function to include signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, experience_points, theme)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0,
    'default'
  );
  
  -- Create wallet with 0 balance
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Apply signup bonus
  PERFORM apply_signup_bonus(NEW.id);
  
  RETURN NEW;
END;
$$;