import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const ForecastChart = ({ forecast = [] }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '13px' }}>{label}</p>
                    <p style={{ color: '#f472b6', margin: 0, fontSize: '12px' }}>
                        Risk: <b>{payload[0].value}</b>
                    </p>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '11px' }}>
                        Range: {payload[0].payload.lower} - {payload[0].payload.upper}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                48-Hour Risk Projection
            </h3>

            <div style={{ flex: 1, minHeight: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />

                        {/* Confidence Band Area (simulated by stacking or separate area generally) */}
                        <Area type="monotone" dataKey="risk" stroke="#f472b6" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />

                        {/* Simplified confidence band visualization using upper bound as a faint line/area if needed, 
                for now keeping it clean with just the main projection line + gradient */}

                        <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Crit', fill: '#ef4444', fontSize: 10 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ForecastChart;
