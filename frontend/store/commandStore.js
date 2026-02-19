import { create } from 'zustand';

const useCommandStore = create((set, get) => ({
    // ── Emergency Command Mode ────────────────────────────────────────────────
    commandMode: false,
    toggleCommandMode: () => {
        const next = !get().commandMode;
        set({ commandMode: next });
        // Subtle audio cue when activating (respects soundEnabled flag)
        if (next && get().soundEnabled && typeof window !== 'undefined') {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.18, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.4);
            } catch (_) { /* silenced — Web Audio not available */ }
        }
    },

    // ── Sound Toggle ─────────────────────────────────────────────────────────
    soundEnabled: true,
    toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),

    // ── Ward Selection ────────────────────────────────────────────────────────
    selectedWard: null,
    setSelectedWard: (ward) => set({ selectedWard: ward }),

    // ── Signal Feed ───────────────────────────────────────────────────────────
    signalPaused: false,
    setSignalPaused: (paused) => set({ signalPaused: paused }),

    // ── Surge Panel ───────────────────────────────────────────────────────────
    surgeExpanded: false,
    setSurgeExpanded: (v) => set({ surgeExpanded: v }),
}));

export default useCommandStore;
