import { ReactNode } from 'react';
import { Shield, Lock } from 'lucide-react';
import { usePermissions } from '../contexts/PermissionsContext';
import { useTheme } from '../contexts/ThemeContext';

interface PermissionGuardProps {
    feature: string;
    action?: 'create' | 'read' | 'update' | 'delete';
    children: ReactNode;
    /** If true, renders nothing instead of the access denied UI */
    silent?: boolean;
}

/**
 * Wraps any admin page or action.
 * - If the user has the required permission, renders children.
 * - Otherwise renders a nice "Access Denied" screen (or nothing when silent=true).
 */
export function PermissionGuard({
    feature,
    action = 'read',
    children,
    silent = false,
}: PermissionGuardProps) {
    const { can, loading } = usePermissions();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    if (loading) return null;

    if (!can(feature, action)) {
        if (silent) return null;

        return (
            <div
                className={`flex flex-col items-center justify-center min-h-[60vh] text-center px-4 ${isDark ? 'text-slate-300' : 'text-slate-600'
                    }`}
            >
                <div
                    className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                >
                    <Lock className="h-9 w-9 text-slate-400" />
                </div>
                <h2
                    className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-slate-800'
                        }`}
                >
                    Access Restricted
                </h2>
                <p className="text-sm max-w-sm text-slate-500">
                    You don&apos;t have permission to view this module. Contact your
                    administrator to request access.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
                    <Shield className="h-3.5 w-3.5" />
                    <span>
                        Required:{' '}
                        <code className="font-mono text-emerald-500">
                            {feature}.{action}
                        </code>
                    </span>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
