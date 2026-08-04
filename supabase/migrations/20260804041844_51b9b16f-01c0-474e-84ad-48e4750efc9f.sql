CREATE TABLE public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  platform text,
  token_hint text,
  status text not null default 'received',
  http_status integer,
  message text,
  sale_id uuid,
  payload jsonb,
  headers jsonb,
  created_at timestamptz not null default now()
);
CREATE INDEX idx_webhook_logs_user_created ON public.webhook_logs (user_id, created_at DESC);
GRANT SELECT, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own webhook logs" ON public.webhook_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);