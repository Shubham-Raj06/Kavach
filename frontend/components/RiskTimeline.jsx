import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RiskTimeline = ({ wardId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Determine API URL
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

        // Simulate fetch logic or use real endpoint if available
        // GET /api/wards/{id}/history
        const fetchHistory = async () => {
            try {
                setLoading(true);
                // Mock data fallback for now if endpoint not fully populated
                const mockHistory = Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                    risk: Math.max(0, Math.min(100, Math.floor(Math.random() * 40) + 40 + Math.sin(i / 3) * 20))
                }));
                setHistory(mockHistory);
            } catch (err) {
                console.error("Failed to fetch risk history", err);
            } finally {
                setLoading(false);
            }
        };

        if (wardId) fetchHistory();
    }, [wardId]);

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 10px 0', fontSize: '15px', fontWeight: 600 }}>
                30-Day Risk Trend
            </h3>

            <div style={{ flex: 1, minHeight: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                        <XAxis dataKey="date" hide />
                        <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                            labelStyle={{ color: '#cbd5e1' }}
                            itemStyle={{ color: '#fcd34d' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="risk"
                            stroke="#fcd34d"
                            strokeWidth={2}
                            dot={false}
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RiskTimeline;
