import { create } from 'zustand';
import { authService, AuthUser } from '../services/auth';

type UserStore = {
    user: AuthUser | null;
    token: string | null;
    isLoading: boolean;
    isHydrated: boolean;
    setUser: (user: AuthUser | null) => void;
    setToken: (token: string | null) => void;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    token: null,
    isLoading: false,
    isHydrated: false,

    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),

    logout: async () => {
        await authService.logout();
        set({ user: null, token: null });
    },

    hydrate: async () => {
        set({ isLoading: true });
        try {
            const token = await authService.getStoredToken();
            const user = await authService.getStoredUser();
            if (token && user) {
                set({ token, user });
            }
        } catch {
            // Silently fail — user will see login screen
        } finally {
            set({ isLoading: false, isHydrated: true });
        }
    },
}));
