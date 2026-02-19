'use client';
import { memo } from 'react';
import { motion } from 'framer-motion';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ResponsiveContainer, Tooltip,
} from 'recharts';

const FEATURE_LABELS = {
    Temperature: 'Temp',
    Humidity: 'Humidity',
    Rainfall: 'Rain',
    AQI: 'AQI',
    Water_Quality_Index: 'WQI',
    Cases_Rolling_7D: 'Cases 7d',
    Rainfall_Lag_7D: 'Rain Lag',
};

// Map anomaly score to severity
function getSeverity(score) {
    if (score < -0.1) return { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    if (score < 0) return { label: 'HIGH', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
    if (score < 0.05) return { label: 'ELEVATED', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
    return { label: 'NORMAL', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
}

function AnomalyInsightPanel({ anomalyData, scaledFeatures = {} }) {
    if (!anomalyData) {
        return (
            <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                No anomaly data available for this ward.
            </div>
        );
    }

    const { isAnomaly, anomalyScore = 0, anomalyFeatures = [] } = anomalyData;
    const sev = getSeverity(anomalyScore);

    // Build radar data from scaledFeatures or default zeros
    const radarData = Object.keys(FEATURE_LABELS).map(key => ({
        feature: FEATURE_LABELS[key],
        value: Math.abs(scaledFeatures[key] || 0),
        fullMark: 4,
        isCulprit: anomalyFeatures.includes(key),
    }));

    const CustomDot = (props) => {
        const { cx, cy, payload } = props;
        if (!payload.isCulprit) return null;
        return <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="#fca5a5" strokeWidth={2} />;
    };

    const CustomTooltip = ({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
                <div style={{ color: d.isCulprit ? '#f87171' : 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{d.feature}{d.isCulprit ? ' ⚠ CULPRIT' : ''}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>|X_scaled| = {d.value.toFixed(3)}</div>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}
        >
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Anomaly Detection</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: sev.color, background: sev.bg, border: `1px solid ${sev.color}44`, borderRadius: 4, padding: '2px 8px', fontFamily: 'monospace' }}>
                        {isAnomaly ? `⚠ ${sev.label}` : '✓ NORMAL'}
                    </span>
                </div>
            </div>

            <div style={{ padding: '12px 14px' }}>
                {/* Score row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Anomaly Score</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: isAnomaly ? sev.color : '#22c55e' }}>
                            {anomalyScore.toFixed(4)}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>higher = more normal · &lt;0.02 = anomaly zone</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', marginBottom: 2 }}>Algorithm</div>
                        <div style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'monospace' }}>Isolation Forest</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>n_estimators=100</div>
                    </div>
                </div>

                {/* Radar chart */}
                <div style={{ height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="feature" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontFamily: 'monospace' }} />
                            <PolarRadiusAxis angle={90} domain={[0, 4]} tick={false} axisLine={false} />
                            <Radar name="|X_scaled|" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.18}
                                dot={<CustomDot />} activeDot={{ r: 5 }} />
                            <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Culprit features */}
                {anomalyFeatures.length > 0 && (
                    <>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, marginTop: 4 }}>Culprit Features</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {anomalyFeatures.map(f => (
                                <span key={f} style={{ fontSize: 9, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                                    {FEATURE_LABELS[f] || f}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {/* Explainer */}
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: 8, fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                    <strong style={{ color: 'rgba(167,139,250,0.8)' }}>Trigger Logic:</strong> Isolation Forest vote (prediction == -1) OR boundary proximity (score &lt; 0.02).
                    Culprit features use |X_scaled|&nbsp;&gt;&nbsp;2σ — this avoids AQI variance traps after StandardScaler normalization.
                </div>
            </div>
        </motion.div>
    );
}

export default memo(AnomalyInsightPanel);
