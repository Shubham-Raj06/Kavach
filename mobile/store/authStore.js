import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiLogin, apiRegister, apiGetMe, apiUpdateDeviceToken, apiLogout } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import { registerForPushNotificationsAsync } from '../services/notification';

// ── Demo users for offline bypass ─────────────────────────────────────────────
const DEMO_USERS = {
    CITIZEN: { id: 'demo-1', name: 'Demo Citizen', email: 'citizen@demo.in', role: 'CITIZEN', wardId: '42', isActive: true },
    HOSPITAL: { id: 'demo-2', name: 'Demo Hospital', email: 'hospital@demo.in', role: 'HOSPITAL', wardId: '42', isActive: true },
    GOV: { id: 'demo-3', name: 'Demo Govt', email: 'govt@demo.in', role: 'GOV', wardId: null, isActive: true },
};

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoading: true,
    isDemo: false,
    error: null,

    // ── Load persisted session on app start ─────────────────────────────────
    loadUser: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = await SecureStore.getItemAsync('kavach_token');
            if (!token) { set({ isLoading: false }); return; }

            const user = await apiGetMe();
            await connectSocket();
            set({ user, token, isLoading: false });

            // Save push token
            try {
                const fcmToken = await registerForPushNotificationsAsync();
                if (fcmToken) await apiUpdateDeviceToken(fcmToken);
            } catch { /* Push registration optional */ }
        } catch (e) {
            // Token invalid / expired — clear store
            await SecureStore.deleteItemAsync('kavach_token').catch(() => { });
            set({ user: null, token: null, isLoading: false });
        }
    },

    // ── Login ────────────────────────────────────────────────────────────────
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = await apiLogin(email, password);
            await SecureStore.setItemAsync('kavach_token', token);
            await connectSocket();
            set({ user, token, isLoading: false });

            try {
                const fcmToken = await registerForPushNotificationsAsync();
                if (fcmToken) await apiUpdateDeviceToken(fcmToken);
            } catch { }
        } catch (e) {
            set({ error: e.message, isLoading: false });
            throw e;
        }
    },

    // ── Register ─────────────────────────────────────────────────────────────
    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const { token, user } = await apiRegister(data);
            await SecureStore.setItemAsync('kavach_token', token);
            await connectSocket();
            set({ user, token, isLoading: false });
        } catch (e) {
            set({ error: e.message, isLoading: false });
            throw e;
        }
    },

    // ── Demo login — no network calls ────────────────────────────────────────
    demoLogin: async (role) => {
        set({ isLoading: true, error: null });
        const key = role.toUpperCase();
        const user = DEMO_USERS[key] || DEMO_USERS.CITIZEN;
        await new Promise(r => setTimeout(r, 500)); // simulate load
        set({ user, token: 'demo_token', isLoading: false, isDemo: true });
    },

    // ── Logout ───────────────────────────────────────────────────────────────
    logout: async () => {
        const { isDemo } = get();
        if (!isDemo) {
            try { await apiLogout(); } catch { }
        }
        disconnectSocket();
        await SecureStore.deleteItemAsync('kavach_token').catch(() => { });
        set({ user: null, token: null, isDemo: false, error: null });
    },
}));

export default useAuthStore;
