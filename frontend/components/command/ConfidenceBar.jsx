import { memo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUALITY_LABEL = {
    HIGH: { label: 'High', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
    MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    LOW: { label: 'Low', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
};

function getQuality(pct) {
    if (pct >= 80) return 'HIGH';
    if (pct >= 50) return 'MEDIUM';
    return 'LOW';
}

function getRiskColor(score) {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
}

function getConfidenceColor(conf) {
    if (conf >= 0.80) return '#22c55e';
    if (conf >= 0.55) return '#f59e0b';
    return '#ef4444';
}

function Bar({ value, maxValue = 100, color, animated = true }) {
    const pct = Math.min(100, (value / maxValue) * 100);
    return (
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flex: 1 }}>
            <motion.div
                animate={{ width: `${pct}%` }}
                initial={{ width: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                    height: '100%', borderRadius: 3,
                    background: color,
                    boxShadow: `0 0 8px ${color}55`,
                }}
            />
        </div>
    );
}

function ConfidenceBar({ riskScore, confidenceScore, dataCompleteness }) {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const btnRef = useRef(null);

    const riskColor = getRiskColor(riskScore);
    const confColor = getConfidenceColor(confidenceScore);
    const qualityKey = getQuality(dataCompleteness);
    const quality = QUALITY_LABEL[qualityKey];

    const lowConfidence = confidenceScore < 0.55;
    const incompleteData = dataCompleteness < 70;

    const handleTooltip = useCallback(() => setTooltipOpen(v => !v), []);

    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '10px 12px',
        }}>
            {/* Title row */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
            }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    Confidence · Uncertainty
                </span>
                <div style={{ position: 'relative' }} ref={btnRef}>
                    <button
                        onClick={handleTooltip}
                        style={{
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '50%', width: 18, height: 18, cursor: 'pointer',
                            fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                        title="About confidence scores"
                    >
                        ?
                    </button>
                    <AnimatePresence>
                        {tooltipOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 4 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                    position: 'absolute', bottom: 24, right: 0, zIndex: 100,
                                    width: 220, background: '#0f172a',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 10, padding: '10px 12px',
                                    fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                }}
                            >
                                <div style={{ fontWeight: 700, color: 'white', marginBottom: 4 }}>Uncertainty System</div>
                                <p style={{ margin: '0 0 6px' }}>
                                    <strong style={{ color: '#60a5fa' }}>Risk Score</strong>: Model's estimated probability of an outbreak event in the next 48h.
                                </p>
                                <p style={{ margin: '0 0 6px' }}>
                                    <strong style={{ color: '#a78bfa' }}>Confidence</strong>: How reliable this prediction is based on training data coverage and recent calibration.
                                </p>
                                <p style={{ margin: 0 }}>
                                    <strong style={{ color: '#34d399' }}>Data Quality</strong>: Completeness of ward-level sensor, hospital, and citizen-report data in the past 24h.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Risk bar */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Risk Score</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: riskColor, fontVariantNumeric: 'tabular-nums' }}>
                        {riskScore}
                    </span>
                </div>
                <Bar value={riskScore} maxValue={100} color={riskColor} />
            </div>

            {/* Confidence bar */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Confidence</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: confColor, fontVariantNumeric: 'tabular-nums' }}>
                        {(confidenceScore * 100).toFixed(0)}%
                    </span>
                </div>
                <Bar value={confidenceScore} maxValue={1} color={confColor} />
            </div>

            {/* Data quality row */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: quality.bg, border: `1px solid ${quality.border}`,
                borderRadius: 7, padding: '5px 9px', marginBottom: 8,
            }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Data Quality</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%', background: quality.color,
                        boxShadow: `0 0 6px ${quality.color}88`,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: quality.color }}>
                        {quality.label} · {dataCompleteness}%
                    </span>
                </div>
            </div>

            {/* Uncertainty warning */}
            <AnimatePresence>
                {(lowConfidence || incompleteData) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                            overflow: 'hidden',
                            background: 'rgba(245,158,11,0.08)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: 8, padding: '6px 10px',
                        }}
                    >
                        <span style={{ fontSize: 9, color: '#fbbf24', lineHeight: 1.5, display: 'block' }}>
                            {incompleteData && !lowConfidence
                                ? 'Prediction confidence reduced due to incomplete ward-level data. Confidence will improve as sensor feeds are restored.'
                                : lowConfidence && !incompleteData
                                    ? 'Low model confidence for this ward — limited historical case data reduces prediction reliability.'
                                    : 'Prediction confidence reduced due to incomplete ward-level data and limited historical training coverage for this zone.'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default memo(ConfidenceBar);
