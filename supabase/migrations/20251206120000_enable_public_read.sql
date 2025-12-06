-- Enable public read access for Jackpots
DROP POLICY IF EXISTS "Everyone can view active jackpots" ON public.jackpots;
CREATE POLICY "Everyone can view active jackpots"
  ON public.jackpots FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable public read access for Winners
DROP POLICY IF EXISTS "Everyone can view all winners" ON public.winners;
CREATE POLICY "Everyone can view all winners"
  ON public.winners FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable public read access for specific Profile fields (needed for winner display)
-- Note: 'profiles' already has RLS. We need a specific policy for anon to view limited info or all info if acceptable.
-- For now, we allow reading all profiles for anon to ensure winner names/avatars load.
-- In a stricter app, we would restrict columns, but RLS applies to rows.
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
CREATE POLICY "Everyone can view profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

-- Enable public read access for Draws
DROP POLICY IF EXISTS "Everyone can view draws" ON public.draws;
CREATE POLICY "Everyone can view draws"
  ON public.draws FOR SELECT
  TO anon, authenticated
  USING (true);

-- RPC Function for aggregated stats
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE (
  total_prize_pool DECIMAL,
  total_winners BIGINT,
  active_jackpots BIGINT,
  active_players BIGINT,
  total_paid_out DECIMAL,
  today_draws BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_prize_pool DECIMAL;
  v_total_winners BIGINT;
  v_active_jackpots BIGINT;
  v_active_players BIGINT;
  v_total_paid_out DECIMAL;
  v_today_draws BIGINT;
BEGIN
  -- 1. Total Prize Pool (from active jackpots)
  SELECT COALESCE(SUM(prize_pool), 0) INTO v_total_prize_pool
  FROM public.jackpots
  WHERE status = 'active';

  -- 2. Total Winners Count
  SELECT COUNT(*) INTO v_total_winners
  FROM public.winners;

  -- 3. Active Jackpots Count
  SELECT COUNT(*) INTO v_active_jackpots
  FROM public.jackpots
  WHERE status = 'active';

  -- 4. Active Players (Total Profiles - simple proxy for players)
  SELECT COUNT(*) INTO v_active_players
  FROM public.profiles;

  -- 5. Total Paid Out
  SELECT COALESCE(SUM(prize_amount), 0) INTO v_total_paid_out
  FROM public.winners;

  -- 6. Today's Draws
  SELECT COUNT(*) INTO v_today_draws
  FROM public.draws
  WHERE drawn_at >= CURRENT_DATE;

  RETURN QUERY SELECT
    v_total_prize_pool,
    v_total_winners,
    v_active_jackpots,
    v_active_players,
    v_total_paid_out,
    v_today_draws;
END;
$$;

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon, authenticated;
