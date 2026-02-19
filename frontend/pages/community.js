'use client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
    WARDS, ALERTS, SYMPTOM_TREND, ADVISORIES, HOSPITALS,
    getRiskLevel, RISK_COLORS, CATEGORY_ICON,
} from '../lib/mockData';

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
                    <span className="text-white font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

const NAV_LINKS = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/gov', label: 'GOV' },
    { href: '/hospital', label: 'Hospital' },
    { href: '/community', label: 'Community', active: true },
];

const ADV_COLORS = {
    critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
    high: { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)', text: '#f97316' },
    medium: { bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.3)', text: '#eab308' },
    low: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
};

// Use Dharavi as the community zone (highest risk)
const COMMUNITY_WARD = WARDS[0];

export default function CommunityDashboard() {
    const [ward] = useState(COMMUNITY_WARD);
    const level = getRiskLevel(ward.riskScore);
    const col = RISK_COLORS[level];
    const nearestHospital = HOSPITALS[0];

    const symptomData = SYMPTOM_TREND;

    return (
        <>
            <Head>
                <title>Kavach Community — Zone Health Dashboard</title>
                <meta name="description" content="Community health advisory and local outbreak risk dashboard" />
            </Head>

            <div style={{
                minHeight: '100vh',
                background: `radial-gradient(ellipse 120% 80% at 50% -10%, ${col.glow.replace('0.5', '0.07')} 0%, transparent 60%), #080f0a`,
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
                        }}>COMMUNITY</span>
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
                        }}>C</div>
                    </div>
                </nav>

                {/* MAIN CONTENT */}
                <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr 300px', gap: 20, padding: '20px 24px', flex: 1 }}>

                    {/* LEFT: Zone Risk Card + Nearest Hospital */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {/* Big Risk Card */}
                        <div style={{
                            padding: 20,
                            background: col.bg,
                            border: `1px solid ${col.border}`,
                            borderRadius: 20,
                            boxShadow: `0 0 40px ${col.glow}`,
                        }}>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
                                Your zone · {ward.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
                                <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 72, fontWeight: 800, color: col.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                    {ward.riskScore}
                                </div>
                                <div style={{ paddingBottom: 8 }}>
                                    <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: col.text }}>{level} risk</div>
                                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Outbreak probability</div>
                                </div>
                            </div>

                            {/* Risk bar */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', borderRadius: 4,
                                        width: `${ward.riskScore}%`,
                                        background: `linear-gradient(90deg, ${col.text}88, ${col.text})`,
                                        boxShadow: `0 0 12px ${col.glow}`,
                                        transition: 'width 1.2s ease',
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Safe</span>
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Alert: 70%</span>
                                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Critical</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {[
                                    { label: 'Category', value: `${CATEGORY_ICON[ward.category]} ${ward.category.replace('_', ' ')}` },
                                    { label: 'Population', value: `${(ward.population / 1000).toFixed(0)}K` },
                                    { label: 'Reports Filed', value: ward.citizenReports },
                                    { label: 'Anomaly', value: ward.isAnomaly ? '⚡ Detected' : '✅ None' },
                                ].map(m => (
                                    <div key={m.label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 12px' }}>
                                        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{m.label}</div>
                                        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Nearest Hospital */}
                        <div style={{
                            padding: 14,
                            background: nearestHospital.surgeAlert ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${nearestHospital.surgeAlert ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: 14,
                        }}>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                Nearest Hospital
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{nearestHospital.name}</div>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                                {[
                                    { label: 'Beds', value: `${Math.round((nearestHospital.occupiedBeds / nearestHospital.totalBeds) * 100)}%`, color: '#f97316' },
                                    { label: 'ICU', value: `${Math.round((nearestHospital.icuOccupied / nearestHospital.icuTotal) * 100)}%`, color: '#ef4444' },
                                    { label: 'Today', value: `+${nearestHospital.admissionsToday}`, color: '#84cc16' },
                                ].map(m => (
                                    <div key={m.label} style={{ flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 4px' }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.value}</div>
                                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{m.label}</div>
                                    </div>
                                ))}
                            </div>
                            {nearestHospital.surgeAlert && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    padding: '6px 10px', borderRadius: 8,
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                                    <span style={{ fontSize: 16, color: '#ef4444', fontWeight: 600 }}>Hospital under surge — expect delays</span>
                                </div>
                            )}
                        </div>

                        {/* Key Signals */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: 14,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                                Why High Risk?
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {ward.reasons.slice(0, 3).map((r, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        padding: '8px 10px', borderRadius: 10,
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{r.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Symptom Trend + Advisories */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Symptom Trend */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 16,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Symptom Trend — Last 7 Days</div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Reported cases by symptom category in {ward.name}</div>
                            <div style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={symptomData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            {[
                                                { key: 'diarrhea', color: '#4ade80' },
                                                { key: 'fever', color: '#ef4444' },
                                                { key: 'vomiting', color: '#f59e0b' },
                                                { key: 'respiratory', color: '#10b981' },
                                            ].map(({ key, color }) => (
                                                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 16 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="diarrhea" name="Diarrhea" stroke="#4ade80" strokeWidth={2} fill="url(#grad-diarrhea)" dot={false} />
                                        <Area type="monotone" dataKey="fever" name="Fever" stroke="#ef4444" strokeWidth={2} fill="url(#grad-fever)" dot={false} />
                                        <Area type="monotone" dataKey="vomiting" name="Vomiting" stroke="#f59e0b" strokeWidth={1.5} fill="url(#grad-vomiting)" dot={false} />
                                        <Area type="monotone" dataKey="respiratory" name="Respiratory" stroke="#10b981" strokeWidth={1.5} fill="url(#grad-respiratory)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Legend */}
                            <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                                {[
                                    { label: 'Diarrhea', color: '#4ade80' },
                                    { label: 'Fever', color: '#ef4444' },
                                    { label: 'Vomiting', color: '#f59e0b' },
                                    { label: 'Respiratory', color: '#10b981' },
                                ].map(l => (
                                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{l.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Advisory Feed */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, padding: 16,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Health Advisories</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {ADVISORIES.map(adv => {
                                    const c = ADV_COLORS[adv.severity];
                                    return (
                                        <div key={adv.id} style={{
                                            padding: '12px 14px',
                                            background: c.bg,
                                            border: `1px solid ${c.border}`,
                                            borderRadius: 12,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                                <span style={{ fontSize: 26, flexShrink: 0 }}>{adv.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                        <div style={{ fontSize: 16, fontWeight: 700 }}>{adv.title}</div>
                                                        <span style={{ fontSize: 9, color: c.text, fontWeight: 700, textTransform: 'uppercase' }}>{adv.severity}</span>
                                                    </div>
                                                    <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{adv.body}</div>
                                                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>Issued: {adv.issued}</span>
                                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>Expires: {adv.expires}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Forecast + What to Do */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* 48h Risk Forecast */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: 14,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>48h Risk Forecast</div>
                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>Predicted outbreak probability</div>
                            <div style={{ height: 140 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={ward.forecastTrend.map((v, i) => ({ h: `+${i * 4}h`, risk: v }))}
                                        margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="communityRiskGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={col.text} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={col.text} stopOpacity={0.02} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                        <XAxis dataKey="h" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="risk" name="Risk %" stroke={col.text} strokeWidth={2} fill="url(#communityRiskGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* What To Do */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: 14,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>🛡️ What To Do Now</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[
                                    { icon: '💧', text: 'Boil all drinking water for 1 min before use', urgent: true },
                                    { icon: '🧼', text: 'Wash hands with soap for 20+ seconds', urgent: false },
                                    { icon: '🦟', text: 'Use mosquito repellent, especially at dusk', urgent: false },
                                    { icon: '🏥', text: 'Seek care immediately if fever > 2 days', urgent: true },
                                    { icon: '📱', text: 'Report symptoms to Kavach citizen portal', urgent: false },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 8,
                                        padding: '8px 10px', borderRadius: 10,
                                        background: item.urgent ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                                        border: item.urgent ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.05)',
                                    }}>
                                        <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                                        <span style={{ fontSize: 16, color: item.urgent ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Emergency Contacts */}
                        <div style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 14, padding: 14,
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: '#ef4444' }}>🚨 Emergency Contacts</div>
                            {[
                                { label: 'Health Helpline', number: '104' },
                                { label: 'Ambulance', number: '108' },
                                { label: 'BMC Control Room', number: '1916' },
                            ].map(c => (
                                <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>{c.label}</span>
                                    <span style={{ fontSize: 16, fontWeight: 800, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{c.number}</span>
                                </div>
                            ))}
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
                        Kavach Community · {ward.name}, {ward.city} · Citizen Health Portal
                    </span>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[{ label: 'Data Feed', ok: true }, { label: 'Advisories', ok: true }].map(s => (
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
