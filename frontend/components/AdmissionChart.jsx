'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ADMISSION_TREND } from '../lib/mockData';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 text-xs backdrop-blur-sm">
            <div className="text-white/60 mb-1 font-semibold">{label}</div>
            {payload.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                    <span className="text-white/70">{p.name}:</span>
                    <span className="text-white font-bold">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function AdmissionChart() {
    return (
        <div className="w-full h-full" style={{ minHeight: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ADMISSION_TREND} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="W12" name="Dharavi" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))' }} />
                    <Bar dataKey="W05" name="Govandi" stackId="a" fill="#f97316"
                        style={{ filter: 'drop-shadow(0 0 4px rgba(249,115,22,0.4))' }} />
                    <Bar dataKey="W21" name="Kurla" stackId="a" fill="#a855f7" radius={[3, 3, 0, 0]}
                        style={{ filter: 'drop-shadow(0 0 4px rgba(168,85,247,0.4))' }} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
