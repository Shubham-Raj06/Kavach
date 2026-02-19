'use client';
import { ALERTS, RISK_COLORS } from '../lib/mockData';

const SEV_CONFIG = {
    CRITICAL: { label: 'CRITICAL', dot: '#ef4444', badge: 'bg-red-500/15 text-red-400 border-red-500/30' },
    HIGH: { label: 'HIGH', dot: '#f97316', badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    MEDIUM: { label: 'MEDIUM', dot: '#eab308', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    LOW: { label: 'LOW', dot: '#22c55e', badge: 'bg-green-500/15 text-green-400 border-green-500/30' },
};

export default function AlertsTimeline({ alerts = ALERTS, limit = 8 }) {
    const items = alerts.slice(0, limit);

    return (
        <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '100%' }}>
            {items.map((alert, i) => {
                const cfg = SEV_CONFIG[alert.severity] || SEV_CONFIG.LOW;
                const col = RISK_COLORS[alert.severity] || RISK_COLORS.LOW;
                const isCritical = alert.severity === 'CRITICAL';

                return (
                    <div
                        key={alert.id}
                        className="relative flex gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        style={{
                            boxShadow: alert.isNew ? `0 0 14px ${col.glow}` : 'none',
                            animationDelay: `${i * 0.08}s`,
                        }}
                    >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-1 shrink-0">
                            <div
                                style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: cfg.dot,
                                    boxShadow: alert.isNew ? `0 0 10px ${cfg.dot}` : 'none',
                                    animation: isCritical ? 'criticalPulse 1.2s ease-in-out infinite' : 'none',
                                    flexShrink: 0,
                                }}
                            />
                            {i < items.length - 1 && (
                                <div className="w-px flex-1 mt-1 bg-white/[0.06]" style={{ minHeight: 12 }} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${cfg.badge}`}>
                                        {cfg.label}
                                    </span>
                                    <span className="text-[10px] text-white/40 font-mono">{alert.wardId}</span>
                                    {alert.isNew && (
                                        <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1 rounded font-bold">
                                            NEW
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-white/30 shrink-0">{alert.time}</span>
                            </div>
                            <p className="text-xs text-white/80 leading-snug">{alert.message}</p>
                            <p className="text-[10px] text-white/40 mt-1 leading-snug">{alert.action}</p>
                        </div>

                        {/* Critical ring */}
                        {isCritical && alert.isNew && (
                            <div
                                className="absolute inset-0 rounded-xl pointer-events-none"
                                style={{
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    animation: 'criticalRing 2s ease-in-out infinite',
                                }}
                            />
                        )}
                    </div>
                );
            })}

            <style>{`
                @keyframes criticalPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.4); opacity: 0.7; }
                }
                @keyframes criticalRing {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
                    50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.1); }
                }
            `}</style>
        </div>
    );
}
