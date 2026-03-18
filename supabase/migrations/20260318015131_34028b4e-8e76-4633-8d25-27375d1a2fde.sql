ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sale_notif_send_pending text DEFAULT 'disabled',
  ADD COLUMN IF NOT EXISTS sale_notif_send_approved text DEFAULT 'enabled',
  ADD COLUMN IF NOT EXISTS sale_notif_sale_value text DEFAULT 'total',
  ADD COLUMN IF NOT EXISTS sale_notif_product_name text DEFAULT 'hide',
  ADD COLUMN IF NOT EXISTS sale_notif_utm_campaign text DEFAULT 'hide',
  ADD COLUMN IF NOT EXISTS sale_notif_dashboard_name text DEFAULT 'hide';