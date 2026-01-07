-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create meta_connections table
CREATE TABLE public.meta_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  meta_user_id TEXT NOT NULL,
  meta_user_name TEXT,
  meta_user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on meta_connections
ALTER TABLE public.meta_connections ENABLE ROW LEVEL SECURITY;

-- Meta connections policies
CREATE POLICY "Users can view their own meta connection"
ON public.meta_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meta connection"
ON public.meta_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta connection"
ON public.meta_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meta connection"
ON public.meta_connections FOR DELETE
USING (auth.uid() = user_id);

-- Create meta_ad_accounts table
CREATE TABLE public.meta_ad_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.meta_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  account_status INTEGER NOT NULL DEFAULT 1,
  currency TEXT,
  timezone_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, account_id)
);

-- Enable RLS on meta_ad_accounts
ALTER TABLE public.meta_ad_accounts ENABLE ROW LEVEL SECURITY;

-- Meta ad accounts policies
CREATE POLICY "Users can view their own ad accounts"
ON public.meta_ad_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad accounts"
ON public.meta_ad_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad accounts"
ON public.meta_ad_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad accounts"
ON public.meta_ad_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meta_connections_updated_at
BEFORE UPDATE ON public.meta_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();