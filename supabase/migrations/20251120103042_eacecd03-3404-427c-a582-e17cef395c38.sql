-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to automatically process withdrawals via edge function
CREATE OR REPLACE FUNCTION public.auto_process_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process new withdrawal transactions
  IF NEW.type = 'withdrawal' AND NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    -- Call the process-withdrawal edge function asynchronously
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/process-withdrawal',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object('transactionId', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-process withdrawals
DROP TRIGGER IF EXISTS trigger_auto_process_withdrawal ON public.transactions;
CREATE TRIGGER trigger_auto_process_withdrawal
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_process_withdrawal();

-- Manually trigger processing for stuck withdrawals by setting to verifying
UPDATE public.transactions
SET processing_stage = 'verifying'
WHERE type = 'withdrawal' 
  AND status = 'pending' 
  AND processing_stage = 'initiated';