import { useEffect, useCallback, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import GlowCard from '../components/GlowCard';
import AlertsTimeline from '../components/AlertsTimeline';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import ForecastChart from '../components/ForecastChart';
import CategoryDonut from '../components/CategoryDonut';
import AdmissionChart from '../components/AdmissionChart';
import EmergencyToggle from '../components/command/EmergencyToggle';
import LiveSignalFeed from '../components/command/LiveSignalFeed';
import SurgeImpactPanel from '../components/command/SurgeImpactPanel';
import ModelHealthPanel from '../components/command/ModelHealthPanel';
import ConfidenceBar from '../components/command/ConfidenceBar';
import useCommandStore from '../store/commandStore';
import { WARDS, KPI, ALERTS, RISK_COLORS, getRiskLevel, CATEGORY_ICON } from '../lib/mockData';


// SSR-safe dynamic imports
const BubbleHotspotView = dynamic(() => import('../components/BubbleHotspotView'), { ssr: false });
const SpreadSimulation = dynamic(() => import('../components/command/SpreadSimulation'), { ssr: false });

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
    { id: 'explain', label: '🔬 Why High Risk?' },
    { id: 'forecast', label: '📈 48h Forecast' },
    { id: 'admission', label: '🏥 Admissions' },
    { id: 'category', label: '🧬 Categories' },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function CountUp({ target, duration = 1500 }) {
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

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
    const max = Math.max(...data), min = Math.min(...data);
    const w = 60, h = 24;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / (max - min || 1)) * h;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={w} height={h} className="opacity-70">
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ score }) {
    const level = getRiskLevel(score);
    const col = RISK_COLORS[level];
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
            style={{ color: col.text, borderColor: col.border, background: col.bg }}>
            {level}
        </span>
    );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
    const {
        commandMode,
        selectedWard, setSelectedWard,
    } = useCommandStore();

    // Local tab state (not global — doesn't need command store)
    const [activeTab, setActiveTab] = useState('explain');

    // Seed initial selection
    useEffect(() => {
        if (!selectedWard) setSelectedWard(WARDS[0]);
    }, []); // eslint-disable-line

    const sortedWards = [...WARDS].sort((a, b) => b.riskScore - a.riskScore);

    const handleWardClick = useCallback((ward) => {
        setSelectedWard(ward);
    }, [setSelectedWard]);

    // ── Dynamic background based on command mode ──────────────────────────────
    const bgGradient = commandMode
        ? 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(127,29,29,0.38) 0%, rgba(153,27,27,0.15) 35%, transparent 65%), radial-gradient(ellipse 80% 60% at 80% 100%, rgba(239,68,68,0.06) 0%, transparent 50%), #06090f'
        : 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(132,204,22,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 100%, rgba(74,222,128,0.05) 0%, transparent 50%), #080f0a';

    const level = selectedWard ? getRiskLevel(selectedWard.riskScore) : 'LOW';
    const col = RISK_COLORS[level];

    return (
        <>
            <Head>
                <title>Kavach — National Command Center</title>
                <meta name="description" content="AI-powered disease outbreak prediction National Command Center" />
            </Head>

            {/* ── Root container with animated background ─────────────────── */}
            <motion.div
                animate={{ background: bgGradient }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{
                    minHeight: '100vh',
                    color: '#ecfdf5',
                    fontFamily: "'Ubuntu', system-ui, sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* ── Emergency mode border pulse ──────────────────────────── */}
                <AnimatePresence>
                    {commandMode && (
                        <motion.div
                            key="emergency-border"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: 'fixed', inset: 0, zIndex: 9999,
                                border: '2px solid rgba(239,68,68,0.55)',
                                borderRadius: 0, pointerEvents: 'none',
                                animation: 'emergencyBorderPulse 2s ease-in-out infinite',
                            }}
                        />
                    )}
                </AnimatePresence>

                <Navbar alerts={ALERTS} />

                {/* ── KPI STRIP ────────────────────────────────────────────── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20, padding: '20px 24px 0',
                }}>
                    {[
                        { label: 'Predicted Outbreaks', value: KPI.predictedOutbreaks, icon: '⚠️', color: '#ef4444', glow: 'rgba(239,68,68,0.3)' },
                        { label: 'Citizens at Risk', value: KPI.citizensAtRisk, icon: '👥', color: '#f97316', glow: 'rgba(249,115,22,0.3)' },
                        { label: 'Hospitals on Surge', value: KPI.hospitalsOnSurge, icon: '🏥', color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
                    ].map(kpi => (
                        <div key={kpi.label} style={{
                            padding: '18px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, boxShadow: `0 0 24px ${kpi.glow}`,
                            display: 'flex', alignItems: 'center', gap: 16,
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: kpi.glow, border: `1px solid ${kpi.color}33`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 26, flexShrink: 0,
                            }}>{kpi.icon}</div>
                            <div>
                                <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 32, fontWeight: 700, color: kpi.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                                    <CountUp target={kpi.value} />
                                </div>
                                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{kpi.label} · next 48h</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── MAIN 3-COLUMN GRID ─────────────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '230px 1fr 300px',
                    gap: 20, padding: '20px 24px',
                    flex: 1, minHeight: 0,
                }}>

                    {/* ── LEFT: Ward risk index ──────────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
                        {/* Summary */}
                        <div style={{
                            padding: '18px 20px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16,
                        }}>
                            <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
                                Ward overview
                            </div>
                            {[
                                { label: 'Wards Monitored', value: KPI.totalWardsMonitored, color: '#84cc16' },
                                { label: 'Active Hotspots', value: KPI.activeHotspots, color: '#f97316' },
                                { label: 'Critical Alerts', value: KPI.criticalAlertsToday, color: '#ef4444' },
                            ].map(m => (
                                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.value}</span>
                                </div>
                            ))}
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Top Category</div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#84cc16' }}>
                                    {CATEGORY_ICON[KPI.topCategory]} {KPI.topCategory.replace('_', ' ')}
                                </div>
                            </div>
                        </div>

                        {/* Ward list label */}
                        <div style={{ fontFamily: "'Ubuntu', sans-serif", fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.25)', padding: '0 2px' }}>
                            Wards by risk
                        </div>

                        {/* Ward list */}
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {sortedWards.map(ward => {
                                const wLevel = getRiskLevel(ward.riskScore);
                                const wCol = RISK_COLORS[wLevel];
                                const isSelected = selectedWard?.wardId === ward.wardId;
                                const isCriticalCmd = commandMode && ward.riskScore > 70;

                                return (
                                    <motion.div
                                        key={ward.wardId}
                                        onClick={() => handleWardClick(ward)}
                                        animate={{
                                            borderColor: isCriticalCmd
                                                ? ['rgba(239,68,68,0.6)', 'rgba(239,68,68,0.2)', 'rgba(239,68,68,0.6)']
                                                : isSelected ? wCol.border : 'rgba(255,255,255,0.05)',
                                            boxShadow: isCriticalCmd
                                                ? ['0 0 18px rgba(239,68,68,0.5)', '0 0 6px rgba(239,68,68,0.15)', '0 0 18px rgba(239,68,68,0.5)']
                                                : isSelected ? `0 0 16px ${wCol.glow}` : 'none',
                                        }}
                                        transition={{
                                            borderColor: isCriticalCmd ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 },
                                            boxShadow: isCriticalCmd ? { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 },
                                        }}
                                        style={{
                                            padding: '9px 12px',
                                            background: isSelected ? wCol.bg : 'rgba(255,255,255,0.02)',
                                            border: '1px solid',
                                            borderRadius: 10, cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 16, fontWeight: 600 }}>{ward.name}</span>
                                            <span style={{ fontSize: 16, fontWeight: 700, color: wCol.text }}>{ward.riskScore}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>{ward.wardId}</span>
                                            <Sparkline data={ward.forecastTrend} color={wCol.text} />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── CENTER: Bubble viz + tabs ──────────────────────────── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

                        {/* Bubble cluster panel */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, overflow: 'hidden',
                            position: 'relative', minHeight: 340,
                        }}>
                            {/* Title overlay */}
                            <div style={{ position: 'absolute', top: 14, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <motion.div
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    style={{
                                        width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
                                        boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                                    }}
                                />
                                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                    Live outbreak intelligence
                                </span>
                            </div>

                            {/* Legend */}
                            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, display: 'flex', gap: 10 }}>
                                {[['CRITICAL', '#ef4444'], ['HIGH', '#f97316'], ['MEDIUM', '#eab308'], ['LOW', '#22c55e']].map(([l, c]) => (
                                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}88` }} />
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{l}</span>
                                    </div>
                                ))}
                            </div>

                            <BubbleHotspotView
                                onSelectWard={handleWardClick}
                                selectedWardId={selectedWard?.wardId}
                            />
                        </div>

                        {/* Spread simulation for selected ward */}
                        {selectedWard && (
                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 14, overflow: 'hidden',
                            }}>
                                <SpreadSimulation ward={selectedWard} />
                            </div>
                        )}

                        {/* Surge panel — auto-expands in command mode or on ward click */}
                        <SurgeImpactPanel />

                        {/* Tab panel */}
                        <div style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 16, overflow: 'hidden',
                            height: 260, display: 'flex', flexDirection: 'column',
                        }}>
                            {/* Tab bar */}
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                padding: '0 12px', gap: 2, flexShrink: 0,
                            }}>
                                {TABS.map(tab => (
                                    <button key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            padding: '10px 14px', fontSize: 16, fontWeight: activeTab === tab.id ? 600 : 400,
                                            background: 'transparent', border: 'none',
                                            borderBottom: activeTab === tab.id ? '2px solid #84cc16' : '2px solid transparent',
                                            color: activeTab === tab.id ? '#84cc16' : 'rgba(255,255,255,0.4)',
                                            cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
                                        }}
                                    >{tab.label}</button>
                                ))}
                                {selectedWard && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>
                                            {selectedWard.wardId} · {selectedWard.name}
                                        </span>
                                        <RiskBadge score={selectedWard.riskScore} />
                                    </div>
                                )}
                            </div>

                            {/* Tab content */}
                            <div style={{ flex: 1, padding: '12px 14px', overflow: 'hidden' }}>
                                {activeTab === 'explain' && <ExplainabilityPanel ward={selectedWard} />}
                                {activeTab === 'forecast' && selectedWard && <ForecastChart ward={selectedWard} />}
                                {activeTab === 'admission' && <AdmissionChart />}
                                {activeTab === 'category' && <CategoryDonut />}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Signal feed + ward detail + confidence + model ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>

                        {/* Live Signal Feed — top section, fixed height */}
                        <div style={{ height: 260, flexShrink: 0 }}>
                            <LiveSignalFeed />
                        </div>

                        {/* Selected ward detail */}
                        {selectedWard && (() => {
                            return (
                                <motion.div
                                    key={selectedWard.wardId}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25 }}
                                    style={{
                                        padding: '14px', background: col.bg,
                                        border: `1px solid ${col.border}`, borderRadius: 14,
                                        boxShadow: `0 0 24px ${col.glow}`, flexShrink: 0,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedWard.name}</div>
                                            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                                                {selectedWard.wardId} · {selectedWard.city}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 32, fontWeight: 900, color: col.text, lineHeight: 1 }}>
                                                {selectedWard.riskScore}%
                                            </div>
                                            <div style={{ fontSize: 16, color: col.text, fontWeight: 700 }}>{level}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        {[
                                            { label: 'Category', value: `${CATEGORY_ICON[selectedWard.category]} ${selectedWard.category.replace('_', ' ')}` },
                                            { label: 'Population', value: (selectedWard.population / 1000).toFixed(0) + 'K' },
                                            { label: 'Reports', value: selectedWard.citizenReports },
                                            { label: 'Anomaly', value: selectedWard.isAnomaly ? '⚡ Yes' : '— No' },
                                        ].map(m => (
                                            <div key={m.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 8px' }}>
                                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.label}</div>
                                                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{m.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })()}

                        {/* Confidence + Uncertainty bar */}
                        {selectedWard && (
                            <ConfidenceBar
                                riskScore={selectedWard.riskScore}
                                confidenceScore={(selectedWard.confidence || 70) / 100}
                                dataCompleteness={selectedWard.confidence || 70}
                            />
                        )}

                        {/* Alerts timeline — pinned top in command mode via order */}
                        <div style={{
                            flex: 1, minHeight: 0,
                            background: 'rgba(255,255,255,0.02)',
                            border: commandMode ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden',
                            order: commandMode ? -1 : 0,
                            transition: 'border-color 0.4s',
                        }}>
                            <div style={{
                                padding: '10px 14px 8px',
                                borderBottom: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                            }}>
                                <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {commandMode ? '🚨 Priority Alerts' : 'Active Alerts'}
                                </span>
                                <span style={{
                                    fontSize: 16, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)',
                                }}>{ALERTS.length}</span>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden', padding: '10px 12px' }}>
                                <AlertsTimeline />
                            </div>
                        </div>

                        {/* Model health panel — bottom of right column */}
                        <ModelHealthPanel />
                    </div>
                </div>

                {/* ── FOOTER ──────────────────────────────────────────────────── */}
                <div style={{
                    padding: '8px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>
                        Kavach AI Outbreak Intelligence · NCR Command Center · v2.0
                    </span>
                    <div style={{ display: 'flex', gap: 16 }}>
                        {[
                            { label: 'ML Service', ok: true },
                            { label: 'Signal Feed', ok: true },
                            { label: 'Alerts', ok: true },
                            { label: commandMode ? 'COMMAND MODE' : 'Standard', ok: !commandMode, warn: commandMode },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <div style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: s.warn ? '#ef4444' : s.ok ? '#22c55e' : '#ef4444',
                                    boxShadow: s.warn ? '0 0 6px rgba(239,68,68,0.9)' : s.ok ? '0 0 6px rgba(34,197,94,0.7)' : '0 0 6px rgba(239,68,68,0.7)',
                                    animation: s.warn ? 'pulse 1.2s infinite' : 'none',
                                }} />
                                <span style={{ fontSize: 16, color: s.warn ? '#ef4444' : 'rgba(255,255,255,0.3)', fontWeight: s.warn ? 700 : 400 }}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div >

            {/* ── Global keyframe styles ────────────────────────────────────── */}
            < style > {`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.95); }
                }
                @keyframes emergencyBorderPulse {
                    0%, 100% { border-color: rgba(239,68,68,0.55); box-shadow: inset 0 0 40px rgba(239,68,68,0.05); }
                    50% { border-color: rgba(239,68,68,0.25); box-shadow: inset 0 0 20px rgba(239,68,68,0.02); }
                }
                @keyframes emergencyBadgePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes skeletonPulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.08; }
                }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
            `}</style >
        </>
    );
}
