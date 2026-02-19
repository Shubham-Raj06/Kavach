'use client';
import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts';
import { getMLForecast } from '../lib/api';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
        <div style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontFamily: 'monospace' }}>H+{d.hour}</div>
            <div style={{ color: '#60a5fa', fontWeight: 700 }}>Risk: {d.riskScore}%</div>
            {d.admissions !== undefined && <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>Admissions: {d.admissions}</div>}
            {d.lower !== undefined && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>Range: {d.lower} – {d.upper}</div>}
        </div>
    );
};

function ForecastPanel({ wardId }) {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!wardId) return;
        setLoading(true);
        setError(null);
        getMLForecast(wardId, 48)
            .then(data => {
                setForecast(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [wardId]);

    if (loading) {
        return (
            <div style={{ padding: 16 }}>
                {[1, 2, 3].map(i => (
                    <motion.div key={i} animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
                        style={{ height: i === 2 ? 120 : 16, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 10 }} />
                ))}
            </div>
        );
    }

    if (error || !forecast) {
        return (
            <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                Forecast unavailable for this ward.
            </div>
        );
    }

    const points = (forecast.points || []).map((p, i) => ({
        ...p,
        hour: i,
        riskScore: p.riskScore,
    }));

    const peakIdx = points.reduce((best, p, i) => p.riskScore > (points[best]?.riskScore ?? 0) ? i : best, 0);
    const peakPoint = points[peakIdx];

    const isSynthetic = forecast.source === 'synthetic';
    const isProphet = forecast.source === 'prophet';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}
        >
            {/* Header */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>48h Outbreak Forecast</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {isProphet && (
                        <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                            ✓ Prophet (Seasonal Model)
                        </span>
                    )}
                    {isSynthetic && (
                        <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fde68a', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                            ⚠ Synthetic fallback — ward history missing
                        </span>
                    )}
                </div>
            </div>

            <div style={{ padding: '12px 14px' }}>
                {/* Peak summary */}
                {peakPoint && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Peak Risk</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#f97316', fontFamily: 'monospace' }}>{peakPoint.riskScore.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>At Hour</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>+{peakIdx}h</div>
                        </div>
                        <div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: 2 }}>Admissions</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' }}>{Math.round(peakPoint.admissions || 0)}</div>
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                            <defs>
                                <linearGradient id="fcast-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="ci-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#475569" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}
                                tickFormatter={v => v % 12 === 0 ? `+${v}h` : ''} />
                            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }} domain={[0, 100]} />
                            <Tooltip content={<CustomTooltip />} />
                            {/* CI bands (if available) */}
                            {points[0]?.lower !== undefined && (
                                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ci-grad)" />
                            )}
                            {/* Main risk line */}
                            <Area type="monotone" dataKey="riskScore" stroke="#60a5fa" strokeWidth={2} fill="url(#fcast-grad)" dot={false} />
                            {/* Peak marker */}
                            {peakPoint && (
                                <ReferenceLine x={peakIdx} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'PEAK', fill: '#fb923c', fontSize: 8, fontFamily: 'monospace' }} />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    Horizon: {forecast.horizon}h · Source: {forecast.source} · Ward: {forecast.wardId}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(ForecastPanel);
