-- Allow public read of active event triggers and email templates 
-- so that automated emails can be dispatched from the frontend by any user.

-- First, drop existing restrictive select policies if they exist (to avoid duplicates or conflicts)
DROP POLICY IF EXISTS "Admins can view all event triggers" ON public.event_triggers;
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

-- Create more inclusive select policies
CREATE POLICY "Anyone can view active event triggers"
  ON public.event_triggers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active email templates"
  ON public.email_templates FOR SELECT
  USING (is_active = true);

-- Keep management policies for admins only
CREATE POLICY "Admins can manage event triggers"
  ON public.event_triggers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
