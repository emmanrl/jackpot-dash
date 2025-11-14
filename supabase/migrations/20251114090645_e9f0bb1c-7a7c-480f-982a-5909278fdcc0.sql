-- Add XP system to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS experience_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'default';

-- Create function to award XP
CREATE OR REPLACE FUNCTION public.award_experience_points(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET experience_points = experience_points + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add withdrawal notification function
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes for withdrawals
  IF NEW.type = 'withdrawal' AND NEW.status != OLD.status THEN
    -- Call send-notification edge function
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
        'userId', NEW.user_id,
        'type', 'withdrawal_' || NEW.status,
        'amount', NEW.amount,
        'reference', NEW.reference
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for withdrawal notifications
DROP TRIGGER IF EXISTS withdrawal_status_notification ON public.transactions;
CREATE TRIGGER withdrawal_status_notification
AFTER UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_withdrawal_status();