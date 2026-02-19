'use client';
import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMLHealth } from '../../lib/api';

const STATUS_COLORS = {
    ok: { dot: '#22c55e', glow: 'rgba(34,197,94,0.4)', label: 'ONLINE', text: '#22c55e' },
    unavailable: { dot: '#ef4444', glow: 'rgba(239,68,68,0.4)', label: 'OFFLINE', text: '#ef4444' },
    degraded: { dot: '#f59e0b', glow: 'rgba(245,158,11,0.4)', label: 'DEGRADED', text: '#f59e0b' },
};

const MODEL_LABELS = {
    classifier: 'XGBoost Classifier',
    scaler: 'StandardScaler',
    iso_forest: 'Isolation Forest',
    prophet: 'Prophet Forecaster',
};

function PulsingDot({ color, glow }) {
    return (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 10, height: 10 }}>
            <motion.span
                animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: glow }}
            />
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${glow}` }} />
        </span>
    );
}

function MetaRow({ label, value, mono = true, color }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: color || 'rgba(255,255,255,0.8)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
        </div>
    );
}

function MLStatusPanel() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastFetched, setLastFetched] = useState(null);

    const fetchHealth = async () => {
        const data = await getMLHealth();
        setHealth(data);
        setLastFetched(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 60_000); // poll every 60s
        return () => clearInterval(interval);
    }, []);

    const statusKey = health?.status === 'ok' ? 'ok' : health?.status === 'unavailable' ? 'unavailable' : 'degraded';
    const sc = STATUS_COLORS[statusKey];
    const isDown = statusKey === 'unavailable';

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'rgba(255,255,255,0.025)',
                border: `1px solid ${isDown ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 14,
                overflow: 'hidden',
                minWidth: 220,
                flexShrink: 0,
            }}
        >
            {/* Offline banner */}
            <AnimatePresence>
                {isDown && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ background: 'rgba(239,68,68,0.2)', borderBottom: '1px solid rgba(239,68,68,0.4)', padding: '6px 14px', fontSize: 10, color: '#fca5a5', fontWeight: 700, letterSpacing: '0.06em' }}
                    >
                        ⚠ ML SERVICE UNAVAILABLE — displaying last stored predictions
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>ML Service</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loading ? (
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ width: 42, height: 16, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px', border: `1px solid ${sc.dot}33` }}>
                            <PulsingDot color={sc.dot} glow={sc.glow} />
                            <span style={{ fontSize: 10, fontWeight: 800, color: sc.text, fontFamily: 'monospace', letterSpacing: '0.08em' }}>{sc.label}</span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '8px 14px 12px' }}>
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                            style={{ height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
                    ))
                ) : (
                    <>
                        <MetaRow label="service" value={health?.service || 'kavach-ml'} color="#60a5fa" />
                        <MetaRow label="models_loaded" value={health?.modelsLoaded ? 'YES' : 'NO'} color={health?.modelsLoaded ? '#22c55e' : '#ef4444'} />
                        <MetaRow label="expected_features" value={health?.expectedFeatures ?? 7} />
                        <MetaRow label="last_training" value={health?.lastModelTraining ? new Date(health.lastModelTraining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : health?.lastModelTraining || '—'} />

                        {/* Active models */}
                        {(health?.activeModels || []).length > 0 && (
                            <>
                                <div style={{ marginTop: 8, marginBottom: 4, fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Models</div>
                                {health.activeModels.map(m => (
                                    <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                                        <PulsingDot color="#22c55e" glow="rgba(34,197,94,0.3)" />
                                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>{MODEL_LABELS[m] || m}</span>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Last polled */}
                        {lastFetched && (
                            <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'right', fontFamily: 'monospace' }}>
                                polled {lastFetched.toLocaleTimeString()}
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default memo(MLStatusPanel);
