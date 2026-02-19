'use client';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { generateForecast } from '../lib/mockData';
import { useMemo } from 'react';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs backdrop-blur-sm">
            <div className="text-white/60 mb-1">{label}</div>
            {payload.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="text-white/70">{p.name}:</span>
                    <span className="text-white font-bold">{p.value}{p.name === 'Risk Score' ? '%' : ''}</span>
                </div>
            ))}
        </div>
    );
};

export default function ForecastChart({ ward }) {
    const data = useMemo(() => {
        const full = generateForecast(ward);
        // Show every 4h for readability
        return full.filter((_, i) => i % 4 === 0);
    }, [ward?.wardId]);

    return (
        <div className="w-full h-full" style={{ minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#84cc16" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#84cc16" stopOpacity={0.02} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6}
                        label={{ value: 'Alert', fill: '#ef4444', fontSize: 10, position: 'right' }} />
                    <Area type="monotone" dataKey="riskScore" name="Risk Score"
                        stroke="#ef4444" strokeWidth={2} fill="url(#riskGrad)"
                        dot={false} activeDot={{ r: 4, fill: '#ef4444' }} />
                    <Area type="monotone" dataKey="admissions" name="Admissions"
                        stroke="#84cc16" strokeWidth={2} fill="url(#admGrad)"
                        dot={false} activeDot={{ r: 4, fill: '#84cc16' }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
