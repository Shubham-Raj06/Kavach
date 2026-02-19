'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, Cell,
} from 'recharts';
import {
    WARDS, KPI, ALERTS, GOV_DISTRICT_DATA, RESOURCE_PREDICTION,
    ADMISSION_TREND, CATEGORY_DATA, getRiskLevel, RISK_COLORS, CATEGORY_ICON,
} from '../lib/mockData';

const BubbleHotspotView = dynamic(() => import('../components/BubbleHotspotView'), { ssr: false });
import AlertsTimeline from '../components/AlertsTimeline';

function CountUp({ target, duration = 1200 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = target / (duration / 16);
        const id = setInterval(() => {
            start = Math.min(start + step, target);
            setVal(Math.floor(start));
            if (start >= target) clearInterval(id);
        }, 16);
        return () => clearInterval(id);
    }, [target]);
    return <>{val.toLocaleString()}</>;
}

function LiveClock() {
    const [time, setTime] = useState('');
    useEffect(() => {
        const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);
    return <span className="font-mono text-xs text-white/40">{time} IST</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs backdrop-blur-sm">
            <div className="text-white/60 mb-1 font-semibold">{label}</div>
            {payload.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.fill || p.stroke }} />
                    <span className="text-white/70">{p.name}:</span>
                    <span className="text-white font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const NAV_LINKS = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/gov', label: 'GOV', active: true },
    { href: '/hospital', label: 'Hospital' },
    { href: '/community', label: 'Community' },
];

const sortedWards = [...WARDS].sort((a, b) => b.riskScore - a.riskScore);

