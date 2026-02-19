import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DUMMY_WARDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

function generateHistory(seed) {
    return Array.from({ length: 30 }, (_, i) => {
        const base = (parseInt(seed) * 3.7 + i * 1.5) % 80;
        return {
            day: `D-${30 - i}`,
            risk: Math.round((base + Math.random() * 15)),
        };
    });
}

/**
 * WardCompareTool — select 2 wards and compare their 30-day risk timeline.
 */
export default function WardCompareTool() {
    const [wardA, setWardA] = useState('12');
    const [wardB, setWardB] = useState('7');
    const [dataA, setDataA] = useState(null);
    const [dataB, setDataB] = useState(null);
    const [loading, setLoading] = useState(false);

    async function compare() {
        setLoading(true);
        try {
            const [rA, rB] = await Promise.all([
                fetch(`/api/wards/${wardA}/history?days=30`).then(r => r.json()).catch(() => null),
                fetch(`/api/wards/${wardB}/history?days=30`).then(r => r.json()).catch(() => null),
            ]);
            setDataA(rA?.history?.map(h => ({ day: h.date?.slice(0, 10), risk: h.riskScore })) ?? generateHistory(wardA));
            setDataB(rB?.history?.map(h => ({ day: h.date?.slice(0, 10), risk: h.riskScore })) ?? generateHistory(wardB));
        } catch {
            setDataA(generateHistory(wardA));
            setDataB(generateHistory(wardB));
        } finally {
            setLoading(false);
        }
    }

    // Merge datasets by index
    const merged = (dataA || generateHistory(wardA)).map((a, i) => ({
        day: a.day,
        [`Ward ${wardA}`]: a.risk,
        [`Ward ${wardB}`]: (dataB || generateHistory(wardB))[i]?.risk ?? 0,
    }));

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span style={styles.title}>🔍 Ward Comparison Tool</span>
            </div>

            <div style={styles.selectors}>
                <div style={styles.selectorGroup}>
                    <label style={styles.label}>Ward A</label>
                    <select value={wardA} onChange={e => setWardA(e.target.value)} style={styles.select}>
                        {DUMMY_WARDS.map(w => <option key={w} value={w}>Ward {w}</option>)}
                    </select>
                </div>
                <div style={styles.vs}>VS</div>
                <div style={styles.selectorGroup}>
                    <label style={styles.label}>Ward B</label>
                    <select value={wardB} onChange={e => setWardB(e.target.value)} style={styles.select}>
                        {DUMMY_WARDS.map(w => <option key={w} value={w}>Ward {w}</option>)}
                    </select>
                </div>
                <button onClick={compare} disabled={loading} style={styles.btn}>
                    {loading ? 'Loading…' : 'Compare'}
                </button>
            </div>

            <ResponsiveContainer width="100%" height={240}>
                <LineChart data={merged} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} interval={4} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                    <Line type="monotone" dataKey={`Ward ${wardA}`} stroke="#6366f1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey={`Ward ${wardB}`} stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>

            <div style={styles.shareRow}>
                <span style={styles.shareHint}>
                    Share: <code style={{ color: '#a78bfa' }}>/compare?a={wardA}&b={wardB}</code>
                </span>
            </div>
        </div>
    );
}

const styles = {
    container: { background: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 16 },
    header: { marginBottom: 16 },
    title: { color: '#e2e8f0', fontSize: 14, fontWeight: 700 },
    selectors: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
    selectorGroup: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
    select: { background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' },
    vs: { color: '#475569', fontWeight: 700, fontSize: 14, marginTop: 16 },
    btn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, marginTop: 16 },
    shareRow: { marginTop: 12 },
    shareHint: { color: '#64748b', fontSize: 12 },
};
