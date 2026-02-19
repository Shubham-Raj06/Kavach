import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

const RiskOverviewCard = ({ riskScore, outbreakCategory, confidence }) => {
    const score = Math.round(riskScore || 0);

    // Determine color and severity
    let color = '#22c55e'; // Green (0-24)
    if (score >= 25) color = '#eab308'; // Yellow (25-49)
    if (score >= 50) color = '#f97316'; // Orange (50-74)
    if (score >= 75) color = '#ef4444'; // Red (75-100)

    const data = [{ value: score, fill: color }];

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            boxShadow: score >= 70 ? `0 0 20px ${color}40` : 'none',
            transition: 'box-shadow 0.5s ease',
            animation: score >= 70 ? 'pulse 2s infinite' : 'none',
        }}>
            <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}40; }
          70% { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
      `}</style>

            <div style={{ position: 'relative', width: 200, height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="80%" outerRadius="100%"
                        barSize={15}
                        data={data}
                        startAngle={90} endAngle={-270}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background clockWise dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                </ResponsiveContainer>

                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff' }}>{score}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>RISK SCORE</div>
                </div>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: color,
                    marginBottom: '4px',
                    letterSpacing: '0.5px'
                }}>
                    {outbreakCategory || 'ANALYZING...'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Confidence: <span style={{ color: '#cbd5e1' }}>{Math.round((confidence || 0) * 100)}%</span>
                </div>
            </div>
        </div>
    );
};

export default RiskOverviewCard;
