CREATE TABLE public.duplication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_entity_id text NOT NULL,
  entity_type text NOT NULL,
  new_entity_id text,
  strategy text NOT NULL DEFAULT 'copies_endpoint',
  meta_error_code integer,
  meta_error_subcode integer,
  meta_error_message text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.duplication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own duplication logs"
  ON public.duplication_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert duplication logs"
  ON public.duplication_logs FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all duplication logs"
  ON public.duplication_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_duplication_logs_user_id ON public.duplication_logs(user_id);
CREATE INDEX idx_duplication_logs_created_at ON public.duplication_logs(created_at DESC);