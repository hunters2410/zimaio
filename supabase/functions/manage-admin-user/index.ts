import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
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

        // Verify caller is an authorized portal user (admin, staff, or sub_admin)
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single();

        const authorizedRoles = ['admin', 'staff', 'sub_admin'];
        if (profileError) {
            throw new Error(`Forbidden: Could not verify your role (Error: ${profileError.message})`);
        }
        if (!callerProfile || !authorizedRoles.includes(callerProfile.role)) {
            throw new Error(`Forbidden: Role '${callerProfile?.role || 'unknown'}' is not authorized to manage users`);
        }

        // Read the request body
        const { action, userId, payload } = await req.json();

        if (!action || !userId) {
            throw new Error('Missing required fields: action, userId');
        }

        // Helper to check specific permissions
        const checkPermission = async (feature: string, permission: string) => {
            if (callerProfile.role === 'admin') return true; // Super-admin bypass
            const { data: hasPerm, error } = await supabaseAdmin.rpc('user_has_permission', {
                user_uuid: callerUser.id,
                feature_name: feature,
                permission_type: permission
            });
            if (error) throw error;
            return hasPerm;
        };

        if (userId === callerUser.id && (action === 'delete' || action === 'toggle_status')) {
            throw new Error('You cannot modify your own administrative status this way.');
        }

        if (action === 'delete') {
            // Check for roles delete permission
            const canDelete = await checkPermission('roles', 'delete');
            if (!canDelete) {
                throw new Error('Forbidden: You do not have permission to delete users');
            }

            // Delete the user from auth.users (cascades to profiles and assignments)
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (deleteError) throw deleteError;

            return new Response(JSON.stringify({ message: 'User deleted successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (action === 'toggle_status') {
            // Check for roles update permission
            const canUpdate = await checkPermission('roles', 'update');
            if (!canUpdate) {
                throw new Error('Forbidden: You do not have permission to update user status');
            }

            const { is_active } = payload;
            if (typeof is_active !== 'boolean') {
                throw new Error('Missing boolean payload.is_active');
            }

            // Update profile
            const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({ is_active }).eq('id', userId);
            if (profileUpdateError) throw profileUpdateError;

            // If deactivated, we could also ban the user in Supabase Auth to prevent login
            // Using a simple ban approach: if false, ban for a long time; if true, lift ban
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                ban_duration: is_active ? 'none' : '87600h' // 10 years ban effectively inactivates auth
            });
            if (authUpdateError) throw authUpdateError;

            return new Response(JSON.stringify({ message: `User status updated successfully` }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        if (action === 'update_user') {
            // Check for roles update permission
            const canUpdate = await checkPermission('roles', 'update');
            if (!canUpdate) {
                throw new Error('Forbidden: You do not have permission to update users');
            }

            const { full_name, email, password, role_id } = payload;

            if (!full_name || !email || !role_id) {
                throw new Error('Missing required fields: full_name, email, role_id');
            }

            // Validate the new role
            const { data: roleData, error: roleError } = await supabaseAdmin
                .from('user_roles')
                .select('id, role_name')
                .eq('id', role_id)
                .single();

            if (roleError || !roleData) {
                throw new Error('Invalid role selected');
            }

            const systemRole = roleData.role_name.toLowerCase() === 'admin' ? 'admin' : 'staff';

            // SECURITY CHECK: Only super-admins can create/update users to have the 'admin' role
            if (systemRole === 'admin' && callerProfile.role !== 'admin') {
                throw new Error('Forbidden: Only super-admins can assign the admin role');
            }

            // Update Auth User
            const authUpdateData: any = {
                email,
                user_metadata: { full_name, role: systemRole }
            };
            if (password) authUpdateData.password = password; // Only update if provided

            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdateData);
            if (authUpdateError) throw authUpdateError;

            // Update Profile
            const { error: profileUpdateError } = await supabaseAdmin.from('profiles').update({
                full_name,
                email,
                role: systemRole
            }).eq('id', userId);
            if (profileUpdateError) throw profileUpdateError;

            // Update Role Assignment (assuming user has only one primary role assignment)
            // First drop existing for this user, then assign new
            await supabaseAdmin.from('user_role_assignments').delete().eq('user_id', userId);
            const { error: assignError } = await supabaseAdmin.from('user_role_assignments').insert({
                user_id: userId,
                role_id: role_id,
                assigned_by: callerUser.id
            });
            if (assignError) throw assignError;

            return new Response(JSON.stringify({ message: 'User updated successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        throw new Error('Invalid action specified');

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
