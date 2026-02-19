import React, { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

/**
 * ConfidenceBandChart — shows risk forecast with Prophet uncertainty bands.
 * Accepts `data` array with: { date, predicted, lower, upper }
 */
export default function ConfidenceBandChart({ wardId, data = [] }) {
    // Generate 48h demo data if no data provided
    const chartData = data.length > 0 ? data : generateDemo();

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div style={tooltipStyle}>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>{label}</p>
                <p style={{ color: '#818cf8' }}>Risk: <b>{payload[0]?.value?.toFixed(1)}</b></p>
                <p style={{ color: '#475569', fontSize: 11 }}>
                    Band: {payload[1]?.value?.toFixed(1)} — {payload[2]?.value?.toFixed(1)}
                </p>
            </div>
        );
    };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 700 }}>
                    📈 48h Risk Forecast — Ward {wardId}
                </span>
                <span style={{ color: '#94a3b8', fontSize: 12 }}>Prophet CI: 95%</span>
            </div>
            <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#334155" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#334155" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hour" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'CRITICAL', fill: '#ef4444', fontSize: 10 }} />
                    <ReferenceLine y={50} stroke="#f97316" strokeDasharray="4 2" label={{ value: 'HIGH', fill: '#f97316', fontSize: 10 }} />
                    {/* Confidence band (upper fill) */}
                    <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" />
                    {/* Confidence band (lower mask) */}
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#0f172a" />
                    {/* Predicted line */}
                    <Area type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} fill="url(#riskGrad)" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

function generateDemo() {
    const now = new Date();
    return Array.from({ length: 24 }, (_, i) => {
        const base = 45 + Math.sin(i / 3) * 15 + Math.random() * 8;
        return {
            hour: `${String((now.getHours() + i) % 24).padStart(2, '0')}:00`,
            predicted: Math.round(base * 10) / 10,
            upper: Math.round((base + 12) * 10) / 10,
            lower: Math.round((base - 8) * 10) / 10,
        };
    });
}

const containerStyle = { background: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 16 };
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 };
const tooltipStyle = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px' };
