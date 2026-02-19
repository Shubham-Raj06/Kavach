import React, { useState } from 'react';

const ML_BASE = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8001';

/**
 * SimulationPanel — Section 7: Outbreak Simulation Mode.
 * Lets government officers modify environmental parameters and
 * see projected risk shift from the ML service.
 */
export default function SimulationPanel({ wardId = '12', currentRisk = 45 }) {
    const [rainfallDelta, setRainfallDelta] = useState(0);
    const [chlorineDelta, setChlorineDelta] = useState(0);
    const [symptomDelta, setSymptomDelta] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function runSimulation() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${ML_BASE}/simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wardId,
                    current_risk: currentRisk,
                    rainfall_delta: rainfallDelta,
                    chlorine_delta: chlorineDelta,
                    symptom_delta: symptomDelta,
                }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e) {
            // Fallback: rule-based estimate for demo
            const delta = rainfallDelta * 0.15 + Math.abs(chlorineDelta) * 0.2 + symptomDelta * 0.3;
            const simRisk = Math.min(100, Math.max(0, Math.round(currentRisk + delta)));
            setResult({
                wardId,
                original_risk: currentRisk,
                simulated_risk: simRisk,
                delta: simRisk - currentRisk,
                risk_level: simRisk >= 75 ? 'CRITICAL' : simRisk >= 50 ? 'HIGH' : simRisk >= 25 ? 'MEDIUM' : 'LOW',
                drivers: ['Offline estimation (ML service unavailable)'],
            });
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setRainfallDelta(0); setChlorineDelta(0); setSymptomDelta(0); setResult(null);
    }

    const riskColor = (lvl) =>
        ({ CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e' })[lvl] ?? '#94a3b8';

    return (
        <div style={s.container}>
            <div style={s.header}>
                <span style={s.title}>🧪 Simulate Outbreak Scenario</span>
                <span style={s.sub}>Ward {wardId} · Current Risk: <b style={{ color: '#f59e0b' }}>{currentRisk}</b></span>
            </div>

            <div style={s.sliders}>
                <SliderRow label="🌧️ Rainfall" unit="%" value={rainfallDelta} min={-50} max={200} step={5}
                    color="#38bdf8" onChange={setRainfallDelta} />
                <SliderRow label="🚰 Chlorine Level" unit="%" value={chlorineDelta} min={-80} max={100} step={5}
                    color="#a78bfa" onChange={setChlorineDelta} />
                <SliderRow label="🤒 Symptom Reports" unit=" cases" value={symptomDelta} min={-20} max={100} step={1}
                    color="#f87171" onChange={setSymptomDelta} />
            </div>

            <div style={s.btnRow}>
                <button onClick={runSimulation} disabled={loading} style={s.runBtn}>
                    {loading ? '⏳ Running…' : '⚡ Run Simulation'}
                </button>
                <button onClick={reset} style={s.resetBtn}>Reset</button>
            </div>

            {result && (
                <div style={s.result}>
                    <div style={s.gauge}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={s.gaugeLabel}>Original</div>
                            <div style={{ ...s.gaugeScore, color: '#94a3b8' }}>{result.original_risk}</div>
                        </div>
                        <div style={{ color: '#475569', fontSize: 24, alignSelf: 'center' }}>→</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={s.gaugeLabel}>Projected</div>
                            <div style={{ ...s.gaugeScore, color: riskColor(result.risk_level) }}>{result.simulated_risk}</div>
                        </div>
                        <div style={{ ...s.deltaBadge, background: result.delta > 0 ? '#450a0a' : '#052e16' }}>
                            <span style={{ color: result.delta > 0 ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                                {result.delta > 0 ? '+' : ''}{result.delta} pts
                            </span>
                            <div style={{ ...s.levelTag, color: riskColor(result.risk_level) }}>{result.risk_level}</div>
                        </div>
                    </div>

                    <div style={s.drivers}>
                        <div style={s.driversTitle}>Risk Drivers</div>
                        {result.drivers.map((d, i) => (
                            <div key={i} style={s.driverRow}>⚠️ {d}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SliderRow({ label, unit, value, min, max, step, color, onChange }) {
    return (
        <div style={ss.row}>
            <div style={ss.labelRow}>
                <span style={ss.label}>{label}</span>
                <span style={{ ...ss.value, color }}>{value > 0 ? '+' : ''}{value}{unit}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: color }}
            />
            <div style={ss.range}><span>{min}{unit}</span><span>{max}{unit}</span></div>
        </div>
    );
}

const s = {
    container: { background: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 16 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: '#e2e8f0', fontSize: 14, fontWeight: 700 },
    sub: { color: '#64748b', fontSize: 12 },
    sliders: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 },
    btnRow: { display: 'flex', gap: 12, marginBottom: 16 },
    runBtn: { flex: 1, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14 },
    resetBtn: { background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' },
    result: { background: '#0a1120', borderRadius: 12, padding: 16, marginTop: 4 },
    gauge: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: 12 },
    gaugeLabel: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 },
    gaugeScore: { fontSize: 36, fontWeight: 800 },
    deltaBadge: { borderRadius: 10, padding: '8px 16px', textAlign: 'center' },
    levelTag: { fontSize: 11, fontWeight: 700, marginTop: 4 },
    drivers: { borderTop: '1px solid #1e293b', paddingTop: 12 },
    driversTitle: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 },
    driverRow: { color: '#94a3b8', fontSize: 13, lineHeight: '24px' },
};

const ss = {
    row: { display: 'flex', flexDirection: 'column', gap: 4 },
    labelRow: { display: 'flex', justifyContent: 'space-between' },
    label: { color: '#94a3b8', fontSize: 13 },
    value: { fontSize: 13, fontWeight: 700 },
    range: { display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 10, marginTop: 2 },
};
