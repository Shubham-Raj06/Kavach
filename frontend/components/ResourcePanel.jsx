import React, { useState } from 'react';

const ML_BASE = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8001';

const ICON_MAP = {
    ors_packets: { icon: '💊', label: 'ORS Packets', unit: 'sachets' },
    fogging_teams: { icon: '🚁', label: 'Fogging Teams', unit: 'teams' },
    ambulances: { icon: '🚑', label: 'Ambulances', unit: 'units' },
    medical_camps: { icon: '⛺', label: 'Medical Camps', unit: 'camps' },
};

const LEVEL_COLOR = {
    CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#22c55e',
};

/**
 * ResourcePanel — Section 5.3: Resource Optimization Engine.
 * Calls /resources/recommend with ward risk data and displays
 * formula-based resource allocation recommendations.
 */
export default function ResourcePanel({ wards = [] }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Demo wards if none supplied
    const demoWards = wards.length ? wards : [
        { wardId: '12', risk_score: 78, population: 62000, area_sqkm: 2.1, category: 'WATERBORNE' },
        { wardId: '7', risk_score: 55, population: 48000, area_sqkm: 1.8, category: 'VECTOR_BORNE' },
        { wardId: '3', risk_score: 31, population: 55000, area_sqkm: 1.5, category: 'UNKNOWN' },
    ];

    async function fetchRecommendations() {
        setLoading(true);
        try {
            const res = await fetch(`${ML_BASE}/resources/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(demoWards),
            });
            const data = await res.json();
            setRecommendations(data);
        } catch {
            // Fallback local calculation
            const fallback = demoWards.filter(w => w.risk_score >= 25).map(w => {
                const infectedEst = Math.round(w.population * (w.risk_score / 100) * 0.05);
                return {
                    wardId: w.wardId,
                    risk_level: w.risk_score >= 75 ? 'CRITICAL' : w.risk_score >= 50 ? 'HIGH' : 'MEDIUM',
                    ors_packets: infectedEst * 2,
                    fogging_teams: Math.max(1, Math.round(w.area_sqkm / 2)),
                    ambulances: Math.max(1, Math.round(w.risk_score / 25)),
                    medical_camps: w.risk_score >= 70 ? 1 : 0,
                    rationale: `Est. ${infectedEst.toLocaleString()} residents at risk in Ward ${w.wardId}.`,
                };
            });
            setRecommendations(fallback);
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div>
                    <span style={s.title}>📦 Resource Recommendations</span>
                    <div style={s.sub}>Formula-based allocation for HIGH+ risk wards</div>
                </div>
                <button onClick={fetchRecommendations} disabled={loading} style={s.calcBtn}>
                    {loading ? '⏳ Calculating…' : '⚡ Calculate'}
                </button>
            </div>

            {hasLoaded && recommendations.length === 0 && (
                <div style={s.empty}>All wards at LOW risk — no deployment needed.</div>
            )}

            {recommendations.map(rec => (
                <div key={rec.wardId} style={s.card}>
                    <div style={s.cardHeader}>
                        <span style={s.wardLabel}>Ward {rec.wardId}</span>
                        <span style={{ ...s.levelBadge, color: LEVEL_COLOR[rec.risk_level], borderColor: LEVEL_COLOR[rec.risk_level] }}>
                            {rec.risk_level}
                        </span>
                    </div>
                    <div style={s.grid}>
                        {Object.entries(ICON_MAP).map(([key, meta]) => {
                            const qty = rec[key];
                            if (!qty) return null;
                            return (
                                <div key={key} style={s.resourceCell}>
                                    <div style={s.resourceIcon}>{meta.icon}</div>
                                    <div style={s.resourceQty}>{qty.toLocaleString()}</div>
                                    <div style={s.resourceLabel}>{meta.label}</div>
                                    <div style={s.resourceUnit}>{meta.unit}</div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={s.rationale}>{rec.rationale}</div>
                </div>
            ))}
        </div>
    );
}

const s = {
    container: { background: '#0f172a', borderRadius: 16, padding: 20, marginBottom: 16 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    title: { color: '#e2e8f0', fontSize: 14, fontWeight: 700 },
    sub: { color: '#64748b', fontSize: 12, marginTop: 2 },
    calcBtn: { background: '#0f4c75', color: '#38bdf8', border: '1px solid #0369a1', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    empty: { color: '#64748b', fontSize: 13, textAlign: 'center', padding: '16px 0' },
    card: { background: '#0a1120', borderRadius: 12, padding: 16, marginBottom: 12 },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    wardLabel: { color: '#e2e8f0', fontWeight: 700, fontSize: 14 },
    levelBadge: { border: '1px solid', borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 10 },
    resourceCell: { background: '#0f172a', borderRadius: 8, padding: '10px 8px', textAlign: 'center' },
    resourceIcon: { fontSize: 20, marginBottom: 4 },
    resourceQty: { color: '#e2e8f0', fontSize: 18, fontWeight: 800 },
    resourceLabel: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
    resourceUnit: { color: '#475569', fontSize: 10 },
    rationale: { color: '#64748b', fontSize: 12, fontStyle: 'italic' },
};
