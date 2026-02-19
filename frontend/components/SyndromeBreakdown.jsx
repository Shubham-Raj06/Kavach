import { BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SYNDROME_COLORS = {
    DIARRHEA: '#3b82f6',
    FEVER: '#f97316',
    VOMITING: '#a855f7',
    COUGH: '#06b6d4',
    RESPIRATORY_DISTRESS: '#ef4444',
    SKIN_RASH: '#eab308',
    JAUNDICE: '#84cc16',
    UNKNOWN: '#6b7280',
};

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-kavach-surface border border-kavach-border rounded-lg px-3 py-2 text-xs">
            <p className="font-semibold">{payload[0].payload.name}</p>
            <p className="text-kavach-muted">{payload[0].value} admissions</p>
        </div>
    );
};

export default function SyndromeBreakdown({ summary }) {
    if (!summary?.breakdown?.length) {
        return (
            <div className="h-full flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <BarChart2 size={13} className="text-kavach-accent" />
                    <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider">Syndrome Breakdown</h3>
                </div>
                <div className="flex-1 flex items-center justify-center text-kavach-muted text-xs text-center">
                    <div>
                        <BarChart2 size={24} className="mx-auto mb-2 opacity-30" />
                        <p>Select a ward to see</p>
                        <p>syndrome distribution</p>
                    </div>
                </div>
            </div>
        );
    }

    const chartData = summary.breakdown.map((b) => ({
        name: b.syndromeType.replace('_', ' '),
        value: b._sum?.admissionCount ?? 0,
        syndrome: b.syndromeType,
    }));

    return (
        <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart2 size={13} className="text-kavach-accent" />
                    <h3 className="text-xs font-semibold text-kavach-muted uppercase tracking-wider">Syndrome Breakdown</h3>
                </div>
                <span className="text-[10px] text-kavach-muted">Last {summary.periodDays}d · {summary.totalAdmissions} total</span>
            </div>

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9, fill: '#6b7280' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                            {chartData.map((entry, i) => (
                                <Cell key={i} fill={SYNDROME_COLORS[entry.syndrome] || '#6b7280'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
