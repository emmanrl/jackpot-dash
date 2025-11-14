-- Create function to increment admin wallet balance
CREATE OR REPLACE FUNCTION public.increment_admin_wallet(p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update admin wallet balance
  UPDATE admin_wallet
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = (SELECT id FROM admin_wallet LIMIT 1);
  
  -- If no admin wallet exists, create one
  IF NOT FOUND THEN
    INSERT INTO admin_wallet (balance)
    VALUES (p_amount);
  END IF;
END;
$$;