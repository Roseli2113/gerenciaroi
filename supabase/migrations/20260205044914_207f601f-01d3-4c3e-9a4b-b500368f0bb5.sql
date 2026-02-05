-- Create automation_rules table for storing user rules
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value TEXT NOT NULL,
  action_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  applied_to TEXT NOT NULL DEFAULT 'all',
  is_active BOOLEAN NOT NULL DEFAULT true,
  executions INTEGER NOT NULL DEFAULT 0,
  last_execution TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rule_execution_logs table for execution history
CREATE TABLE public.rule_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  action_description TEXT NOT NULL,
  action_type TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on automation_rules
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for automation_rules
CREATE POLICY "Users can view their own rules"
  ON public.automation_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rules"
  ON public.automation_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
  ON public.automation_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
  ON public.automation_rules FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on rule_execution_logs
ALTER TABLE public.rule_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for rule_execution_logs
CREATE POLICY "Users can view their own execution logs"
  ON public.rule_execution_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own execution logs"
  ON public.rule_execution_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own execution logs"
  ON public.rule_execution_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();