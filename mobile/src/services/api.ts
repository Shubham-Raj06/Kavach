import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// EXPO_PUBLIC_API_BASE_URL is set in mobile/.env
// Fallback to the live localtunnel for development
const RAW_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://10.69.18.203:5000';
const BASE_URL = RAW_BASE.replace(/\/$/, '') + '/api';

console.log('[api.ts] BASE_URL:', BASE_URL);

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        // Required for loca.lt tunnels — prevents click-through interception page
        'bypass-tunnel-reminder': 'true',
    },
});

// Attach JWT on every request
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('kavach_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { }
    return config;
});

// Global error handler — 401 clears token
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('kavach_token');
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    register: (data: { email: string; password: string; name: string; wardId?: string }) =>
        api.post('/auth/register', { ...data, role: 'CITIZEN' }),
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
    updateDeviceToken: (fcmToken: string) =>
        api.put('/auth/device-token', { fcmToken }),
};

// ── Risk ──────────────────────────────────────────────────────────────────────
export const riskApi = {
    myWard: () => api.get('/risk/my-ward'),
    byWard: (wardId: string) => api.get(`/risk/${wardId}`),
};

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alertsApi = {
    myWard: () => api.get('/alerts/my-ward'),
    byWard: (wardId: string) => api.get(`/alerts/${wardId}`),
};

// ── Citizen Reports ───────────────────────────────────────────────────────────
export const reportApi = {
    submit: (data: {
        wardId: string;
        latitude: number;
        longitude: number;
        syndromeType: string;
        severity: number;
        description?: string;
    }) => api.post('/citizen', data),
};
