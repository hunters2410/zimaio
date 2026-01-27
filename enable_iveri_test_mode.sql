-- Enable iVeri Test Mode in Database
-- This sets the mode to "Test" which bypasses actual iVeri API calls

UPDATE payment_gateways
SET configuration = jsonb_set(
  COALESCE(configuration, '{}'::jsonb),
  '{mode}',
  '"Test"'::jsonb
)
WHERE gateway_type = 'iveri';
