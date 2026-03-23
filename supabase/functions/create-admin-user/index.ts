import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        // Create a client with the Service Role Key to bypass RLS and use Admin API
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user: callerUser }, error: verifyError } = await supabaseAdmin.auth.getUser(token);

        if (verifyError || !callerUser) {
            throw new Error('Unauthorized');
        }

        // Verify caller is an admin in the profiles table
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        if (profileError || callerProfile?.role !== 'admin') {
            throw new Error('Forbidden: Only admins can create new users');
        }

        // Read the request body
        const { email, password, full_name, role_id } = await req.json();

        if (!email || !password || !full_name || !role_id) {
            throw new Error('Missing required fields: email, password, full_name, role_id');
        }

        // Fetch the role details
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('id, role_name')
            .eq('id', role_id)
            .single();

        if (roleError || !roleData) {
            throw new Error('Invalid role selected');
        }

        // Determine the base system role
        const systemRole = roleData.role_name.toLowerCase() === 'admin' ? 'admin' : 'staff';

        // Attempt to create the user in auth.users
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name,
                role: systemRole
            }
        });

        if (createError) {
            throw createError;
        }

        const userId = newAuthUser.user.id;


        // Create the profile in public.profiles
        const { error: insertProfileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name,
                role: systemRole,
                is_verified: true,
                is_active: true
            });

        if (insertProfileError) {
            throw insertProfileError;
        }

        // Assign the RBAC role
        const { error: assignError } = await supabaseAdmin
            .from('user_role_assignments')
            .insert({
                user_id: userId,
                role_id: role_id,
                assigned_by: callerUser.id
            });

        if (assignError) {
            throw assignError;
        }

        // Create wallet for the new user as well
        await supabaseAdmin
            .from('wallets')
            .insert({
                user_id: userId,
                balance: 0
            })
            .select()
            .maybeSingle();

        return new Response(
            JSON.stringify({
                message: 'User created successfully',
                user: { id: userId, email, full_name, role: systemRole }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (err: any) {
        return new Response(
            JSON.stringify({ error: err.message || 'An error occurred' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
