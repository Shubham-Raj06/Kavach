import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { AlertTriangle, MapPin, TrendingUp } from 'lucide-react';

// Delhi NCR wards and districts with real coordinates
const DELHI_WARDS = [
  { id: 'rohini', name: 'Rohini', type: 'Ward', lat: 28.7541, lng: 77.0855, riskScore: 85, category: 'CRITICAL', trend: 'RISING' },
  { id: 'dwarka', name: 'Dwarka', type: 'Ward', lat: 28.5921, lng: 77.0460, riskScore: 45, category: 'MEDIUM', trend: 'STABLE' },
  { id: 'central', name: 'Central Delhi', type: 'Ward', lat: 28.6329, lng: 77.2297, riskScore: 62, category: 'HIGH', trend: 'RISING' },
  { id: 'east', name: 'East Delhi', type: 'Ward', lat: 28.6139, lng: 77.3081, riskScore: 38, category: 'MEDIUM', trend: 'FALLING' },
  { id: 'west', name: 'West Delhi', type: 'Ward', lat: 28.6505, lng: 77.0565, riskScore: 72, category: 'HIGH', trend: 'RISING' },
  { id: 'north', name: 'North Delhi', type: 'Ward', lat: 28.7291, lng: 77.2295, riskScore: 55, category: 'MEDIUM', trend: 'STABLE' },
  { id: 'south', name: 'South Delhi', type: 'Ward', lat: 28.5244, lng: 77.1855, riskScore: 48, category: 'MEDIUM', trend: 'STABLE' },
  { id: 'newdelhi', name: 'New Delhi', type: 'Ward', lat: 28.6139, lng: 77.2090, riskScore: 68, category: 'HIGH', trend: 'RISING' },
  { id: 'gurugram', name: 'Gurugram', type: 'District', lat: 28.4595, lng: 77.0266, riskScore: 52, category: 'MEDIUM', trend: 'STABLE' },
  { id: 'noida', name: 'Noida', type: 'District', lat: 28.5355, lng: 77.3910, riskScore: 65, category: 'HIGH', trend: 'RISING' },
  { id: 'ghaziabad', name: 'Ghaziabad', type: 'District', lat: 28.6692, lng: 77.4538, riskScore: 58, category: 'MEDIUM', trend: 'STABLE' },
  { id: 'faridabad', name: 'Faridabad', type: 'District', lat: 28.4089, lng: 77.3178, riskScore: 42, category: 'MEDIUM', trend: 'FALLING' },
];

