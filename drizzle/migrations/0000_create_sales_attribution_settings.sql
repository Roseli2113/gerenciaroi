CREATE TABLE public.sales_attribution_settings (
 user_id uuid PRIMARY KEY,
 fallback_campaign_id text NOT NULL CHECK (fallback_campaign_id ~ '^[0-9]{9,25}$'),
 fallback_campaign_name text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sales_attribution_settings TO authenticated;
GRANT ALL ON public.sales_attribution_settings TO service_role;
ALTER TABLE public.sales_attribution_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own attribution settings" ON public.sales_attribution_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);