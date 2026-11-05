DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sales','webhooks','pixels','pixel_meta_ids','meta_connections','meta_ad_accounts','automation_rules','rule_execution_logs','budget_alerts','dashboard_layouts','platform_fees','manual_sale_attributions','sales_attribution_settings','live_visitors','integration_tests','api_credentials','webhook_logs','capi_event_queue']
  LOOP
    EXECUTE format('CREATE POLICY "Admins can view all rows (view as user)" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))', t);
  END LOOP;
END $$;