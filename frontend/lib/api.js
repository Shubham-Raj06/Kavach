import axios from 'axios';
import {
    WARDS, KPI, ALERTS, CATEGORY_DATA, ADMISSION_TREND,
    HOSPITALS, ICU_FORECAST, GOV_DISTRICT_DATA, RESOURCE_PREDICTION,
    SYMPTOM_TREND, ADVISORIES, generateForecast,
} from './mockData';

const TOKEN_KEY = 'kavach_access_token';
const USER_KEY = 'kavach_user';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_URL, timeout: 10000 });
const mlApi = axios.create({ baseURL: ML_URL, timeout: 10000 });

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                }).then((token) => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return axios(original);
                });
            }
            original._retry = true;
            isRefreshing = true;
            try {
                const r = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
                const newToken = r.data.token;
                localStorage.setItem(TOKEN_KEY, newToken);
                if (r.data.user) localStorage.setItem(USER_KEY, JSON.stringify(r.data.user));
                refreshQueue.forEach(({ resolve }) => resolve(newToken));
                refreshQueue = [];
                original.headers.Authorization = `Bearer ${newToken}`;
                return api(original);
            } catch {
                refreshQueue.forEach(({ reject }) => reject(error));
                refreshQueue = [];
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                // Only redirect to /login if not in demo mode
                const inDemoMode = typeof window !== 'undefined' && sessionStorage.getItem('kavach_demo_role');
                if (typeof window !== 'undefined' && !inDemoMode) {
                    window.location.href = '/login';
                }
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
    api.post('/api/auth/login', { email, password }).then((r) => r.data);

export const register = (data) =>
    api.post('/api/auth/register', data).then((r) => r.data);

export { TOKEN_KEY, USER_KEY };

// ── Risk Summary ──────────────────────────────────────────────────────────────
export async function getRiskSummary() {
    try {
        const r = await api.get('/api/risk/summary');
        return r.data;
    } catch {
        return { kpi: KPI, wards: WARDS };
    }
}

// ── Hotspots ──────────────────────────────────────────────────────────────────
export async function getHotspots() {
    try {
        const r = await api.get('/api/hotspots');
        return r.data;
    } catch {
        return WARDS.filter(w => w.riskScore >= 60);
    }
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export async function getAlerts(wardId) {
    try {
        const r = await api.get(`/api/alerts${wardId ? `/${wardId}` : ''}`);
        return r.data;
    } catch {
        return wardId ? ALERTS.filter(a => a.wardId === wardId) : ALERTS;
    }
}

// ── Ward Forecast ─────────────────────────────────────────────────────────────
export async function getWardForecast(wardId, horizon = 48) {
    try {
        const r = await mlApi.get(`/forecast/${wardId}?horizon=${horizon}`);
        return r.data.points;
    } catch {
        const ward = WARDS.find(w => w.wardId === wardId) || WARDS[0];
        return generateForecast(ward);
    }
}

// ── Heatmap ───────────────────────────────────────────────────────────────────
export async function getHeatmap() {
    try {
        const r = await api.get('/api/risk/heatmap');
        return r.data;
    } catch {
        return WARDS;
    }
}

// ── Hospital Summary ──────────────────────────────────────────────────────────
export async function getHospitalSummary(wardId, days = 7) {
    try {
        const r = await api.get(`/api/hospital/${wardId}/summary?days=${days}`);
        return r.data;
    } catch {
        return HOSPITALS.find(h => h.ward === wardId) || HOSPITALS[0];
    }
}

// ── All Hospitals ─────────────────────────────────────────────────────────────
export async function getAllHospitals() {
    try {
        const r = await api.get('/api/hospitals');
        return r.data;
    } catch {
        return HOSPITALS;
    }
}

// ── Wards ─────────────────────────────────────────────────────────────────────
export async function getWards() {
    try {
        const r = await api.get('/api/wards');
        return r.data;
    } catch {
        return WARDS;
    }
}

// ── Water Quality ─────────────────────────────────────────────────────────────
export const getWaterLatest = (wardId) =>
    api.get(`/api/water/${wardId}/latest`).then((r) => r.data);

export const createAlert = (data) =>
    api.post('/api/alerts', data).then((r) => r.data);

// ── Dashboard (new contract) ───────────────────────────────────────────────────
export async function getDashboardData(district, disease, severity) {
    try {
        const params = {};
        if (district && district !== 'All Districts') params.district = district;
        if (disease && disease !== 'All Diseases') params.disease = disease;
        if (severity && severity !== 'All Severities') params.severity = severity;
        const r = await api.get('/api/dashboard', { params });
        return r.data;
    } catch {
        return { wards: [], summary: {}, alerts: ALERTS, isStale: true };
    }
}

export async function getWardDetail(id, disease) {
    try {
        const url = `/api/ward/${id}${disease ? `?disease=${disease}` : ''}`;
        const r = await api.get(url);
        return r.data;
    } catch {
        return null;
    }
}

// ── ML Proxy (via backend — never call ML service directly) ───────────────────

/** GET /api/ml/health */
export async function getMLHealth() {
    try {
        const r = await api.get('/api/ml/health');
        return r.data;
    } catch (err) {
        return {
            status: 'unavailable',
            service: 'kavach-ml',
            modelsLoaded: false,
            activeModels: [],
            error: err.message,
        };
    }
}

/** POST /api/ml/predict */
export async function postMLPredict(wardId, features) {
    const r = await api.post('/api/ml/predict', { wardId, features });
    return r.data;
}

/** POST /api/ml/anomaly */
export async function postMLAnomaly(wardId, features) {
    const r = await api.post('/api/ml/anomaly', { wardId, features });
    return r.data;
}

/** GET /api/ml/forecast/:wardId */
export async function getMLForecast(wardId, horizon = 48) {
    const r = await api.get(`/api/ml/forecast/${wardId}?horizon=${horizon}`);
    return r.data;
}

/** POST /api/ml/hotspots */
export async function postMLHotspots(wards) {
    const r = await api.post('/api/ml/hotspots', wards);
    return r.data;
}

export default api;
