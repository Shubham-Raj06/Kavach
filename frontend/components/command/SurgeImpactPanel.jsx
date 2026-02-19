import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useCommandStore from '../../store/commandStore';

// ── Capacity thresholds ───────────────────────────────────────────────────────
const HOSPITALIZATION_RATE = 0.12;  // 12% of predicted cases get admitted
const ICU_RATE = 0.18;  // 18% of admissions need ICU
const TOTAL_ICU_BEDS = 523;   // Delhi NCR monitored-zone ICU beds (NHM 2022-23)
const OXYGEN_DEMAND_PER_ICU = 45;   // litres/hour per ICU patient

function getCapacityColor(pct) {
    if (pct > 85) return { text: '#ef4444', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.4)', bar: '#ef4444' };
    if (pct > 60) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', bar: '#f59e0b' };
    return { text: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', bar: '#22c55e' };
}

// Animated counter (avoids framer-motion spring for numbers to stay sharp)
function AnimNum({ value, suffix = '', decimals = 0 }) {
    return (
        <motion.span
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            {typeof value === 'number' ? value.toFixed(decimals) : value}{suffix}
        </motion.span>
    );
}

function MetricBox({ label, value, suffix, decimals, color, sub }) {
    return (
        <div style={{
            background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 10px',
        }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3 }}>
                {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: color || '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
                <AnimNum value={value} suffix={suffix} decimals={decimals} />
            </div>
            {sub && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

function CapacityBar({ label, pct }) {
    const c = getCapacityColor(pct);
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{pct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <motion.div
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 3, background: c.bar, boxShadow: `0 0 8px ${c.bar}66` }}
                />
            </div>
        </div>
    );
}

function SurgeImpactPanel() {
    const { selectedWard, commandMode } = useCommandStore();

    const metrics = useMemo(() => {
        if (!selectedWard) return null;
        const predictedCases48h = Math.round(selectedWard.population * (selectedWard.riskScore / 100) * 0.008);
        const expectedAdmissions = Math.round(predictedCases48h * HOSPITALIZATION_RATE);
        const icuLoad = Math.round(expectedAdmissions * ICU_RATE);
        const capacityImpact = (icuLoad / TOTAL_ICU_BEDS) * 100;
        const bedOccupancyPct = Math.min(100, 72 + (selectedWard.riskScore * 0.22));
        const daysTo90 = capacityImpact > 0
            ? Math.max(0.5, ((90 - capacityImpact) / (capacityImpact / 2))).toFixed(1)
            : '—';
        const oxygenDemand = icuLoad * OXYGEN_DEMAND_PER_ICU;

        // Bed utilization trend (7 data points)
        const trend = selectedWard.admissions
            ? selectedWard.admissions.slice(-7).map((v, i) => ({
                h: `${(i + 1) * 6}h`,
                occupancy: Math.min(100, Math.round(50 + (v / selectedWard.admissions.slice(-1)[0]) * 40)),
            }))
            : [];

        return { predictedCases48h, expectedAdmissions, icuLoad, capacityImpact, bedOccupancyPct, daysTo90, oxygenDemand, trend };
    }, [selectedWard]);

    const isExpanded = commandMode || !!selectedWard;

    return (
        <AnimatePresence>
            {isExpanded && metrics && (
                <motion.div
                    key="surge-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{
                        background: getCapacityColor(metrics.capacityImpact).bg,
                        border: `1px solid ${getCapacityColor(metrics.capacityImpact).border}`,
                        borderRadius: 14, padding: '12px 14px',
                    }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div>
                                <div style={{
                                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', color: '#f97316', marginBottom: 2,
                                }}>
                                    ⚠️ If No Action Is Taken
                                </div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                                    {selectedWard.name} · Surge Projection
                                </div>
                            </div>
                            <div style={{
                                textAlign: 'right',
                                background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '4px 10px',
                            }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>ICU Impact</div>
                                <div style={{
                                    fontSize: 20, fontWeight: 900, lineHeight: 1,
                                    color: getCapacityColor(metrics.capacityImpact).text,
                                }}>
                                    <AnimNum value={metrics.capacityImpact} suffix="%" decimals={1} />
                                </div>
                            </div>
                        </div>

                        {/* KPI grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            <MetricBox label="Predicted Cases (48h)" value={metrics.predictedCases48h} color="#f97316" />
                            <MetricBox label="Expected Admissions" value={metrics.expectedAdmissions} color="#fb923c" />
                            <MetricBox label="ICU Demand" value={metrics.icuLoad} suffix=" beds" color={getCapacityColor(metrics.capacityImpact).text} />
                            <MetricBox label="Days to 90% Capacity" value={metrics.daysTo90} color={getCapacityColor(metrics.capacityImpact).text} />
                        </div>

                        {/* Capacity bars */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                            <CapacityBar label="Projected ICU Occupancy" pct={metrics.capacityImpact} />
                            <CapacityBar label="Bed Utilization" pct={metrics.bedOccupancyPct} />
                        </div>

                        {/* Bed trend chart */}
                        {metrics.trend.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 4 }}>
                                    Bed Utilization Trend (48h)
                                </div>
                                <ResponsiveContainer width="100%" height={60}>
                                    <AreaChart data={metrics.trend} margin={{ top: 2, right: 2, left: -36, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="surgeGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={getCapacityColor(metrics.capacityImpact).bar} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={getCapacityColor(metrics.capacityImpact).bar} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="h" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)' }} />
                                        <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)' }} domain={[40, 100]} />
                                        <Tooltip
                                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                                            labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                                        />
                                        <Area
                                            type="monotone" dataKey="occupancy"
                                            stroke={getCapacityColor(metrics.capacityImpact).bar}
                                            strokeWidth={1.5} fill="url(#surgeGrad)"
                                            dot={false} isAnimationActive={true}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* Oxygen demand */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px',
                        }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>🫁 Oxygen Demand Est.</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>
                                <AnimNum value={metrics.oxygenDemand} suffix=" L/hr" />
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default memo(SurgeImpactPanel);
