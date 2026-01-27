-- Fix Payment Gateways Access for Everyone
-- This ensures customers can see and select payment methods during checkout

-- Enable RLS on payment_gateways
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Public view active gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Anyone can view active gateways" ON public.payment_gateways;
DROP POLICY IF EXISTS "Authenticated users view active gateways" ON public.payment_gateways;

-- Allow EVERYONE (authenticated AND anonymous) to view active gateways
CREATE POLICY "Anyone can view active gateways" 
ON public.payment_gateways 
FOR SELECT 
USING (is_active = true);

-- Also ensure payment_instructions are viewable for active gateways
ALTER TABLE public.payment_instructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active instructions" ON public.payment_instructions;

CREATE POLICY "Public view active instructions" 
ON public.payment_instructions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.payment_gateways 
        WHERE payment_gateways.id = payment_instructions.gateway_id 
        AND payment_gateways.is_active = true
    )
);

NOTIFY pgrst, 'reload schema';
