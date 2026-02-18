
-- Table to track live visitors on external sales pages
CREATE TABLE public.live_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  page_url TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast cleanup of stale sessions and user queries
CREATE INDEX idx_live_visitors_user_id ON public.live_visitors (user_id);
CREATE INDEX idx_live_visitors_last_seen ON public.live_visitors (last_seen_at);
CREATE UNIQUE INDEX idx_live_visitors_session ON public.live_visitors (session_id);

-- Enable RLS
ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

-- Users can view their own visitors
CREATE POLICY "Users can view their own live visitors"
  ON public.live_visitors FOR SELECT
  USING (auth.uid() = user_id);

-- Allow anonymous inserts/updates via edge function (service role)
-- The edge function uses service role key, so no anon policy needed for writes

-- Allow service role to manage all rows (handled by default)

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_visitors;
