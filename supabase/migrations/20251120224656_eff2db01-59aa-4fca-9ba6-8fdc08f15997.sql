-- Allow users to view basic profile information of other users for leaderboard
CREATE POLICY "Users can view basic profile info of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Add admin commission percentage to jackpots table
ALTER TABLE public.jackpots
ADD COLUMN admin_commission_percentage numeric DEFAULT 10.00 CHECK (admin_commission_percentage >= 0 AND admin_commission_percentage <= 100);