
CREATE TABLE public.checkout_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_token text NOT NULL,
  customer_email text NOT NULL,
  utm_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkout_tracking_email ON public.checkout_tracking (customer_email, created_at DESC);
CREATE INDEX idx_checkout_tracking_token ON public.checkout_tracking (webhook_token);

-- Auto-cleanup: entries older than 24h are not useful
-- No RLS needed - accessed only via service role from edge functions
ALTER TABLE public.checkout_tracking ENABLE ROW LEVEL SECURITY;
