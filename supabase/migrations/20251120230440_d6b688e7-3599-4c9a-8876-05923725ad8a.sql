-- Add column to control leaderboard visibility
ALTER TABLE public.profiles 
ADD COLUMN hide_from_leaderboard BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.hide_from_leaderboard IS 'When true, user will be hidden from public leaderboards';

-- Update existing admin user to be hidden by default
UPDATE public.profiles 
SET hide_from_leaderboard = true 
WHERE email = 'emmanueloladimeji409@gmail.com';