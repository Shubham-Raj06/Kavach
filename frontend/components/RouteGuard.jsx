import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getRole, getAllowedRoles } from '../lib/auth';

/**
 * RouteGuard
 * Wraps every page in _app.js.
 *
 * Auth modes:
 *   1. REAL — user has a valid JWT in localStorage (kavach_access_token). Full RBAC enforced.
 *   2. DEMO — user navigated via quick-login button; `kavach_demo_role` is set in sessionStorage.
 *             Role checks use the demo role. No token present.
 *
 * On each navigation:
 *   - Public routes (/login, /, /unauthorized) → always allow
 *   - Protected routes → check real token OR demo role
 *   - Wrong role → /unauthorized
 *   - Not authenticated (no token, no demo) → /login
 */
export default function RouteGuard({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const check = () => {
            const pathname = router.pathname;
            const allowedRoles = getAllowedRoles(pathname);

            // Always allow fully public routes
            if (allowedRoles !== null && allowedRoles.length === 0) {
                setAuthorized(true);
                return;
            }

            // Try real JWT role first
            const realRole = getRole();

            // Try demo mode (set by quick-login buttons)
            const demoRole = typeof window !== 'undefined'
                ? sessionStorage.getItem('kavach_demo_role')
                : null;

            const role = realRole || demoRole;

            // Not authenticated at all
            if (!role) {
                setAuthorized(false);
                router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
                return;
            }

            // null allowedRoles = any authenticated user
            if (allowedRoles === null) {
                setAuthorized(true);
                return;
            }

            // Role not permitted
            if (!allowedRoles.includes(role)) {
                setAuthorized(false);
                router.replace('/unauthorized');
                return;
            }

            setAuthorized(true);
        };

        check();
        router.events.on('routeChangeComplete', check);
        return () => router.events.off('routeChangeComplete', check);
    }, [router]);

    return authorized ? children : null;
}
