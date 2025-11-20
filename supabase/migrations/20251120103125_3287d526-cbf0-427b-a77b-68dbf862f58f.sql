-- Drop the trigger that's not working
DROP TRIGGER IF EXISTS trigger_auto_process_withdrawal ON public.transactions;
DROP FUNCTION IF EXISTS public.auto_process_withdrawal();

-- Reset stuck withdrawals back to initiated so users can retry
UPDATE public.transactions
SET processing_stage = 'initiated'
WHERE type = 'withdrawal' 
  AND status = 'pending' 
  AND processing_stage = 'verifying';