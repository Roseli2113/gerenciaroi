
CREATE TABLE public.integration_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  platform TEXT NOT NULL,
  link TEXT NOT NULL,
  use_pixel BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tests" ON public.integration_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tests" ON public.integration_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tests" ON public.integration_tests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tests" ON public.integration_tests FOR DELETE USING (auth.uid() = user_id);
