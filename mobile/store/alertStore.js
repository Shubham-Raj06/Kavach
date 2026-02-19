import { create } from 'zustand';
import { apiGetAlerts, apiCreateAlert } from '../services/api';

const useAlertStore = create((set, get) => ({
    alerts: [],
    isLoading: false,
    error: null, // Fix P1: expose error so screens can show banner

    fetchAlerts: async (wardId) => {
        if (!wardId) return;
        set({ isLoading: true, error: null });
        try {
            // New backend returns array directly from /api/alerts/:wardId
            const data = await apiGetAlerts(wardId);
            const alerts = Array.isArray(data) ? data : (data?.alerts || []);
            set({ alerts, isLoading: false });
        } catch (e) {
            set({ isLoading: false, error: e.message });
        }
    },

    addAlert: (alert) => {
        set((state) => ({ alerts: [alert, ...state.alerts] }));
    },

    createAlert: async (data) => {
        const { alert } = await apiCreateAlert(data);
        get().addAlert(alert);
        return alert;
    },
}));

export default useAlertStore;
