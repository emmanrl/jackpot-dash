-- Create helper function to increment wallet balance
CREATE OR REPLACE FUNCTION increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wallets
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;