CREATE TABLE public.manual_sale_attributions (
 sale_id uuid PRIMARY KEY REFERENCES public.sales(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 campaign_id text NOT NULL CHECK (campaign_id ~ '^[0-9]{9,25}$'),
 campaign_name text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manual_sale_attributions TO authenticated;
GRANT ALL ON public.manual_sale_attributions TO service_role;
ALTER TABLE public.manual_sale_attributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own manual attributions" ON public.manual_sale_attributions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own sale attribution" ON public.manual_sale_attributions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND s.user_id = auth.uid()) AND EXISTS (SELECT 1 FROM public.meta_ad_accounts a WHERE a.user_id = auth.uid() AND a.is_active));
CREATE POLICY "Update own sale attribution" ON public.manual_sale_attributions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_id AND s.user_id = auth.uid()));
CREATE POLICY "Delete own manual attribution" ON public.manual_sale_attributions FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX manual_sale_attributions_user_idx ON public.manual_sale_attributions(user_id);