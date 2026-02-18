-- Add notification sound preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_sound text DEFAULT 'cash-money';

-- Enable realtime for sales table
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;