
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS campaign_id text;
CREATE INDEX IF NOT EXISTS idx_sales_campaign_id ON public.sales(campaign_id);
