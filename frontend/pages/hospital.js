'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, ReferenceLine, Cell, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import {
    HOSPITALS, ICU_FORECAST, ADMISSION_TREND, ALERTS, KPI,
    getRiskLevel, RISK_COLORS,
} from '../lib/mockData';
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
                    <div className="w-2 h-2 rounded-full" style={{ background: p.stroke || p.fill }} />
                    <span className="text-white/70">{p.name}:</span>
                    <span className="text-white font-bold">{p.value}{p.name?.includes('ICU') ? '%' : ''}</span>
                </div>
            ))}
        </div>
    );
};

const NAV_LINKS = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/gov', label: 'GOV' },
    { href: '/hospital', label: 'Hospital', active: true },
    { href: '/community', label: 'Community' },
];

export default function HospitalDashboard() {
    const [selectedHospital, setSelectedHospital] = useState(HOSPITALS[0]);
    const occupancyPct = Math.round((selectedHospital.occupiedBeds / selectedHospital.totalBeds) * 100);
    const icuPct = Math.round((selectedHospital.icuOccupied / selectedHospital.icuTotal) * 100);

    const kpis = [
        { label: 'Hospitals Monitored', value: HOSPITALS.length, icon: '🏥', color: '#84cc16', glow: 'rgba(132,204,22,0.25)' },
        { label: 'Total Beds', value: HOSPITALS.reduce((s, h) => s + h.totalBeds, 0), icon: '🛏️', color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
        { label: 'Beds Available', value: HOSPITALS.reduce((s, h) => s + (h.totalBeds - h.occupiedBeds), 0), icon: '✅', color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
        { label: 'ICU Occupied', value: HOSPITALS.reduce((s, h) => s + h.icuOccupied, 0), icon: '⚡', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
        { label: 'Admissions Today', value: HOSPITALS.reduce((s, h) => s + h.admissionsToday, 0), icon: '📈', color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
        { label: 'Surge Alerts', value: HOSPITALS.filter(h => h.surgeAlert).length, icon: '🔔', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
    ];

    const admissionBarData = ADMISSION_TREND.map(d => ({
        day: d.day,
        total: d.total,
        intensity: Math.round((d.total / 138) * 100),
    }));

    const hospitalAlerts = ALERTS.filter(a => ['CRITICAL', 'HIGH'].includes(a.severity));

    return (
        <>
            <Head>
                <title>Kavach Hospital — Surge Intelligence Dashboard</title>
                <meta name="description" content="Hospital surge prediction and ICU capacity management dashboard" />
            </Head>

            <div style={{
                minHeight: '100vh',
                background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(74,222,128,0.07) 0%, transparent 60%), #080f0a',
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
                        }}>HOSPITAL</span>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                        {NAV_LINKS.map(item => (
                            <Link key={item.href} href={item.href} style={{
                                padding: '5px 14px', borderRadius: 8, fontSize: 16, fontWeight: 500,
                                background: item.active ? 'rgba(132,204,22,0.12)' : 'transparent',
                                border: item.active ? '1px solid rgba(132,204,22,0.28)' : '1px solid transparent',
                                color: item.active ? '#84cc16' : 'rgba(172,220,180,0.5)',
                                textDecoration: 'none',
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
                        }}>H</div>
                    </div>
                </nav>

                {/* PAGE TITLE */}
                <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>Hospital Surge Intelligence</h1>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', lineHeight: 1.4 }}>
                            ICU capacity · Admission forecasting · Surge alerts
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {HOSPITALS.filter(h => h.surgeAlert).map(h => (
                            <div key={h.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '5px 10px', borderRadius: 8,
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                <span style={{ fontSize: 16, fontWeight: 600, color: '#ef4444' }}>{h.name} SURGE</span>
                            </div>
                        ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: 20, padding: '20px 24px', flex: 1 }}>
                    {/* LEFT: Hospital List + Occupancy Gauges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>
                            Hospitals
                        </div>
                        {HOSPITALS.map(h => {
                            const occ = Math.round((h.occupiedBeds / h.totalBeds) * 100);
                            const icu = Math.round((h.icuOccupied / h.icuTotal) * 100);
                            const isSelected = selectedHospital.id === h.id;
                            const surgeColor = h.surgeLevel === 'CRITICAL' ? '#ef4444' : h.surgeLevel === 'HIGH' ? '#f97316' : h.surgeLevel === 'MEDIUM' ? '#eab308' : '#22c55e';
                            return (
                                <div key={h.id}
                                    onClick={() => setSelectedHospital(h)}
                                    style={{
                                        padding: '12px 14px',
                                        background: isSelected ? `rgba(16,185,129,0.08)` : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isSelected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                                        borderRadius: 12, cursor: 'pointer',
                                        boxShadow: isSelected ? '0 0 20px rgba(16,185,129,0.15)' : 'none',
                                        transition: 'all 0.2s',
                                    }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{h.name}</div>
                                        {h.surgeAlert && (
                                            <span style={{
                                                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                                                background: `${surgeColor}22`, color: surgeColor, border: `1px solid ${surgeColor}44`,
                                            }}>SURGE</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 12 }}>
                                        {[{ label: 'Beds', value: occ }, { label: 'ICU', value: icu }].map(m => (
                                            <div key={m.label} style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{m.label}</span>
                                                    <span style={{ fontSize: 16, fontWeight: 700, color: m.value >= 90 ? '#ef4444' : m.value >= 75 ? '#f97316' : '#22c55e' }}>{m.value}%</span>
                                                </div>
                                                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%', borderRadius: 2,
                                                        width: `${m.value}%`,
                                                        background: m.value >= 90 ? '#ef4444' : m.value >= 75 ? '#f97316' : '#22c55e',
                                                        boxShadow: m.value >= 90 ? '0 0 6px rgba(239,68,68,0.6)' : 'none',
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>{h.wardName}</span>
                                        <span style={{ fontSize: 16, color: '#10b981' }}>+{h.admissionsToday} today</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* CENTER: ICU Forecast + Admission Spike */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* ICU Forecast */}
                        <div style={{
                            flex: 1, background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 16,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>48h ICU Occupancy Forecast</div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Predicted ICU utilization across surge hospitals</div>
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={ICU_FORECAST} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="kemGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                                            </linearGradient>
                                            <linearGradient id="rajGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                                            </linearGradient>
                                            <linearGradient id="sionGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#84cc16" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#84cc16" stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} interval={2} />
                                        <YAxis domain={[60, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6}
                                            label={{ value: 'Critical', fill: '#ef4444', fontSize: 16, position: 'right' }} />
                                        <Area type="monotone" dataKey="kem" name="KEM ICU %" stroke="#ef4444" strokeWidth={2} fill="url(#kemGrad)" dot={false} />
                                        <Area type="monotone" dataKey="rajawadi" name="Rajawadi ICU %" stroke="#f97316" strokeWidth={2} fill="url(#rajGrad)" dot={false} />
                                        <Area type="monotone" dataKey="sion" name="Sion ICU %" stroke="#84cc16" strokeWidth={1.5} fill="url(#sionGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Admission Spike */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 16,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>7-Day Admission Spike</div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Total daily admissions across monitored wards</div>
                            <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={admissionBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={28}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                                        <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="total" name="Admissions" radius={[4, 4, 0, 0]}>
                                            {admissionBarData.map((entry) => {
                                                const alpha = 0.4 + (entry.intensity / 100) * 0.6;
                                                return (
                                                    <Cell key={entry.day}
                                                        fill={`rgba(239,68,68,${alpha})`}
                                                        style={{ filter: entry.intensity > 80 ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 'none' }}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Selected Hospital Detail + Alerts */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {/* Hospital Detail */}
                        <div style={{
                            background: selectedHospital.surgeAlert ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${selectedHospital.surgeAlert ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 14, padding: 14, flexShrink: 0,
                            boxShadow: selectedHospital.surgeAlert ? '0 0 24px rgba(239,68,68,0.15)' : 'none',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedHospital.name}</div>
                                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{selectedHospital.wardName}</div>
                                </div>
                                <span style={{
                                    fontSize: 16, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
                                    background: selectedHospital.surgeAlert ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                    color: selectedHospital.surgeAlert ? '#ef4444' : '#22c55e',
                                    border: `1px solid ${selectedHospital.surgeAlert ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                }}>{selectedHospital.surgeLevel}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                                {[
                                    { label: 'Bed Occupancy', value: `${occupancyPct}%`, color: occupancyPct >= 90 ? '#ef4444' : '#10b981' },
                                    { label: 'ICU Occupancy', value: `${icuPct}%`, color: icuPct >= 90 ? '#ef4444' : '#f97316' },
                                    { label: 'Admissions Today', value: selectedHospital.admissionsToday, color: '#84cc16' },
                                    { label: 'Discharges Today', value: selectedHospital.dischargeToday, color: '#22c55e' },
                                ].map(m => (
                                    <div key={m.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                                        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>{m.label}</div>
                                        <div style={{ fontSize: 26, fontWeight: 800, color: m.color, marginTop: 2 }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Occupancy bars */}
                            {[
                                { label: 'Beds', pct: occupancyPct, color: occupancyPct >= 90 ? '#ef4444' : '#10b981' },
                                { label: 'ICU', pct: icuPct, color: icuPct >= 90 ? '#ef4444' : '#f97316' },
                            ].map(b => (
                                <div key={b.label} style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{b.label} Occupancy</span>
                                        <span style={{ fontSize: 16, fontWeight: 700, color: b.color }}>{b.pct}%</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3, width: `${b.pct}%`,
                                            background: b.color,
                                            boxShadow: b.pct >= 90 ? `0 0 8px ${b.color}88` : 'none',
                                            transition: 'width 1s ease',
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Hospital Alerts */}
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
                                <span style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>Surge alerts</span>
                                <span style={{
                                    fontSize: 16, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                }}>{hospitalAlerts.length}</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden', padding: '10px 12px' }}>
                                <AlertsTimeline alerts={hospitalAlerts} limit={6} />
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
                        Kavach Hospital · Surge Intelligence · Delhi Health Network
                    </span>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[{ label: 'ML Service', ok: true }, { label: 'HMIS Feed', ok: true }, { label: 'Alerts', ok: true }].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.7)' }} />
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
