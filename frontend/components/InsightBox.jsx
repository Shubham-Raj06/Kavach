import { Brain } from 'lucide-react';

export default function InsightBox({ reasons = [] }) {
    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <Brain size={13} className="text-kavach-accent" />
                <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider">AI Insight Box</h3>
            </div>

            {reasons && reasons.length > 0 ? (
                <div className="flex flex-col gap-1.5 overflow-y-auto flex-1">
                    {reasons.map((reason, i) => (
                        <div
                            key={i}
                            className="text-xs bg-white/5 border border-kavach-border rounded-lg px-3 py-2 leading-relaxed hover:bg-white/8 transition-colors"
                        >
                            {reason}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-kavach-muted text-xs text-center">
                    <div>
                        <Brain size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Run a prediction to see</p>
                        <p>AI-generated outbreak insights</p>
                    </div>
                </div>
            )}
        </div>
    );
}
