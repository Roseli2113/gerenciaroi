CREATE TABLE public.subscription_billing (
  user_id uuid PRIMARY KEY,
  last_paid_at timestamptz,
  next_due_at timestamptz,
  custom_price numeric CHECK (custom_price IS NULL OR custom_price >= 0),
  custom_checkout_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_billing TO authenticated;
GRANT ALL ON public.subscription_billing TO service_role;
ALTER TABLE public.subscription_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own billing" ON public.subscription_billing FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert billing" ON public.subscription_billing FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update billing" ON public.subscription_billing FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete billing" ON public.subscription_billing FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subscription_billing_updated_at BEFORE UPDATE ON public.subscription_billing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();