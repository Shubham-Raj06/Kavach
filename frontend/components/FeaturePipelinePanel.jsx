'use client';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CORE_FEATURES = [
    { key: 'temp_avg', label: 'Temperature (°C)', raw: 28.0, scaled: null, note: 'avgTemp7d fallback: 28°C' },
    { key: 'humidity_avg', label: 'Humidity (%)', raw: 70.0, scaled: null },
    { key: 'rainfall_total', label: 'Rainfall (mm)', raw: 0, scaled: null },
    { key: 'aqi', label: 'AQI (proxy)', raw: 0, scaled: null, note: 'WQI 0-500 scale' },
    { key: 'wqi', label: 'Water Quality (0-10)', raw: 0, scaled: null, note: 'AQI inverted: 10 - AQI/50' },
    { key: 'dailyAvg7d', label: 'Cases Rolling 7d', raw: 0, scaled: null },
    { key: 'lagRainfall1d', label: 'Rainfall Lag 7d', raw: 0, scaled: null, note: 'rainfall_total proxy' },
];

const SYNDROME_CATEGORIES = [
    { syndrome: 'DIARRHEA', category: 'WATERBORNE', color: '#60a5fa' },
    { syndrome: 'VOMITING', category: 'FOODBORNE', color: '#818cf8' },
    { syndrome: 'FEVER', category: 'VECTOR_BORNE', color: '#f97316' },
    { syndrome: 'COUGH', category: 'AIRBORNE', color: '#a78bfa' },
    { syndrome: 'RESPIRATORY_DISTRESS', category: 'AIRBORNE', color: '#c084fc' },
    { syndrome: 'SKIN_RASH', category: 'VECTOR_BORNE', color: '#fb923c' },
    { syndrome: 'JAUNDICE', category: 'WATERBORNE', color: '#34d399' },
];

function FlowArrow() {
    return (
        <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16, userSelect: 'none', display: 'flex', alignItems: 'center' }}
        >
            →
        </motion.div>
    );
}

function FlowBox({ label, color = 'rgba(255,255,255,0.06)', textColor = 'rgba(255,255,255,0.7)', children }) {
    return (
        <div style={{
            background: color, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px',
            flex: '0 0 auto', minWidth: 90, textAlign: 'center',
        }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 10, color: textColor, fontWeight: 600 }}>{children}</div>
        </div>
    );
}

function FeaturePipelinePanel({ rawFeatures = {}, scaledFeatures = {} }) {
    // Build bar data from provided or default values
    const barData = CORE_FEATURES.map(f => ({
        name: f.label.split(' ')[0],
        rawValue: rawFeatures[f.key] ?? f.raw,
        scaledAbs: Math.abs(scaledFeatures[f.key] ?? 0),
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}
        >
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Feature Engineering Pipeline</span>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>7 core features</span>
            </div>

            <div style={{ padding: '12px 14px' }}>
                {/* Transformation flow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
                    <FlowBox label="Raw Inputs" color="rgba(96,165,250,0.08)" textColor="#93c5fd">7 signals</FlowBox>
                    <FlowArrow />
                    <FlowBox label="StandardScaler" color="rgba(167,139,250,0.08)" textColor="#c4b5fd">Zero-center</FlowBox>
                    <FlowArrow />
                    <FlowBox label="Encoded" color="rgba(52,211,153,0.08)" textColor="#6ee7b7">Syndrome 1-hot</FlowBox>
                    <FlowArrow />
                    <FlowBox label="Feature Vector" color="rgba(249,115,22,0.08)" textColor="#fdba74">(1 × 7)</FlowBox>
                    <FlowArrow />
                    <FlowBox label="XGBoost" color="rgba(239,68,68,0.08)" textColor="#fca5a5">Risk Score</FlowBox>
                </div>

                {/* WQI rescaling note */}
                <div style={{ padding: '7px 10px', background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 7, marginBottom: 12, fontSize: 9, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontFamily: 'monospace' }}>
                    <strong style={{ color: '#fde68a' }}>WQI Rescaling:</strong> If input is an AQI-range value (&gt;10), it is inverted: <code style={{ color: '#a3e635' }}>WQI = max(0, 10 − AQI/50)</code>.
                    This prevents high-variance AQI (~0–500) from dominating the scaler over WQI (~0–10 training range).
                </div>

                {/* Feature bar chart */}
                <div style={{ height: 110, marginBottom: 12 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 6 }}>|X_scaled| — Feature Magnitudes After Normalization</div>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }} />
                            <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }} />
                            <Tooltip contentStyle={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }} />
                            <Bar dataKey="scaledAbs" name="|X_scaled|" radius={[3, 3, 0, 0]}>
                                {barData.map((entry, index) => (
                                    <Cell key={index} fill={entry.scaledAbs > 2 ? '#ef4444' : entry.scaledAbs > 1 ? '#f97316' : '#a78bfa'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Syndrome one-hot table */}
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Syndrome → Category Mapping</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {SYNDROME_CATEGORIES.map(({ syndrome, category, color }) => (
                        <div key={syndrome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 6px', background: 'rgba(255,255,255,0.03)', borderRadius: 5, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{syndrome}</span>
                            <span style={{ fontSize: 9, color, fontFamily: 'monospace', fontWeight: 700 }}>{category}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(FeaturePipelinePanel);
