import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ShapBarChart = ({ shapReasons = [] }) => {
    // Sort by absolute impact descending
    const sortedData = [...shapReasons].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 5);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '10px', borderRadius: '8px' }}>
                    <p style={{ color: '#e2e8f0', margin: 0, fontWeight: 600 }}>{payload[0].payload.feature}</p>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '12px' }}>
                        Impact: <span style={{ color: '#38bdf8' }}>{(payload[0].value * 100).toFixed(1)}%</span>
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
                Top Risk Drivers
            </h3>

            {sortedData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart layout="vertical" data={sortedData} margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis
                            type="category"
                            dataKey="feature"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            width={100}
                            tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} />
                            ))}
                        </Bar>
                        <defs>
                            {sortedData.map((_, index) => (
                                <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
                                </linearGradient>
                            ))}
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                    No driver data available
                </div>
            )}
        </div>
    );
};

export default ShapBarChart;
