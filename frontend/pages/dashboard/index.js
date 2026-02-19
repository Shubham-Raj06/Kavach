import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import RiskOverviewCard from '../components/RiskOverviewCard';
import ShapBarChart from '../components/ShapBarChart';
import ForecastChart from '../components/ForecastChart';
import RiskTimeline from '../components/RiskTimeline';
import LiveAlertFeed from '../components/LiveAlertFeed';

// Mock Data for Demo
const MOCK_WARD_DATA = {
    wardId: "W-101",
    riskScore: 72,
    outbreakCategory: "WATERBORNE",
    confidence: 0.86,
    shapReasons: [
        { feature: "symptom_count_diarrhea_24h", impact: 0.42 },
        { feature: "chlorine_level", impact: 0.31 },
        { feature: "rainfall_mm_72h", impact: 0.19 },
        { feature: "avg_temp", impact: 0.05 },
        { feature: "population_density", impact: 0.03 }
    ],
    forecast: [
        { hour: "0h", risk: 72, upper: 80, lower: 65 },
        { hour: "24h", risk: 78, upper: 85, lower: 70 },
        { hour: "48h", risk: 83, upper: 92, lower: 75 }
    ]
};

const DashboardLayout = () => {
    const [selectedWardId, setSelectedWardId] = useState("W-101");
    const [wardData, setWardData] = useState(MOCK_WARD_DATA);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Clock timer
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

                // Parallel fetch for risk, shap, forecast
                const [riskRes, prevRes] = await Promise.allSettled([
                    fetch(`${API_URL}/risk/${selectedWardId}`),
                    fetch(`${API_URL}/wards/${selectedWardId}/history`) // Proxy for forecast/shap if dedicated endpoints missing
                ]);

                if (riskRes.status === 'fulfilled' && riskRes.value.ok) {
                    const riskData = await riskRes.value.json();

                    setWardData(prev => ({
                        ...prev,
                        wardId: riskData.wardId,
                        riskScore: riskData.riskScore,
                        outbreakCategory: riskData.outbreakCategory,
                        confidence: riskData.confidence,
                        // Fallback to existing mock if API doesn't return these yet
                        shapReasons: riskData.shapReasons || prev.shapReasons,
                        forecast: riskData.forecast || prev.forecast
                    }));
                }
            } catch (err) {
                console.error("Dashboard data fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        if (selectedWardId) fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [selectedWardId]);

    return (
        <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
            <Head>
                <title>Kavach Command Center</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            {/* Top Navigation Bar */}
            <header style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }} />
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>KAVACH</h1>
                        <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>National Health Command Center</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                    <button style={{
                        background: '#ef4444', color: 'white', border: 'none',
                        padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                        boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)', cursor: 'pointer',
                        opacity: loading ? 0.7 : 1
                    }}>
                        {loading ? 'SYNCING...' : 'EMERGENCY OVERRIDE'}
                    </button>
                </div>
            </header>

            {/* Main Grid Content */}
            <main style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>

                {/* Row 1: Key Metrics & Map Placeholder */}
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr minmax(300px, 350px)', gap: '24px', marginBottom: '24px', minHeight: '400px' }}>

                    {/* Left: Ward Analytics Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ flex: 1 }}>
                            <RiskOverviewCard
                                riskScore={wardData.riskScore}
                                outbreakCategory={wardData.outbreakCategory}
                                confidence={wardData.confidence}
                            />
                        </div>
                    </div>

                    {/* Center: Interactive Map (Placeholder for now) */}
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Map would be integrated here */}
                        <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
                            <select
                                value={selectedWardId}
                                onChange={(e) => setSelectedWardId(e.target.value)}
                                style={{
                                    background: 'rgba(0,0,0,0.6)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer'
                                }}
                            >
                                <option value="W-101">Ward 101 - South Delhi</option>
                                <option value="W-102">Ward 102 - Karol Bagh</option>
                                <option value="W-103">Ward 103 - Connaught Place</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', background: `radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)` }}>
                            [ Geo-Spatial Risk Heatmap Integration ]
                        </div>
                    </div>

                    {/* Right: Live Alerts */}
                    <div style={{ height: '400px' }}>
                        <LiveAlertFeed maxAlerts={10} />
                    </div>
                </div>

                {/* Row 2: Deep Dive Analytics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', minHeight: '320px' }}>
                    <ShapBarChart shapReasons={wardData.shapReasons} />
                    <ForecastChart forecast={wardData.forecast} />
                    <RiskTimeline wardId={selectedWardId} />
                </div>

            </main>
        </div>
    );
};

export default DashboardLayout;
