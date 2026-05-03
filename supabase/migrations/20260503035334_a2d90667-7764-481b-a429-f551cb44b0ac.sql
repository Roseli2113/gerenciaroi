
CREATE TABLE public.capi_event_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sale_id UUID,
  pixel_meta_id_ref UUID,
  meta_pixel_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 8,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  last_response JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_capi_queue_status_next ON public.capi_event_queue (status, next_attempt_at);
CREATE INDEX idx_capi_queue_user ON public.capi_event_queue (user_id);
CREATE INDEX idx_capi_queue_sale ON public.capi_event_queue (sale_id);

ALTER TABLE public.capi_event_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own capi events"
ON public.capi_event_queue FOR SELECT
USING (auth.uid() = user_id);

CREATE TRIGGER trg_capi_queue_updated_at
BEFORE UPDATE ON public.capi_event_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
