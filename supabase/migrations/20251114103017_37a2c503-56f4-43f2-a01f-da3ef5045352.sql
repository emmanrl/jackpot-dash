-- Add dark_mode preference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dark_mode BOOLEAN DEFAULT true;

-- Update existing profiles to use dark mode by default
UPDATE public.profiles 
SET dark_mode = true
WHERE dark_mode IS NULL;