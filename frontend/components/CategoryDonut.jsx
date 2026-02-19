'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CATEGORY_DATA } from '../lib/mockData';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
        <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: d.payload.color }} />
                <span className="text-white font-semibold">{d.name}</span>
                <span className="text-white/60">{d.value}%</span>
            </div>
        </div>
    );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="rgba(255,255,255,0.9)" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export default function CategoryDonut() {
    return (
        <div className="w-full h-full" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        {CATEGORY_DATA.map(d => (
                            <filter key={d.name} id={`glow-${d.name}`}>
                                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        ))}
                    </defs>
                    <Pie
                        data={CATEGORY_DATA}
                        cx="50%" cy="50%"
                        innerRadius="45%" outerRadius="72%"
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                    >
                        {CATEGORY_DATA.map(d => (
                            <Cell key={d.name} fill={d.color}
                                style={{ filter: `drop-shadow(0 0 6px ${d.color}88)` }} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{v}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
