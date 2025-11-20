-- Drop the old reserve function and recreate to ensure it works properly
DROP FUNCTION IF EXISTS reserve_withdrawal_balance(UUID, NUMERIC);

CREATE OR REPLACE FUNCTION reserve_withdrawal_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_updated_rows INT;
BEGIN
  -- Lock the wallet row and get current balance
  SELECT balance INTO v_current_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if wallet exists
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE NOTICE 'Insufficient balance: % < %', v_current_balance, p_amount;
    RETURN FALSE;
  END IF;
  
  -- Deduct the balance
  UPDATE wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  
  IF v_updated_rows = 0 THEN
    RAISE EXCEPTION 'Failed to update wallet balance';
  END IF;
  
  RAISE NOTICE 'Successfully deducted % from wallet. New balance: %', p_amount, v_current_balance - p_amount;
  
  RETURN TRUE;
END;
$$;