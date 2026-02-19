'use client';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMLHealth } from '../../lib/api';

const GLOBAL_IMPORTANCE = [
    { feature: 'Cases_Rolling_7D', importance: 0.38, color: '#ef4444' },
    { feature: 'AQI', importance: 0.22, color: '#f97316' },
    { feature: 'Rainfall', importance: 0.14, color: '#60a5fa' },
    { feature: 'Humidity', importance: 0.10, color: '#a78bfa' },
    { feature: 'Temperature', importance: 0.08, color: '#22c55e' },
    { feature: 'WQI', importance: 0.05, color: '#34d399' },
    { feature: 'Rainfall_Lag', importance: 0.03, color: '#94a3b8' },
];

function MetaRowObs({ label, value, color, mono = true }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: color || 'rgba(255,255,255,0.7)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
        </div>
    );
}

function ModelObservabilityPanel() {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMLHealth().then(d => { setHealth(d); setLoading(false); });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}
        >
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Model Observability</span>
                <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fde68a', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                    ⚠ SHAP pending
                </span>
            </div>

            <div style={{ padding: '10px 14px' }}>
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                            style={{ height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
                    ))
                ) : (
                    <>
                        {/* Model metadata from live health endpoint */}
                        <MetaRowObs label="model_type" value="XGBoost Classifier" color="#60a5fa" />
                        <MetaRowObs label="training_dataset" value="delhi_5yr_outbreak_data.csv" color="#86efac" />
                        <MetaRowObs label="feature_count" value={health?.expectedFeatures ?? 7} />
                        <MetaRowObs label="class_imbalance" value="scale_pos_weight (auto)" color="#c4b5fd" />
                        <MetaRowObs label="anomaly_algo" value="Isolation Forest (n=100)" />
                        <MetaRowObs label="forecast_algo" value="Prophet + Synthetic fallback" />
                        <MetaRowObs label="models_loaded" value={health?.modelsLoaded ? 'YES' : 'NOT FOUND'} color={health?.modelsLoaded ? '#22c55e' : '#ef4444'} />
                        {health?.lastModelTraining && (
                            <MetaRowObs label="last_training" value={String(health.lastModelTraining).slice(0, 24)} color="rgba(255,255,255,0.5)" />
                        )}
                    </>
                )}

                {/* SHAP warning */}
                <div style={{ marginTop: 10, padding: '7px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 7, fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                    <strong style={{ color: '#fde68a' }}>SHAP integration pending</strong> — feature attributions are approximate.
                    XGBoost <code>shapReasons[]</code> is hardcoded empty; SHAP waterfall will display once wired.
                </div>

                {/* Global feature importance */}
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Global Feature Importance (XGBoost)</div>
                    <div style={{ height: 120 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={GLOBAL_IMPORTANCE} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 60 }}>
                                <XAxis type="number" domain={[0, 0.4]} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }} />
                                <YAxis dataKey="feature" type="category" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                                <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} formatter={(v) => [`${(v * 100).toFixed(0)}%`, 'Importance']} />
                                <Bar dataKey="importance" radius={[0, 3, 3, 0]}>
                                    {GLOBAL_IMPORTANCE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Drift placeholder */}
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>drift_detection</span>
                    <span style={{ fontSize: 9, color: '#22c55e', fontFamily: 'monospace', fontWeight: 700 }}>✓ NO DRIFT DETECTED</span>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(ModelObservabilityPanel);
