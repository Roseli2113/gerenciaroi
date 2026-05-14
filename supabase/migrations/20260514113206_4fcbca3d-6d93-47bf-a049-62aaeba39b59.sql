
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'ai-insights-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://zwylxoajyyjflvvcwpvz.supabase.co/functions/v1/ai-insights',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eWx4b2FqeXlqZmx2dmN3cHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MjE1MjEsImV4cCI6MjA4MzI5NzUyMX0.jzm-31FhoWvdnrJ9tnmS6lNxKuqwnhvu4fNL61njQXg"}'::jsonb,
    body := '{"trigger":"cron"}'::jsonb
  );
  $$
);
