-- 1) Add action_value, action_value_type, target_id to automation_rules
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS action_value numeric,
  ADD COLUMN IF NOT EXISTS action_value_type text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS target_id text;

-- 2) Create budget_alerts table
CREATE TABLE IF NOT EXISTS public.budget_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id text,
  account_name text,
  budget_amount numeric NOT NULL DEFAULT 0,
  alert_threshold integer NOT NULL DEFAULT 90,
  is_active boolean NOT NULL DEFAULT true,
  last_alert_sent_at timestamptz,
  last_spent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own budget alerts"
  ON public.budget_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budget alerts"
  ON public.budget_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget alerts"
  ON public.budget_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget alerts"
  ON public.budget_alerts FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_budget_alerts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_budget_alerts_updated_at ON public.budget_alerts;
CREATE TRIGGER trg_budget_alerts_updated_at
BEFORE UPDATE ON public.budget_alerts
FOR EACH ROW EXECUTE FUNCTION public.update_budget_alerts_updated_at();