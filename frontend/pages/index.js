import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import DiseaseHeroStatus from '../components/DiseaseHeroStatus';
import DelhiHeatmap from '../components/DelhiHeatmap';

export default function Home() {
    const [riskData, setRiskData] = useState(null);
    const [heatmapData, setHeatmapData] = useState([]);

    useEffect(() => {
        // Mock Data for Initial Render (Replace with API calls)
        setRiskData({
            riskScore: 78,
            category: 'CRITICAL',
            confidence: 92,
            outbreakType: 'Waterborne (Cholera)',
            lastUpdated: new Date().toISOString(),
            trend: 'RISING'
        });

        // Mock Heatmap Data
        setHeatmapData([
            { wardId: '1', name: 'Rohini', latitude: 28.7041, longitude: 77.1025, riskScore: 85 },
            { wardId: '2', name: 'Dwarka', latitude: 28.5921, longitude: 77.0460, riskScore: 45 },
            { wardId: '3', name: 'CP', latitude: 28.6276, longitude: 77.2156, riskScore: 60 },
        ]);

        // Real API Call (Uncomment when backend is ready & CORS configured)
        /*
        fetch('http://localhost:5000/api/risk/overall?region=delhi')
            .then(res => res.json())
            .then(data => setRiskData(data))
            .catch(err => console.error('Failed to fetch risk status', err));
        
        fetch('http://localhost:5000/api/risk/heatmap')
             .then(res => res.json())
             .then(data => setHeatmapData(data))
             .catch(err => console.error('Failed to fetch heatmap', err));
        */

    }, []);

    if (!riskData) return <div className="text-white bg-slate-950 h-screen flex items-center justify-center">Loading Intelligence...</div>;

    return (
        <div className="bg-slate-950 min-h-screen text-white selection:bg-rose-500 selection:text-white">
            <Head>
                <title>Kavach | Disease Intelligence</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <main className="flex flex-col">
                {/* 1. Hero Status Panel */}
                <DiseaseHeroStatus
                    riskScore={riskData.riskScore}
                    category={riskData.category || riskData.outbreakCategory}
                    confidence={riskData.confidence}
                    outbreakType={riskData.outbreakType}
                    lastUpdated={riskData.lastUpdated}
                    trend={riskData.trend}
                />

                {/* 2. Live Heatmap */}
                <div className="relative z-10 px-4 pb-20">
                    <DelhiHeatmap data={heatmapData} />
                </div>

                {/* 3. Detailed Stats / Footer (Optional placeholder) */}
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400 text-sm opacity-50 pb-10">
                    <p>AI Model v2.1 (XGBoost + LSTM)</p>
                    <p className="text-center">Data Sources: MCD, IMD, Sentinel Hospitals</p>
                    <p className="text-right">Government of NCT Delhi</p>
                </div>
            </main>
        </div>
    );
}
