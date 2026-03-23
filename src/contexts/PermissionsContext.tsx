import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type PermissionAction = 'create' | 'read' | 'update' | 'delete';
type Permissions = Record<string, Record<string, boolean>>;

interface PermissionsContextType {
    permissions: Permissions;
    loading: boolean;
    can: (feature: string, action: PermissionAction) => boolean;
    isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
    permissions: {},
    loading: true,
    can: () => false,
    isAdmin: false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth();
    const [permissions, setPermissions] = useState<Permissions>({});
    const [loading, setLoading] = useState(true);

    const isAdmin = profile?.role === 'admin';

    useEffect(() => {
        if (!user) {
            setPermissions({});
            setLoading(false);
            return;
        }

        if (isAdmin) {
            // Admins have all permissions; no DB fetch needed
            setPermissions({});
            setLoading(false);
            return;
        }

        fetchPermissions(user.id);
    }, [user, isAdmin]);

    const fetchPermissions = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_user_permissions', {
                user_uuid: userId,
            });

            if (error) throw error;
            setPermissions((data as Permissions) || {});
        } catch (err) {
            console.error('[PermissionsContext] Failed to fetch permissions:', err);
            setPermissions({});
        } finally {
            setLoading(false);
        }
    };

    const can = (feature: string, action: PermissionAction): boolean => {
        // Admins always have full access
        if (isAdmin) return true;
        return permissions?.[feature]?.[action] === true;
    };

    return (
        <PermissionsContext.Provider value={{ permissions, loading, can, isAdmin }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    return useContext(PermissionsContext);
}
