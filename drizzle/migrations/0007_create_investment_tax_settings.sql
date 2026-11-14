CREATE TABLE public.investment_tax_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  rate NUMERIC(6,4) NOT NULL DEFAULT 0.12,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.investment_tax_settings TO authenticated;
GRANT ALL ON public.investment_tax_settings TO service_role;

ALTER TABLE public.investment_tax_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tax rate"
ON public.investment_tax_settings
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());