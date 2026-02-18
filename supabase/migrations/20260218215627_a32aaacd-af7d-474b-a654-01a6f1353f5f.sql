
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_push boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_sms boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notify_slack boolean DEFAULT false;
