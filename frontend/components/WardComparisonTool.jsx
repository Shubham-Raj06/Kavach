import React from 'react';
import RiskOverviewCard from './RiskOverviewCard';
import ForecastChart from './ForecastChart';

const WardComparisonTool = ({ wardA, wardB }) => {
    if (!wardA || !wardB) return null;

    return (
        <div style={{
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: '24px'
        }}>
            <h3 style={{ color: '#e2e8f0', margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
                Ward Comparison Analysis
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Ward A Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '8px', background: '#334155', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
                        {wardA.name || wardA.wardId}
                    </div>
                    <div style={{ height: 260 }}>
                        <RiskOverviewCard
                            riskScore={wardA.riskScore}
                            outbreakCategory={wardA.outbreakCategory}
                            confidence={wardA.confidence}
                        />
                    </div>
                    <div style={{ height: 200 }}>
                        <ForecastChart forecast={wardA.forecast} />
                    </div>
                </div>

                {/* Ward B Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '8px', background: '#475569', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
                        {wardB.name || wardB.wardId}
                    </div>
                    <div style={{ height: 260 }}>
                        <RiskOverviewCard
                            riskScore={wardB.riskScore}
                            outbreakCategory={wardB.outbreakCategory}
                            confidence={wardB.confidence}
                        />
                    </div>
                    <div style={{ height: 200 }}>
                        <ForecastChart forecast={wardB.forecast} />
                    </div>
                </div>
            </div>

            {/* Comparative Metrics Table */}
            <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', fontSize: '14px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #334155' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Metric</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>{wardA.wardId}</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>{wardB.wardId}</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Delta</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '10px' }}>Risk Score</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{wardA.riskScore}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{wardB.riskScore}</td>
                            <td style={{ padding: '10px', textAlign: 'center', color: Math.abs(wardA.riskScore - wardB.riskScore) > 10 ? '#f59e0b' : '#94a3b8' }}>
                                {Math.abs(wardA.riskScore - wardB.riskScore)}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px' }}>Confidence</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{(wardA.confidence * 100).toFixed(0)}%</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{(wardB.confidence * 100).toFixed(0)}%</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WardComparisonTool;
