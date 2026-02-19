import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ── API URL ──────────────────────────────────────────────────────────────────
// Update mobile/app.json → extra.apiUrl each session with your tunnel URL.
const RAW = Constants.expoConfig?.extra?.apiUrl || 'https://fluffy-dancers-stay.loca.lt';
export const API_URL = RAW.replace(/\/$/, '');

console.log('🔌 API_URL Configured:', API_URL);
console.log('📱 Constants.expoConfig:', JSON.stringify(Constants.expoConfig, null, 2));


const api = axios.create({
    baseURL: API_URL,
    timeout: 20000,
    headers: {
        'Content-Type': 'application/json',
        // CRITICAL: loca.lt tunnels intercept all requests without this header,
        // returning an HTML click-through page instead of JSON.
        'bypass-tunnel-reminder': 'true',
    },
    // Send cookies (needed for refresh-token cookie from new backend)
    withCredentials: true,
});

// ── Request interceptor — attach JWT access token ────────────────────────────
api.interceptors.request.use(async (config) => {
    try {
        const token = await SecureStore.getItemAsync('kavach_token');
        if (token && token !== 'demo_token') {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch { }
    return config;
});

// ── Response interceptor — normalize errors ──────────────────────────────────
api.interceptors.response.use(
    (response) => {
        // Detect loca.lt HTML click-through page disguised as 200
        const ct = response.headers?.['content-type'] || '';
        if (ct.includes('text/html')) {
            throw new Error(
                'Tunnel interception. Make sure:\n1. apiUrl in app.json is your current tunnel URL\n2. bypass-tunnel-reminder header is set (already set)'
            );
        }
        return response;
    },
    async (error) => {
        if (!error.response) {
            return Promise.reject(new Error(
                'Cannot reach server.\n• Is the backend running?\n• Is apiUrl in app.json your current tunnel URL?\n• Phone and laptop on same WiFi?'
            ));
        }
        const { status, data } = error.response;
        // Handle 401 TOKEN_EXPIRED — try refresh once
        if (status === 401 && data?.code === 'TOKEN_EXPIRED' && !error.config._retry) {
            error.config._retry = true;
            try {
                const { data: refreshData } = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
                    withCredentials: true,
                    headers: { 'bypass-tunnel-reminder': 'true' },
                });
                if (refreshData.token) {
                    await SecureStore.setItemAsync('kavach_token', refreshData.token);
                    error.config.headers.Authorization = `Bearer ${refreshData.token}`;
                    return api(error.config);
                }
            } catch { /* refresh failed — fall through to logout */ }
        }
        const msg = data?.error || data?.message || `Server error (${status})`;
        return Promise.reject(new Error(msg));
    }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
// New backend: role is uppercase CITIZEN/GOV/HOSPITAL, wardId is string
export const apiRegister = (data) =>
    api.post('/api/auth/register', data).then(r => r.data);

export const apiLogin = (email, password) =>
    api.post('/api/auth/login', { email, password }).then(r => r.data);

export const apiRefresh = () =>
    api.post('/api/auth/refresh').then(r => r.data);

export const apiLogout = () =>
    api.post('/api/auth/logout').then(r => r.data);

export const apiGetMe = () =>
    api.get('/api/auth/me').then(r => r.data);

export const apiUpdateDeviceToken = (fcmToken) =>
    api.put('/api/auth/device-token', { fcmToken }).then(r => r.data);

// ─── Citizen Reports ──────────────────────────────────────────────────────────
// POST /api/citizen  |  GET /api/citizen  |  GET /api/citizen/:wardId/cluster
export const apiSubmitReport = (data) =>
    api.post('/api/citizen', data).then(r => r.data);

export const apiGetMyReports = () =>
    api.get('/api/citizen').then(r => r.data);

export const apiGetWardCluster = (wardId) =>
    api.get(`/api/citizen/${wardId}/cluster`).then(r => r.data);

// ─── Risk ─────────────────────────────────────────────────────────────────────
// GET /api/risk/heatmap  |  GET /api/risk/:wardId  |  GET /api/risk/my-ward
export const apiGetHeatmap = () =>
    api.get('/api/risk/heatmap').then(r => r.data);

export const apiGetWardRisk = (wardId) =>
    api.get(`/api/risk/${wardId}`).then(r => r.data);

export const apiGetMyWardRisk = () =>
    api.get('/api/risk/my-ward').then(r => r.data);

// ─── Alerts ───────────────────────────────────────────────────────────────────
// GET /api/alerts  |  GET /api/alerts/:wardId  |  GET /api/alerts/my-ward
export const apiGetAlerts = (wardId) =>
    api.get(`/api/alerts/${wardId}`).then(r => r.data);

export const apiGetMyWardAlerts = () =>
    api.get('/api/alerts/my-ward').then(r => r.data);

export const apiCreateAlert = (data) =>
    api.post('/api/alerts', data).then(r => r.data);

// ─── Wards ────────────────────────────────────────────────────────────────────
export const apiGetWards = () =>
    api.get('/api/wards').then(r => r.data);

// ─── Hotspots ─────────────────────────────────────────────────────────────────
export const apiGetHotspots = () =>
    api.get('/api/hotspots').then(r => r.data);

// ─── Hospital ────────────────────────────────────────────────────────────────
export const apiGetHospitalOverview = () =>
    api.get('/api/hospital').then(r => r.data);

export default api;
