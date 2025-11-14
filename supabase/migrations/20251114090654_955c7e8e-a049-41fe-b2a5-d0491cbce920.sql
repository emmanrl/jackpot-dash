-- Fix search_path for security functions
ALTER FUNCTION public.award_experience_points(UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.notify_withdrawal_status() SET search_path = public;