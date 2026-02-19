import { Zap } from 'lucide-react';
import clsx from 'clsx';

const RISK_CONFIG = {
    CRITICAL: { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40' },
    HIGH: { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/40' },
    MEDIUM: { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40' },
    LOW: { label: 'LOW', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/40' },
};

const CATEGORY_ICON = {
    WATERBORNE: '💧', FOODBORNE: '🍽️', AIRBORNE: '💨',
    VECTOR_BORNE: '🦟', HOSPITAL_ACQUIRED: '🏥', UNKNOWN: '❓',
};

function getRiskLevel(score) {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
}

export default function RiskPanel({ ward, risk, onRunPrediction, predicting, compact = false }) {
    const score = risk?.riskScore ?? ward?.riskScore ?? null;
    const level = score != null ? getRiskLevel(score) : null;
    const cfg = level ? RISK_CONFIG[level] : null;

    // ── Compact mode: horizontal inline badge for tab bar ─────────────────────
    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {score != null && cfg ? (
                    <div className={clsx('flex items-center gap-1.5 rounded-lg border px-2.5 py-1', cfg.bg, cfg.border)}>
                        <span className={clsx('text-sm font-bold font-mono', cfg.color)}>
                            {(score * 100).toFixed(0)}%
                        </span>
                        <span className={clsx('text-[10px] font-bold', cfg.color)}>{level}</span>
                        {risk?.isAnomaly && (
                            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1 rounded">⚡</span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-kavach-muted">No prediction</span>
                )}
                <button
                    onClick={onRunPrediction}
                    disabled={predicting}
                    className="flex items-center gap-1.5 bg-kavach-accent hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                    {predicting ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Zap size={11} />
                    )}
                    {predicting ? 'Running...' : 'Run AI'}
                </button>
            </div>
        );
    }

    // ── Full mode: vertical panel ─────────────────────────────────────────────
    return (
        <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider">Risk Score</h3>
                {risk?.isAnomaly && (
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                        ANOMALY
                    </span>
                )}
            </div>

            <div>
                <p className="text-sm font-semibold leading-tight">{ward?.name}</p>
                <p className="text-xs text-kavach-muted">{ward?.city}</p>
            </div>

            {score != null && cfg ? (
                <div className={clsx('rounded-xl border p-3 text-center', cfg.bg, cfg.border)}>
                    <div className={clsx('text-3xl font-bold font-mono', cfg.color)}>
                        {(score * 100).toFixed(0)}%
                    </div>
                    <div className={clsx('text-xs font-bold mt-0.5', cfg.color)}>{level}</div>
                    <div className="text-xs text-kavach-muted mt-1">
                        {CATEGORY_ICON[risk?.outbreakCategory] || '❓'} {risk?.outbreakCategory ?? ward?.outbreakCategory ?? '—'}
                    </div>
                    {risk?.confidence && (
                        <div className="text-[10px] text-kavach-muted mt-1">
                            Confidence: {(risk.confidence * 100).toFixed(0)}%
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-kavach-border bg-white/5 p-3 text-center text-kavach-muted text-xs">
                    No prediction yet
                </div>
            )}

            <button
                onClick={onRunPrediction}
                disabled={predicting}
                className="w-full flex items-center justify-center gap-2 bg-kavach-accent hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-colors"
            >
                {predicting ? (
                    <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        Running AI...
                    </>
                ) : (
                    <>
                        <Zap size={12} />
                        Run 48h Prediction
                    </>
                )}
            </button>

            {risk?.predictedAt && (
                <p className="text-[10px] text-kavach-muted text-center">
                    Last: {new Date(risk.predictedAt).toLocaleTimeString()}
                </p>
            )}
        </div>
    );
}

