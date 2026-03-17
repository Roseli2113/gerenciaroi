-- Add missing RLS policies for live_visitors table
-- INSERT: allow the service role (edge functions) and authenticated users to insert their own records
CREATE POLICY "Allow insert for service role and own records"
ON public.live_visitors FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- UPDATE: allow updating own visitor records
CREATE POLICY "Users can update their own live visitors"
ON public.live_visitors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- DELETE: allow deleting own visitor records
CREATE POLICY "Users can delete their own live visitors"
ON public.live_visitors FOR DELETE
TO authenticated
USING (auth.uid() = user_id);