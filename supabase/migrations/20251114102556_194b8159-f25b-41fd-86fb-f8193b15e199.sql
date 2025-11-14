-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_commission NUMERIC NOT NULL DEFAULT 0.00,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON public.referrals
  FOR UPDATE
  USING (true);

-- Add referral_code to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Update existing profiles to have referral codes
UPDATE public.profiles 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- Update handle_new_user to generate referral code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_user_id UUID;
  referral_code_param TEXT;
BEGIN
  -- Extract referral code from metadata if exists
  referral_code_param := NEW.raw_user_meta_data->>'referral_code';
  
  -- Create profile with referral code
  INSERT INTO public.profiles (id, email, full_name, experience_points, theme, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    0,
    'default',
    generate_referral_code()
  );
  
  -- Create wallet with 0 balance
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Apply signup bonus
  PERFORM apply_signup_bonus(NEW.id);
  
  -- If referral code was provided, create referral relationship
  IF referral_code_param IS NOT NULL AND referral_code_param != '' THEN
    SELECT id INTO referrer_user_id
    FROM public.profiles
    WHERE referral_code = referral_code_param;
    
    IF referrer_user_id IS NOT NULL AND referrer_user_id != NEW.id THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (referrer_user_id, NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to award referral commission
CREATE OR REPLACE FUNCTION public.award_referral_commission(p_winner_id UUID, p_prize_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_commission NUMERIC;
BEGIN
  -- Check if winner was referred by someone
  SELECT referrer_id INTO v_referrer_id
  FROM public.referrals
  WHERE referred_id = p_winner_id;
  
  -- If there's a referrer, award 1% commission
  IF v_referrer_id IS NOT NULL THEN
    v_commission := p_prize_amount * 0.01;
    
    -- Add commission to referrer's wallet
    PERFORM increment_wallet_balance(v_referrer_id, v_commission);
    
    -- Update total commission in referrals table
    UPDATE public.referrals
    SET total_commission = total_commission + v_commission
    WHERE referred_id = p_winner_id;
    
    -- Create notification for referrer
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      v_referrer_id,
      'referral_commission',
      '💰 Referral Commission Earned!',
      format('You earned ₦%.2f (1%%) commission from your referral''s winnings!', v_commission),
      jsonb_build_object('commission', v_commission, 'referred_id', p_winner_id)
    );
  END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);