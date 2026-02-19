import { MapPin } from 'lucide-react';

const RISK_COLOR = (score) => {
    if (score >= 0.8) return { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', text: '#f87171', bar: 'linear-gradient(90deg,#ef4444,#b91c1c)' };
    if (score >= 0.6) return { bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.30)', text: '#fb923c', bar: 'linear-gradient(90deg,#f97316,#c2410c)' };
    if (score >= 0.4) return { bg: 'rgba(234,179,8,0.10)', border: 'rgba(234,179,8,0.30)', text: '#fbbf24', bar: 'linear-gradient(90deg,#eab308,#a16207)' };
    return { bg: 'rgba(74,222,128,0.10)', border: 'rgba(74,222,128,0.25)', text: '#4ade80', bar: 'linear-gradient(90deg,#4ade80,#16a34a)' };
};

const RISK_LABEL = (score) => {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
};

export default function Sidebar({ heatmapData = [], selectedWard, onSelectWard }) {
    const sorted = [...heatmapData].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));

    return (
        <aside style={{
            width: 240,
            background: '#0d1810',
            borderRight: '1px solid #1a2e1d',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 16px',
                borderBottom: '1px solid #1a2e1d',
            }}>
                <h2 style={{
                    fontFamily: "'Ubuntu', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#84cc16',
                    margin: 0,
                    letterSpacing: '-0.01em',
                }}>Ward Risk</h2>
                <p style={{ fontSize: 16, color: '#6b8f72', margin: '4px 0 0', lineHeight: 1.4 }}>
                    {heatmapData.length} wards monitored
                </p>
            </div>

            {/* Ward list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {sorted.map((ward) => {
                    const score = ward.riskScore ?? 0;
                    const colors = RISK_COLOR(score);
                    const isSelected = selectedWard?.wardId === ward.wardId;

                    return (
                        <button
                            key={ward.wardId}
                            onClick={() => onSelectWard(ward)}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 14px',
                                borderBottom: '1px solid rgba(26,46,29,0.6)',
                                borderLeft: isSelected ? '2px solid #84cc16' : '2px solid transparent',
                                background: isSelected ? 'rgba(132,204,22,0.07)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: "'Ubuntu', sans-serif",
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <MapPin size={10} color="#6b8f72" />
                                    <span style={{ fontSize: 16, fontWeight: 600, color: '#ecfdf5', maxWidth: 110, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                        {ward.name}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                                    padding: '2px 6px', borderRadius: 4,
                                    background: colors.bg, color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                }}>
                                    {RISK_LABEL(score)}
                                </span>
                            </div>

                            {/* Risk bar */}
                            <div style={{
                                height: 3, borderRadius: 4,
                                background: 'rgba(26,46,29,0.9)',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${score * 100}%`,
                                    background: colors.bar,
                                    borderRadius: 4,
                                    transition: 'width 0.4s ease',
                                }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 9, color: '#6b8f72' }}>
                                    {ward.outbreakCategory ?? '—'}
                                </span>
                                <span style={{ fontSize: 16, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: colors.text }}>
                                    {ward.riskScore != null ? `${(ward.riskScore * 100).toFixed(0)}%` : 'N/A'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
