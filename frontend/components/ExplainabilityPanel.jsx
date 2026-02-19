'use client';
import { RISK_COLORS, getRiskLevel } from '../lib/mockData';

export default function ExplainabilityPanel({ ward }) {
    if (!ward) return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
            <div style={{ fontSize: 32 }}>🔬</div>
            <div className="text-sm">Select a ward bubble to see AI analysis</div>
        </div>
    );

    const level = getRiskLevel(ward.riskScore);
    const col = RISK_COLORS[level];
    const maxImpact = Math.max(...(ward.shapFeatures?.map(f => f.impact) || [1]));

    return (
        <div className="flex flex-col gap-3 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">AI Insight</div>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <div className="flex items-center gap-2">
                    {ward.confidence && (
                        <span className="text-[10px] text-white/40 font-mono">
                            {ward.confidence}% confidence
                        </span>
                    )}
                    <div className="text-[10px] px-2 py-0.5 rounded-full border font-bold"
                        style={{ color: col.text, borderColor: col.border, background: col.bg }}>
                        {level}
                    </div>
                </div>
            </div>

            {/* Risk score bar */}
            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-white/50">Outbreak Probability</span>
                    <span className="font-bold tabular-nums" style={{ color: col.text }}>{ward.riskScore}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${ward.riskScore}%`,
                            background: `linear-gradient(90deg, ${col.text}66, ${col.text})`,
                            boxShadow: `0 0 10px ${col.glow}`,
                        }}
                    />
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                    <span>0%</span><span>Alert threshold: 70%</span><span>100%</span>
                </div>
            </div>

            {/* Key Signals */}
            <div className="flex flex-col gap-1.5">
                <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Key Signals</div>
                {ward.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                        <span className="text-sm shrink-0 mt-0.5">{r.icon}</span>
                        <span className="text-xs text-white/75 leading-snug">{r.text}</span>
                    </div>
                ))}
            </div>

            {/* SHAP Feature Impact */}
            {ward.shapFeatures?.length > 0 && (
                <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                        Feature Impact (SHAP)
                    </div>
                    <div className="flex flex-col gap-2">
                        {ward.shapFeatures.map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="text-[10px] text-white/40 w-28 shrink-0 truncate font-mono">{f.feature}</div>
                                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${(f.impact / maxImpact) * 100}%`,
                                            background: `linear-gradient(90deg, #7c3aed, #3b82f6)`,
                                            boxShadow: '0 0 6px rgba(124,58,237,0.5)',
                                            transitionDelay: `${i * 80}ms`,
                                        }}
                                    />
                                </div>
                                <div className="text-[10px] text-white/60 w-12 text-right font-mono font-bold">{f.value}</div>
                                <div className="text-[10px] text-white/30 w-8 text-right font-mono">{Math.round(f.impact * 100)}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Category footer */}
            <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-white/30">Category</span>
                <span className="text-xs font-semibold text-white/70">{ward.category.replace('_', ' ')}</span>
            </div>
        </div>
    );
}
