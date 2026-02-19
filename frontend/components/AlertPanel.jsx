import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_CONFIG = {
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚨' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: '🔴' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '🟠' },
    LOW: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '🟡' },
};

export default function AlertPanel({ alerts = [] }) {
    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell size={13} className="text-kavach-accent" />
                    <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider">Alerts</h3>
                </div>
                {alerts.length > 0 && (
                    <span className="text-[10px] bg-kavach-accent/20 text-kavach-accent px-1.5 py-0.5 rounded-full">
                        {alerts.length}
                    </span>
                )}
            </div>

            {alerts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-kavach-muted text-xs text-center">
                    <div>
                        <CheckCircle size={24} className="mx-auto mb-2 opacity-30 text-green-400" />
                        <p>No active alerts</p>
                        <p>for this ward</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2 overflow-y-auto flex-1">
                    {alerts.map((alert) => {
                        const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.LOW;
                        return (
                            <div
                                key={alert.id}
                                className={`rounded-lg border p-2.5 ${cfg.bg} ${cfg.border}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-bold ${cfg.color}`}>
                                        {cfg.icon} {alert.severity}
                                    </span>
                                    <span className="text-[10px] text-kavach-muted">
                                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-xs leading-relaxed text-kavach-text line-clamp-3">{alert.message}</p>
                                {alert.recommendedAction && (
                                    <p className="text-[10px] text-kavach-muted mt-1.5 leading-relaxed border-t border-white/10 pt-1.5">
                                        💡 {alert.recommendedAction}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
