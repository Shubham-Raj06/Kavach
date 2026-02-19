import { create } from 'zustand';
import { apiGetHeatmap, apiGetWardRisk } from '../services/api';

const useRiskStore = create((set) => ({
    heatmap: [],
    wardRisk: null,
    isLoading: false,
    error: null, // Fix P1: expose error so screens can show banner

    fetchHeatmap: async () => {
        set({ isLoading: true, error: null });
        try {
            // New backend: GET /api/risk/heatmap returns array
            const data = await apiGetHeatmap();
            const heatmap = Array.isArray(data) ? data : (data?.heatmap || []);
            set({ heatmap, isLoading: false });
        } catch (e) {
            set({ isLoading: false, error: e.message });
        }
    },

    fetchWardRisk: async (wardId) => {
        if (!wardId) return;
        set({ isLoading: true, error: null });
        try {
            // New backend: GET /api/risk/:wardId returns prediction object
            const data = await apiGetWardRisk(wardId);
            // Backend may return { risk } or the risk object directly
            const wardRisk = data?.risk ?? data;
            set({ wardRisk, isLoading: false });
        } catch (e) {
            set({ isLoading: false, error: e.message });
        }
    },

    updateRisk: (newRisk) => {
        set((state) => ({
            wardRisk: state.wardRisk?.wardId === newRisk.wardId
                ? { ...state.wardRisk, ...newRisk }
                : state.wardRisk,
            heatmap: state.heatmap.map(h =>
                h.wardId === newRisk.wardId ? { ...h, ...newRisk } : h
            ),
        }));
    },
}));

export default useRiskStore;
