
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  suggested_action JSONB,
  context JSONB,
  status TEXT NOT NULL DEFAULT 'new',
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own insights" ON public.ai_insights FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own insights" ON public.ai_insights FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_insights_user_created ON public.ai_insights(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_status ON public.ai_insights(user_id, status);

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_insights_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'cron',
  insights_generated INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own runs" ON public.ai_insights_runs FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX idx_ai_insights_runs_user ON public.ai_insights_runs(user_id, created_at DESC);
