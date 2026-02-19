'use client';
import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { getForecast } from '../lib/api';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl px-3 py-2 text-xs shadow-xl">
            <p className="text-[#6b7280] mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-semibold">
                    {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
                    {p.name === 'Risk Score' ? '%' : ''}
                </p>
            ))}
        </div>
    );
};

export default function TrendChart({ wardId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!wardId) return;
        setLoading(true);
        getForecast(wardId)
            .then(setData)
            .catch(() => {
                // Generate demo data if API not available
                const now = Date.now();
                const demo = Array.from({ length: 24 }, (_, i) => ({
                    time: new Date(now + i * 2 * 3600000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
                    riskScore: 45 + Math.sin(i * 0.4) * 20 + (i > 16 ? i * 2 : 0),
                    admissions: 12 + Math.floor(Math.random() * 8) + (i > 16 ? i : 0),
                }));
                setData(demo);
            })
            .finally(() => setLoading(false));
    }, [wardId]);

    if (!wardId) return (
        <div className="h-full flex items-center justify-center text-[#6b7280] text-xs text-center">
            <div>
                <TrendingUp size={24} className="mx-auto mb-2 opacity-30" />
                <p>Select a ward to see</p>
                <p>48-hour forecast</p>
            </div>
        </div>
    );

    if (loading) return (
        <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    const maxRisk = Math.max(...data.map(d => d.riskScore ?? 0));
    const alertLine = 70;

    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={13} className="text-[#84cc16]" />
                    <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">48-Hour Forecast</h3>
                </div>
                {maxRisk > alertLine && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                        ⚠ Exceeds alert threshold
                    </span>
                )}
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                        <defs>
                            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                            dataKey="time"
                            tick={{ fontSize: 9, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={alertLine} stroke="#ef4444" strokeDasharray="4 2" strokeWidth={1} label={{ value: 'Alert', fill: '#ef4444', fontSize: 9 }} />
                        <Area
                            type="monotone"
                            dataKey="riskScore"
                            name="Risk Score"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#riskGrad)"
                            dot={false}
                            activeDot={{ r: 4, fill: '#84cc16' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="admissions"
                            name="Admissions"
                            stroke="#f97316"
                            strokeWidth={1.5}
                            fill="url(#admGrad)"
                            dot={false}
                            activeDot={{ r: 3, fill: '#f97316' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#84cc16] rounded" />
                    <span className="text-[10px] text-[#6b7280]">Risk Score %</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#f97316] rounded" />
                    <span className="text-[10px] text-[#6b7280]">Admissions</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-[#ef4444] rounded border-dashed" style={{ borderTop: '1px dashed #ef4444', background: 'none' }} />
                    <span className="text-[10px] text-[#6b7280]">Alert threshold</span>
                </div>
            </div>
        </div>
    );
}
