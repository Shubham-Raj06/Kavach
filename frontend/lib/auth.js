/**
 * lib/auth.js
 * Client-side auth helpers for Kavach frontend.
 * Handles token storage, role decoding, and role-based redirects.
 */

const TOKEN_KEY = 'kavach_access_token';
const USER_KEY = 'kavach_user';

// ─── Token Storage ────────────────────────────────────────────────────────────

export const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear(); // Clear demo mode
};

// ─── User Cache ───────────────────────────────────────────────────────────────

export const setUser = (user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

// ─── JWT Decode (client-side, no verification) ───────────────────────────────

export const decodeToken = (token) => {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
};

export const getRole = () => {
    const token = getToken();
    if (!token) return null;
    const payload = decodeToken(token);
    if (!payload) return null;
    // Check expiry client-side (soft check — backend enforces hard expiry)
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload.role;
};

export const isAuthenticated = () => !!getRole();

// ─── Role → Route Mapping ─────────────────────────────────────────────────────

const ROLE_HOME = {
    GOV: '/gov',
    HOSPITAL: '/hospital',
    CITIZEN: '/community',
    SUPER_ADMIN: '/admin',
};

export const getHomeRoute = (role) => ROLE_HOME[role] || '/login';

export const redirectByRole = (router) => {
    const role = getRole();
    if (!role) {
        router.replace('/login');
        return;
    }
    router.replace(getHomeRoute(role));
};

// ─── Route Access Control Map ─────────────────────────────────────────────────
// Maps path prefixes to allowed roles (empty array = public)

export const ROUTE_ROLES = {
    '/gov': ['GOV', 'SUPER_ADMIN'],
    '/hospital': ['HOSPITAL', 'SUPER_ADMIN'],
    '/community': ['CITIZEN', 'SUPER_ADMIN'],
    '/admin': ['SUPER_ADMIN'],
    '/dashboard': [], // Public overview
    '/alerts': [], // Public alerts view
    '/login': [],
    '/signup': [],
    '/': [],
    '/unauthorized': [],
};

/**
 * Given a pathname, return the allowed roles.
 * Falls back to allowing all authenticated users if no match found.
 */
export const getAllowedRoles = (pathname) => {
    for (const prefix of Object.keys(ROUTE_ROLES)) {
        if (pathname === prefix || pathname.startsWith(prefix + '/')) {
            return ROUTE_ROLES[prefix];
        }
    }
    return null; // null = no restriction (fully public)
};
