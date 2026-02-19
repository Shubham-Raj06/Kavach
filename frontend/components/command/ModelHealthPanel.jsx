import { memo } from 'react';
import { motion } from 'framer-motion';

// ── Mock model metadata ───────────────────────────────────────────────────────
const MODEL_META = {
    version: 'kavach-outbreak-v2.4.1',
    lastRetrained: '2026-02-14 03:12 UTC',
    framework: 'XGBoost + Neural Ensemble',
    auc: 0.9174,
    precision: 0.882,
    recall: 0.867,
    f1: 0.874,
    driftStatus: 'WARNING',
    featureDriftIndex: 0.38,   // 0–1; > 0.3 triggers warning
    driftThreshold: 0.30,
    dataCompleteness: 0.84,    // 84%
    trainingSamples: 1847392,
    featureCount: 47,
};

// Drift history over past 7 days (0–1 scale, simulated)
const DRIFT_HISTORY = [0.12, 0.16, 0.19, 0.22, 0.28, 0.33, 0.38];
const AUC_HISTORY = [0.931, 0.928, 0.924, 0.921, 0.919, 0.918, 0.917];

// ── Inline SVG sparkline (no lib dependency) ─────────────────────────────────
function Sparkline({ data, color, min: forceMin, max: forceMax, height = 24, width = 70 }) {
    const min = forceMin !== undefined ? forceMin : Math.min(...data);
    const max = forceMax !== undefined ? forceMax : Math.max(...data);
    const range = max - min || 1;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    // Last point dot
    const lastX = width;
    const lastY = height - ((data[data.length - 1] - min) / range) * (height - 2) - 1;

    return (
        <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
            <circle cx={lastX} cy={lastY} r={2.5} fill={color} opacity={0.9} />
        </svg>
    );
}

function MetaRow({ label, value, valueColor, right }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {right}
                <span style={{ fontSize: 11, fontWeight: 600, color: valueColor || 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                    {value}
                </span>
            </div>
        </div>
    );
}

function ScoreBar({ value, color }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 48, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{ height: '100%', background: color, borderRadius: 2 }}
                />
            </div>
            <span style={{ fontSize: 10, color, fontFamily: 'monospace', fontWeight: 700 }}>
                {value.toFixed(3)}
            </span>
        </div>
    );
}

function ModelHealthPanel() {
    const driftWarning = MODEL_META.featureDriftIndex > MODEL_META.driftThreshold;
    const driftColor = driftWarning ? '#f59e0b' : '#22c55e';

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            overflow: 'hidden',
            flexShrink: 0,
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 14px 8px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    Model Health
                </span>
                {driftWarning && (
                    <motion.span
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                        style={{
                            fontSize: 9, fontWeight: 800, color: '#f59e0b',
                            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
                            borderRadius: 4, padding: '2px 6px', letterSpacing: '0.06em',
                        }}
                    >
                        ⚠ DRIFT DETECTED
                    </motion.span>
                )}
            </div>

            <div style={{ padding: '8px 14px 12px' }}>
                {/* Version / train info */}
                <MetaRow label="version" value={MODEL_META.version} valueColor="#60a5fa" />
                <MetaRow label="retrained" value={MODEL_META.lastRetrained} />
                <MetaRow label="framework" value={MODEL_META.framework} />
                <MetaRow label="train_samples" value={MODEL_META.trainingSamples.toLocaleString()} />
                <MetaRow label="features" value={MODEL_META.featureCount} />

                {/* Divider */}
                <div style={{ margin: '8px 0 4px', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Performance Metrics
                </div>

                {/* AUC with sparkline */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>auc_roc</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkline data={AUC_HISTORY} color="#60a5fa" min={0.9} max={0.94} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#60a5fa', fontFamily: 'monospace' }}>
                            {MODEL_META.auc.toFixed(4)}
                        </span>
                    </div>
                </div>

                <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>precision</span>
                        <ScoreBar value={MODEL_META.precision} color="#a78bfa" />
                    </div>
                </div>
                <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>recall</span>
                        <ScoreBar value={MODEL_META.recall} color="#a78bfa" />
                    </div>
                </div>
                <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>f1_score</span>
                        <ScoreBar value={MODEL_META.f1} color="#a78bfa" />
                    </div>
                </div>

                {/* Divider */}
                <div style={{ margin: '8px 0 4px', fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Data & Drift
                </div>

                {/* Feature drift with sparkline */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>feature_drift_idx</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Sparkline data={DRIFT_HISTORY} color={driftColor} min={0} max={0.5} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: driftColor, fontFamily: 'monospace' }}>
                            {MODEL_META.featureDriftIndex.toFixed(2)}
                        </span>
                    </div>
                </div>

                <MetaRow
                    label="drift_threshold"
                    value={MODEL_META.driftThreshold.toFixed(2)}
                    valueColor="rgba(255,255,255,0.35)"
                />

                {/* Data completeness bar */}
                <div style={{ padding: '5px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>data_completeness</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                            {(MODEL_META.dataCompleteness * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ width: `${MODEL_META.dataCompleteness * 100}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            style={{ height: '100%', background: '#34d399', borderRadius: 2 }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(ModelHealthPanel);
