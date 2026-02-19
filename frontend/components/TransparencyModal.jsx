'use client';
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'raw', label: 'Raw Features' },
    { id: 'scaled', label: 'Scaled Features' },
    { id: 'vector', label: 'Feature Vector' },
    { id: 'json', label: 'ML Response JSON' },
];

function JsonBlock({ data }) {
    return (
        <pre style={{
            background: '#080d14', borderRadius: 8, padding: '12px 14px', fontSize: 10,
            color: '#86efac', fontFamily: 'monospace', overflowX: 'auto', lineHeight: 1.7,
            border: '1px solid rgba(134,239,172,0.1)', maxHeight: 320, overflowY: 'auto', margin: 0,
        }}>
            {JSON.stringify(data, null, 2)}
        </pre>
    );
}

function FeatureTable({ data, title, highlightKeys = [] }) {
    if (!data || !Object.keys(data).length) {
        return <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, padding: 8 }}>No data available.</div>;
    }
    return (
        <div>
            {title && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>{title}</div>}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 9 }}>Feature</th>
                        <th style={{ textAlign: 'right', color: 'rgba(255,255,255,0.3)', fontWeight: 600, padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', fontSize: 9 }}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(data).map(([key, val]) => {
                        const isHigh = highlightKeys.includes(key);
                        return (
                            <tr key={key} style={{ background: isHigh ? 'rgba(239,68,68,0.08)' : 'transparent' }}>
                                <td style={{ padding: '4px 8px', color: isHigh ? '#fca5a5' : 'rgba(255,255,255,0.6)', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{key}</td>
                                <td style={{ padding: '4px 8px', textAlign: 'right', color: isHigh ? '#fca5a5' : 'rgba(255,255,255,0.8)', fontFamily: 'monospace', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    {typeof val === 'number' ? val.toFixed(4) : String(val)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function TransparencyModal({ isOpen, onClose, ward, mlResponse, rawFeatures = {}, scaledFeatures = {} }) {
    const [tab, setTab] = useState('raw');

    const featureVector = [
        rawFeatures.temp_avg ?? rawFeatures.avgTemp7d ?? 28.0,
        rawFeatures.humidity_avg ?? rawFeatures.avgHumidity7d ?? 70.0,
        rawFeatures.rainfall_total ?? rawFeatures.avgRainfall7d ?? 0,
        rawFeatures.aqi ?? 0,
        rawFeatures.wqi ?? 0,
        rawFeatures.dailyAvg7d ?? rawFeatures.totalAdmissions7d ?? 0,
        rawFeatures.rainfall_total ?? rawFeatures.lagRainfall1d ?? 0,
    ];

    const handleDownload = () => {
        const report = {
            timestamp: new Date().toISOString(),
            wardId: ward?.wardId,
            modelVersion: 'XGBoost v1.0',
            dataset: 'delhi_5yr_outbreak_data.csv',
            rawFeatures,
            scaledFeatures,
            featureVector,
            mlResponse,
        };
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kavach-inference-${ward?.wardId}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', zIndex: 1000 }}
                    />
                    {/* Modal */}
                    <motion.div
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                        style={{
                            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                            width: '100%', maxWidth: 780, maxHeight: '82vh',
                            background: 'linear-gradient(180deg, #0d1117 0%, #080d14 100%)',
                            border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none',
                            borderRadius: '20px 20px 0 0', zIndex: 1001, display: 'flex', flexDirection: 'column',
                        }}
                    >
                        {/* Handle */}
                        <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ width: 36, height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2, margin: '0 auto 8px' }} />
                                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                                    ML Inference Drilldown — {ward?.wardId || 'Ward'}
                                </span>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                                    {new Date().toISOString()} · XGBoost v1.0 · delhi_5yr_outbreak_data.csv
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button onClick={handleDownload} style={{ background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}>
                                    ↓ Download JSON Report
                                </button>
                                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer' }}>
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 4, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                            {TABS.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)} style={{
                                    background: tab === t.id ? 'rgba(96,165,250,0.15)' : 'transparent',
                                    border: `1px solid ${tab === t.id ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.07)'}`,
                                    color: tab === t.id ? '#93c5fd' : 'rgba(255,255,255,0.45)',
                                    borderRadius: 6, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace',
                                    transition: 'all 0.15s',
                                }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
                            <AnimatePresence mode="wait">
                                <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                    {tab === 'raw' && <FeatureTable data={rawFeatures} title="Raw feature values sent by Node.js orchestrator" />}
                                    {tab === 'scaled' && <FeatureTable data={scaledFeatures} title="Feature values after StandardScaler normalization" highlightKeys={Object.entries(scaledFeatures).filter(([, v]) => Math.abs(v) > 2).map(([k]) => k)} />}
                                    {tab === 'vector' && (
                                        <div>
                                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 8 }}>Feature Vector (1×7) passed to XGBoost</div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                {featureVector.map((v, i) => (
                                                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 10px', textAlign: 'center', minWidth: 70 }}>
                                                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', marginBottom: 2 }}>F{i}</div>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{typeof v === 'number' ? v.toFixed(2) : v}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {tab === 'json' && <JsonBlock data={mlResponse || { note: 'ML response not yet available for this ward.' }} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default memo(TransparencyModal);