function getRiskColor(score) {
  if (score < 25) return '#10b981'; // green
  if (score < 50) return '#eab308'; // yellow
  if (score < 75) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getCategoryLabel(score) {
  if (score < 25) return 'LOW RISK';
  if (score < 50) return 'MEDIUM RISK';
  if (score < 75) return 'HIGH RISK';
  return 'CRITICAL';
}

export default function HealthMap() {
  const mapContainer = useRef(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredWard, setHoveredWard] = useState(null);

  // Simple SVG-based map for Delhi
  const renderMap = () => {
    return (
      <svg viewBox="0 0 400 400" className="w-full h-full" style={{ background: '#0f172a' }}>
        {/* Base rectangle representing Delhi */}
        <rect x="80" y="120" width="240" height="180" fill="#1e293b" stroke="#475569" strokeWidth="2" />
        
        {/* Grid lines */}
        <line x1="80" y1="150" x2="320" y2="150" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="80" y1="180" x2="320" y2="180" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="80" y1="210" x2="320" y2="210" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="80" y1="240" x2="320" y2="240" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="130" y1="120" x2="130" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="170" y1="120" x2="170" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="210" y1="120" x2="210" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />
        <line x1="250" y1="120" x2="250" y2="300" stroke="#334155" strokeWidth="0.5" strokeDasharray="4" />

        {/* Ward/District markers */}
        {DELHI_WARDS.map((ward) => {
          // Normalize coordinates to SVG viewBox (Delhi center ~28.6°N, 77.2°E)
          const svgX = 80 + (ward.lng - 77.0) * 24;
          const svgY = 120 + (28.8 - ward.lat) * 22;
          const isHovered = hoveredWard?.id === ward.id;
          const isSelected = selectedWard?.id === ward.id;
          const size = isHovered || isSelected ? 14 : ward.type === 'District' ? 12 : 10;

          return (
            <g key={ward.id}>
              {/* Pulsing aura for high risk */}
              {ward.riskScore > 70 && (
                <circle cx={svgX} cy={svgY} r={size + 6} fill="none" stroke={getRiskColor(ward.riskScore)} 
                  strokeWidth="1" opacity="0.3" className="animate-pulse" />
              )}

              {/* Main marker circle */}
              <circle
                cx={svgX}
                cy={svgY}
                r={size}
                fill={getRiskColor(ward.riskScore)}
                stroke="white"
                strokeWidth={isSelected ? "2" : "1.5"}
                opacity={isHovered || isSelected ? 1 : 0.8}
                className="cursor-pointer hover:opacity-100 transition-all"
                onClick={() => {
                  setSelectedWard(ward);
                  setHoveredWard(ward);
                }}
                onMouseEnter={() => setHoveredWard(ward)}
                onMouseLeave={() => setHoveredWard(null)}
                style={{
                  filter: isHovered || isSelected ? `drop-shadow(0 0 8px ${getRiskColor(ward.riskScore)})` : 'none'
                }}
              />

              {/* Risk score text inside circle */}
              <text
                x={svgX}
                y={svgY + 3}
                textAnchor="middle"
                fontSize="6"
                fontWeight="bold"
                fill="white"
                pointerEvents="none"
              >
                {ward.riskScore}
              </text>

              {/* Label on hover */}
              {(isHovered || isSelected) && (
                <g>
                  <rect
                    x={svgX - 24}
                    y={svgY - 18}
                    width="48"
                    height="12"
                    fill="#0f172a"
                    stroke={getRiskColor(ward.riskScore)}
                    strokeWidth="0.8"
                    rx="2"
                    opacity="0.95"
                  />
                  <text
                    x={svgX}
                    y={svgY - 10}
                    textAnchor="middle"
                    fontSize="6"
                    fontWeight="bold"
                    fill={getRiskColor(ward.riskScore)}
                    pointerEvents="none"
                  >
                    {ward.name.split(' ')[0]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Labels */}
        <text x="200" y="110" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#e2e8f0">
          Delhi NCR Health Map
        </text>
      </svg>
    );
  };

  return (
    <>
      <Head>
        <title>Health Map - Kavach Disease Intelligence</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="h-screen w-full flex bg-slate-950 text-white">
        {/* Map Container */}
        <div ref={mapContainer} className="flex-1 relative bg-slate-900 border border-slate-700/50" style={{ minHeight: '100vh' }}>
          <div className="w-full h-full p-8">
            {renderMap()}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur border border-slate-700/50 rounded-lg p-4">
            <p className="text-xs uppercase text-slate-400 font-semibold mb-3">Risk Level</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-slate-300">Low (&lt;25)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-slate-300">Medium (25-50)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs text-slate-300">High (50-75)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-slate-300">Critical (&gt;75)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-gradient-to-b from-slate-900 to-slate-950 border-l border-slate-700/50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-slate-700/50">
            <h2 className="text-2xl font-bold text-white mb-2">Health Intelligence Map</h2>
            <p className="text-slate-400 text-sm">Real-time disease risk monitoring for Delhi NCR</p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {selectedWard ? (
              <div className="space-y-6">
                {/* Selected Ward Card */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <MapPin size={24} className="text-green-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{selectedWard.name}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-wider">{selectedWard.type}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Score Display */}
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/30 rounded-lg border border-slate-700/30 p-4">
                    <p className="text-slate-400 text-sm uppercase mb-2">Risk Score</p>
                    <div className="flex items-baseline gap-3">
                      <div className="text-4xl font-black" style={{ color: getRiskColor(selectedWard.riskScore) }}>
                        {selectedWard.riskScore}
                      </div>
                      <div className="text-sm font-semibold px-3 py-1 rounded-full" 
                        style={{ 
                          background: `${getRiskColor(selectedWard.riskScore)}20`,
                          color: getRiskColor(selectedWard.riskScore),
                          border: `1px solid ${getRiskColor(selectedWard.riskScore)}40`
                        }}>
                        {getCategoryLabel(selectedWard.riskScore)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Status */}
                  <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-3">
                    <p className="text-slate-400 text-xs uppercase mb-2">Status</p>
                    <p className="font-semibold text-white">
                      {selectedWard.riskScore < 25 ? '✓ Safe' : selectedWard.riskScore < 50 ? '⚠ Caution' : selectedWard.riskScore < 75 ? '⚠ Alert' : '🚨 Critical'}
                    </p>
                  </div>

                  {/* Trend */}
                  <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-3">
                    <p className="text-slate-400 text-xs uppercase mb-2">Trend</p>
                    <p className={`font-semibold flex items-center gap-1 ${
                      selectedWard.trend === 'RISING' ? 'text-red-400' : 
                      selectedWard.trend === 'FALLING' ? 'text-green-400' : 
                      'text-yellow-400'
                    }`}>
                      {selectedWard.trend === 'RISING' ? '📈' : selectedWard.trend === 'FALLING' ? '📉' : '➡️'} {selectedWard.trend}
                    </p>
                  </div>
                </div>

                {/* Additional Data */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/30 p-4">
                  <p className="text-slate-400 text-xs uppercase mb-3 font-semibold">Real-time Data</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Model Confidence</span>
                      <span className="text-green-400 font-semibold">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Last Updated</span>
                      <span className="text-blue-400 font-semibold">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Forecast (48h)</span>
                      <span className="text-orange-400 font-semibold">+{Math.round(selectedWard.riskScore * 1.1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Population Density</span>
                      <span className="text-slate-300 font-semibold">High</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg transition-all">
                  View Detailed Report
                </button>
                <button className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 font-semibold py-3 rounded-lg transition-all">
                  Send Alert
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <MapPin size={48} className="text-slate-600 mb-4" />
                <p className="text-slate-400 mb-2">Click on a ward or district marker on the map</p>
                <p className="text-slate-500 text-sm">Select any location to view real-time health data</p>
              </div>
            )}
          </div>

          {/* Wards List */}
          {!selectedWard && (
            <div className="px-6 py-4 border-t border-slate-700/50">
              <p className="text-slate-400 text-xs uppercase mb-3 font-semibold">Quick Access</p>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {DELHI_WARDS.map((ward) => (
                  <button
                    key={ward.id}
                    onClick={() => setSelectedWard(ward)}
                    onMouseEnter={() => setHoveredWard(ward)}
                    onMouseLeave={() => setHoveredWard(null)}
                    className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/30 rounded p-2 text-xs font-semibold text-slate-300 hover:text-white transition-all"
                    style={{ borderLeftColor: getRiskColor(ward.riskScore), borderLeftWidth: '3px' }}
                  >
                    {ward.name}
                    <br/>
                    <span style={{ color: getRiskColor(ward.riskScore) }}>{ward.riskScore}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