export default function GovDashboard() {
    const [selectedWard, setSelectedWard] = useState(WARDS[0]);

    const kpis = [
        { label: 'Districts Monitored', value: 2, icon: '🗺️', color: '#84cc16', glow: 'rgba(132,204,22,0.25)' },
        { label: 'Total Wards Active', value: KPI.totalWardsMonitored, icon: '📍', color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
        { label: 'Citizens at Risk', value: KPI.citizensAtRisk, icon: '👥', color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
        { label: 'Predicted Outbreaks', value: KPI.predictedOutbreaks, icon: '⚠️', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
        { label: 'Hospitals on Surge', value: KPI.hospitalsOnSurge, icon: '🏥', color: '#eab308', glow: 'rgba(234,179,8,0.3)' },
        { label: 'Critical Alerts', value: KPI.criticalAlertsToday, icon: '🔔', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    ];

    const wardBarData = sortedWards.slice(0, 10).map(w => ({
        name: w.name,
        risk: w.riskScore,
        population: Math.round(w.population / 1000),
    }));

    return (
        <>
            <Head>
                <title>Kavach GOV — District Command Dashboard</title>
                <meta name="description" content="Government district-level disease outbreak command dashboard" />
            </Head>

            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(132,204,22,0.09) 0%, transparent 60%), #080f0a',
                color: '#ecfdf5',
                fontFamily: "'Ubuntu', system-ui, sans-serif",
                display: 'flex', flexDirection: 'column',
            }}>
                {/* NAVBAR */}
                <nav style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 24px', height: 52,
                    background: 'rgba(8,15,10,0.85)',
                    borderBottom: '1px solid rgba(132,204,22,0.12)',
                    backdropFilter: 'blur(18px)',
                    position: 'sticky', top: 0, zIndex: 50,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Kavach</span>
                        <span style={{
                            fontSize: 16, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: 'rgba(132,204,22,0.15)', color: '#84cc16',
                            border: '1px solid rgba(132,204,22,0.35)',
                        }}>GOV</span>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                        {NAV_LINKS.map(item => (
                            <Link key={item.href} href={item.href} style={{
                                padding: '5px 14px', borderRadius: 8, fontSize: 16, fontWeight: 500,
                                background: item.active ? 'rgba(132,204,22,0.12)' : 'transparent',
                                border: item.active ? '1px solid rgba(132,204,22,0.28)' : '1px solid transparent',
                                color: item.active ? '#84cc16' : 'rgba(172,220,180,0.5)',
                                textDecoration: 'none', cursor: 'pointer',
                            }}>{item.label}</Link>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <LiveClock />
                        <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #84cc16, #4ade80)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 16, fontWeight: 800, color: '#080f0a',
                        }}>G</div>
                    </div>
                </nav>

                {/* PAGE TITLE */}
                <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>District Command Dashboard</h1>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', lineHeight: 1.4 }}>
                            Delhi Municipal Corporation · Real-time outbreak intelligence
                        </p>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ fontSize: 16, fontWeight: 500, color: '#ef4444' }}>Live monitoring</span>
                    </div>
                </div>

                {/* KPI STRIP */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, padding: '20px 24px 0' }}>
                    {kpis.map(kpi => (
                        <div key={kpi.label} style={{
                            padding: '16px 18px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            boxShadow: `0 0 20px ${kpi.glow}`,
                        }}>
                            <div style={{ fontSize: 26, marginBottom: 8 }}>{kpi.icon}</div>
                            <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 26, fontWeight: 700, color: kpi.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                <CountUp target={kpi.value} />
                            </div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {/* MAIN GRID */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 300px',
                    gap: 20, padding: '20px 24px', flex: 1,
                }}>
                    {/* LEFT: Ward Risk Bar Chart */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700 }}>Ward Risk Index</div>
                                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Top 10 wards by outbreak probability</div>
                            </div>
                        </div>
                        <div style={{ flex: 1, minHeight: 280 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={wardBarData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }} barSize={10}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 16 }} axisLine={false} tickLine={false} width={58} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                    <Bar dataKey="risk" name="Risk Score" radius={[0, 4, 4, 0]}>
                                        {wardBarData.map((entry) => {
                                            const level = getRiskLevel(entry.risk);
                                            const col = RISK_COLORS[level];
                                            return <Cell key={entry.name} fill={col.text} style={{ filter: `drop-shadow(0 0 4px ${col.glow})` }} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* District summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {GOV_DISTRICT_DATA.map(d => (
                                <div key={d.district} style={{
                                    padding: '10px 12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 10,
                                }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{d.district}</div>
                                    {[
                                        { label: 'Avg Risk', value: `${d.avgRisk}%`, color: RISK_COLORS[getRiskLevel(d.avgRisk)].text },
                                        { label: 'Citizens at Risk', value: `${(d.citizensAtRisk / 1000).toFixed(0)}K`, color: '#f97316' },
                                        { label: 'Critical Wards', value: d.criticalWards, color: '#ef4444' },
                                    ].map(m => (
                                        <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CENTER: Bubble View + Resource Table */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Bubble */}
                        <div style={{
                            flex: 1, background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, overflow: 'hidden', position: 'relative', minHeight: 300,
                        }}>
                            <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite', boxShadow: '0 0 8px rgba(239,68,68,0.8)' }} />
                                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Outbreak map</span>
                            </div>
                            <BubbleHotspotView onSelectWard={setSelectedWard} selectedWardId={selectedWard?.wardId} />
                        </div>

                        {/* Resource Prediction Table */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 14,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Resource Demand Prediction (72h)</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {RESOURCE_PREDICTION.map(r => {
                                    const pct = Math.min(100, (r.predicted72h / r.critical) * 100);
                                    const isCritical = r.predicted72h > r.critical;
                                    return (
                                        <div key={r.resource} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', width: 120, flexShrink: 0 }}>{r.resource}</div>
                                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{
                                                    height: '100%', borderRadius: 3,
                                                    width: `${Math.min(100, (r.current / r.critical) * 100)}%`,
                                                    background: isCritical ? '#ef4444' : '#3b82f6',
                                                    boxShadow: isCritical ? '0 0 6px rgba(239,68,68,0.5)' : '0 0 6px rgba(59,130,246,0.4)',
                                                }} />
                                            </div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: isCritical ? '#ef4444' : '#22c55e', width: 60, textAlign: 'right', flexShrink: 0 }}>
                                                {r.predicted72h.toLocaleString()} {r.unit}
                                            </div>
                                            {isCritical && (
                                                <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, flexShrink: 0 }}>⚠ CRITICAL</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Alerts + Ward Detail */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Selected ward */}
                        {selectedWard && (() => {
                            const level = getRiskLevel(selectedWard.riskScore);
                            const col = RISK_COLORS[level];
                            return (
                                <div style={{
                                    padding: 14, background: col.bg,
                                    border: `1px solid ${col.border}`,
                                    borderRadius: 14, boxShadow: `0 0 24px ${col.glow}`, flexShrink: 0,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedWard.name}</div>
                                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{selectedWard.wardId} · {selectedWard.district}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 26, fontWeight: 900, color: col.text, lineHeight: 1 }}>{selectedWard.riskScore}%</div>
                                            <div style={{ fontSize: 16, color: col.text, fontWeight: 700 }}>{level}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                        {[
                                            { label: 'Population', value: `${(selectedWard.population / 1000).toFixed(0)}K` },
                                            { label: 'Reports', value: selectedWard.citizenReports },
                                            { label: 'Category', value: selectedWard.category.replace('_', ' ') },
                                            { label: 'Anomaly', value: selectedWard.isAnomaly ? '⚡ Yes' : '— No' },
                                        ].map(m => (
                                            <div key={m.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '5px 8px' }}>
                                                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>{m.label}</div>
                                                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Alerts */}
                        <div style={{
                            flex: 1, minHeight: 0,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        }}>
                            <div style={{
                                padding: '10px 14px 8px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                            }}>
                                <span style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Active alerts</span>
                                <span style={{
                                    fontSize: 16, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                }}>{ALERTS.length}</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden', padding: '10px 12px' }}>
                                <AlertsTimeline />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{
                    padding: '8px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>
                        Kavach GOV · Delhi Municipal Corporation · District Command View
                    </span>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[{ label: 'ML Service', ok: true }, { label: 'Data Feed', ok: true }, { label: 'Alerts', ok: true }].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.ok ? '#22c55e' : '#ef4444', boxShadow: s.ok ? '0 0 6px rgba(34,197,94,0.7)' : 'none' }} />
                                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.95); }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(132,204,22,0.15); border-radius: 2px; }
            `}</style>
        </>
    );
}
