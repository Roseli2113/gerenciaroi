ALTER TABLE public.automation_rules 
  ADD COLUMN last_execution_result text DEFAULT null,
  ADD COLUMN last_execution_affected integer DEFAULT 0;