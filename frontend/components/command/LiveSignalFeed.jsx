import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useCommandStore from '../../store/commandStore';

// ── Mock signal pool ──────────────────────────────────────────────────────────
const SIGNAL_POOL = [
    { type: 'CASE_SPIKE', wardId: 'W-09', wardName: 'Seelampur', value: '+47 cases', severity: 'CRITICAL', icon: '📈' },
    { type: 'CASE_SPIKE', wardId: 'F-03', wardName: 'NIT Faridabad', value: '+31 cases', severity: 'HIGH', icon: '📈' },
    { type: 'CHLORINE_DROP', wardId: 'W-09', wardName: 'Seelampur', value: '0.14 mg/L ↓35%', severity: 'CRITICAL', icon: '🧪' },
    { type: 'CHLORINE_DROP', wardId: 'N-62', wardName: 'Noida Sec-62', value: '0.21 mg/L ↓22%', severity: 'HIGH', icon: '🧪' },
    { type: 'RAINFALL_ANOMALY', wardId: 'W-09', wardName: 'Seelampur', value: '48mm — overflow risk', severity: 'HIGH', icon: '🌧️' },
    { type: 'ICU_CHANGE', wardId: 'W-09', wardName: 'LNJP Hospital', value: '96% → 97% occupancy', severity: 'CRITICAL', icon: '🏥' },
    { type: 'ICU_CHANGE', wardId: 'W-14', wardName: 'GTB Hospital', value: '79% → 81% occupancy', severity: 'HIGH', icon: '🏥' },
    { type: 'CITIZEN_CLUSTER', wardId: 'W-09', wardName: 'Seelampur', value: '52 reports in 0.9km', severity: 'HIGH', icon: '📍' },
    { type: 'CITIZEN_CLUSTER', wardId: 'W-14', wardName: 'Shahdara', value: '38 fever reports', severity: 'MEDIUM', icon: '📍' },
    { type: 'CASE_SPIKE', wardId: 'W-14', wardName: 'Shahdara', value: '2.2× dengue spike', severity: 'HIGH', icon: '🦟' },
    { type: 'RAINFALL_ANOMALY', wardId: 'F-03', wardName: 'NIT Faridabad', value: '55mm — canal overflow', severity: 'HIGH', icon: '🌊' },
    { type: 'CHLORINE_DROP', wardId: 'W-18', wardName: 'Jahangirpuri', value: 'Pipeline breach confirmed', severity: 'HIGH', icon: '💧' },
    { type: 'ICU_CHANGE', wardId: 'W-30', wardName: 'Narela', value: 'ICU +5 admissions since 08:00', severity: 'MEDIUM', icon: '🏥' },
    { type: 'CITIZEN_CLUSTER', wardId: 'G-11', wardName: 'Manesar', value: '21 dengue confirmed', severity: 'HIGH', icon: '📍' },
    { type: 'CASE_SPIKE', wardId: 'W-22', wardName: 'Najafgarh', value: 'Resp. admissions ↑1.9×', severity: 'MEDIUM', icon: '💨' },
    { type: 'ICU_CHANGE', wardId: 'W-14', wardName: 'GTB Hospital', value: 'Bed utilization: 83%', severity: 'MEDIUM', icon: '🏥' },
    { type: 'CHLORINE_DROP', wardId: 'F-03', wardName: 'NIT Faridabad', value: 'Coliform: 980 MPN/100mL', severity: 'CRITICAL', icon: '🧪' },
    { type: 'CITIZEN_CLUSTER', wardId: 'N-62', wardName: 'Noida Sec-62', value: 'E.coli in 4 sample points', severity: 'HIGH', icon: '⚠️' },
];

const SEVERITY_STYLE = {
    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', badge: 'rgba(239,68,68,0.2)' },
    HIGH: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', badge: 'rgba(249,115,22,0.18)' },
    MEDIUM: { color: '#eab308', bg: 'rgba(234,179,8,0.07)', border: 'rgba(234,179,8,0.2)', badge: 'rgba(234,179,8,0.16)' },
    LOW: { color: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', badge: 'rgba(34,197,94,0.14)' },
};

const TYPE_LABEL = {
    CASE_SPIKE: 'Case Spike',
    CHLORINE_DROP: 'Water Alert',
    RAINFALL_ANOMALY: 'Rainfall',
    ICU_CHANGE: 'ICU Update',
    CITIZEN_CLUSTER: 'Cluster',
};

let globalPointer = 0;

function generateSignal() {
    const base = SIGNAL_POOL[globalPointer % SIGNAL_POOL.length];
    globalPointer++;
    return {
        ...base,
        id: `sig-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    };
}

function SignalItem({ signal }) {
    const s = SEVERITY_STYLE[signal.severity] || SEVERITY_STYLE.LOW;
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            style={{
                padding: '8px 10px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 10,
                display: 'flex', gap: 9, alignItems: 'flex-start',
                flexShrink: 0,
            }}
        >
            <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.4 }}>{signal.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{
                        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.09em', color: s.color,
                        background: s.badge, borderRadius: 4, padding: '1px 5px',
                    }}>
                        {TYPE_LABEL[signal.type] || signal.type}
                    </span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', flexShrink: 0 }}>
                        {signal.timestamp}
                    </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.86)', marginTop: 3, lineHeight: 1.35 }}>
                    {signal.wardName} · {signal.wardId}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                    {signal.value}
                </div>
            </div>
            {signal.severity === 'CRITICAL' && (
                <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: '#ef4444', flexShrink: 0, marginTop: 4,
                        boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                    }}
                />
            )}
        </motion.div>
    );
}

function LiveSignalFeed() {
    const { signalPaused, setSignalPaused } = useCommandStore();
    const [signals, setSignals] = useState(() => {
        // Seed with first 6 signals
        return Array.from({ length: 6 }, generateSignal);
    });
    const intervalRef = useRef(null);

    const tick = useCallback(() => {
        setSignals(prev => {
            const next = [generateSignal(), ...prev];
            return next.slice(0, 30); // cap at 30 items
        });
    }, []);

    useEffect(() => {
        if (signalPaused) {
            clearInterval(intervalRef.current);
        } else {
            intervalRef.current = setInterval(tick, 3000);
        }
        return () => clearInterval(intervalRef.current);
    }, [signalPaused, tick]);

    return (
        <div
            style={{
                display: 'flex', flexDirection: 'column',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14,
                overflow: 'hidden',
                height: '100%',
            }}
            onMouseEnter={() => setSignalPaused(true)}
            onMouseLeave={() => setSignalPaused(false)}
        >
            {/* Header */}
            <div style={{
                padding: '10px 14px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 8px rgba(34,197,94,0.8)',
                            display: 'inline-block',
                        }}
                    />
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                        Live Signal Feed
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {signalPaused && (
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                            paused
                        </span>
                    )}
                    <span style={{
                        fontSize: 9, color: '#22c55e',
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        borderRadius: 4, padding: '2px 6px', fontWeight: 700,
                    }}>
                        LIVE
                    </span>
                </div>
            </div>

            {/* Feed */}
            <div style={{
                flex: 1, overflowY: 'auto',
                padding: '8px 10px',
                display: 'flex', flexDirection: 'column', gap: 6,
            }}>
                <AnimatePresence initial={false}>
                    {signals.map(sig => (
                        <SignalItem key={sig.id} signal={sig} />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default memo(LiveSignalFeed);
