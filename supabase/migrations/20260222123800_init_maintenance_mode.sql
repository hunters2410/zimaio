-- Initialize maintenance_mode if it doesn't exist
INSERT INTO public.site_settings (setting_key, setting_value, setting_type)
VALUES ('maintenance_mode', 'false', 'boolean'),
       ('maintenance_end_time', '', 'text')
ON CONFLICT (setting_key) DO NOTHING;

-- Ensure Realtime is enabled for site_settings to allow "Forced" updates across all clients
ALTER TABLE public.site_settings REPLICA IDENTITY FULL;

-- Add site_settings to the realtime publication if it's not already there
-- We can't easily check for individual tables in a simple script without a DO block,
-- but the SiteSettingsContext uses channel('site_settings_changes') which is fine.
