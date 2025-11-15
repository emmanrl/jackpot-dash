-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Add index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Add check constraint for username format (alphanumeric and underscores only, 3-20 chars)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_]{3,20}$');