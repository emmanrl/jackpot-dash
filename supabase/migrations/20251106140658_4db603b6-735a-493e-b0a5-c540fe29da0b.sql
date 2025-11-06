-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'ticket_purchase', 'prize_win');

-- Create transaction status enum
CREATE TYPE public.transaction_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create jackpot status enum
CREATE TYPE public.jackpot_status AS ENUM ('active', 'drawing', 'completed', 'paused');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create wallets table
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT,
  admin_note TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create jackpots table
CREATE TABLE public.jackpots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  frequency TEXT NOT NULL, -- 'hourly', 'daily', 'weekly', 'monthly', 'special'
  draw_time TIMESTAMPTZ,
  next_draw TIMESTAMPTZ,
  status public.jackpot_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.jackpots ENABLE ROW LEVEL SECURITY;

-- Create tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jackpot_id UUID NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  ticket_number TEXT NOT NULL,
  purchase_price DECIMAL(10,2) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create draws table
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jackpot_id UUID NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  total_tickets INTEGER NOT NULL DEFAULT 0,
  prize_amount DECIMAL(10,2) NOT NULL,
  winning_ticket_id UUID REFERENCES public.tickets(id),
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;

-- Create winners table
CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jackpot_id UUID NOT NULL REFERENCES public.jackpots(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  prize_amount DECIMAL(10,2) NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Create wallet with 0 balance
  INSERT INTO public.wallets (user_id, balance)
  VALUES (NEW.id, 0.00);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jackpots_updated_at
  BEFORE UPDATE ON public.jackpots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for wallets
CREATE POLICY "Users can view their own wallet"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jackpots
CREATE POLICY "Everyone can view active jackpots"
  ON public.jackpots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage jackpots"
  ON public.jackpots FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can purchase tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for draws
CREATE POLICY "Everyone can view draws"
  ON public.draws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage draws"
  ON public.draws FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for winners
CREATE POLICY "Users can view their own wins"
  ON public.winners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view all winners"
  ON public.winners FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage winners"
  ON public.winners FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX idx_tickets_jackpot_id ON public.tickets(jackpot_id);
CREATE INDEX idx_draws_jackpot_id ON public.draws(jackpot_id);
CREATE INDEX idx_winners_user_id ON public.winners(user_id);