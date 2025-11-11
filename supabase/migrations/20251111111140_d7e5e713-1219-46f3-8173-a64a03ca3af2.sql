-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('draw_upcoming', 'win', 'transaction_approved', 'transaction_rejected', 'withdrawal_approved', 'withdrawal_rejected', 'account_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Create withdrawal_accounts table
CREATE TABLE public.withdrawal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawal_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for withdrawal_accounts
CREATE POLICY "Users can view their own withdrawal accounts"
  ON public.withdrawal_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawal accounts"
  ON public.withdrawal_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawal accounts"
  ON public.withdrawal_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own withdrawal accounts"
  ON public.withdrawal_accounts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal accounts"
  ON public.withdrawal_accounts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for withdrawal_accounts updated_at
CREATE TRIGGER update_withdrawal_accounts_updated_at
  BEFORE UPDATE ON public.withdrawal_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;