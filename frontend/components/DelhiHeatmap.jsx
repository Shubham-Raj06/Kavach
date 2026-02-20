import React, { useState, useRef, useEffect } from 'react';

export default function DelhiHeatmap({ data = [], onWardSelect = null }) {
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredWard, setHoveredWard] = useState(null);

  // Mock Delhi wards with coordinates (normalized to SVG)
  const DELHI_WARDS = [
    { id: '1', name: 'Rohini', x: 25, y: 35, riskScore: 85 },
    { id: '2', name: 'Dwarka', x: 20, y: 55, riskScore: 45 },
    { id: '3', name: 'Central Delhi', x: 50, y: 50, riskScore: 62 },
    { id: '4', name: 'East Delhi', x: 70, y: 48, riskScore: 38 },
    { id: '5', name: 'West Delhi', x: 35, y: 60, riskScore: 72 },
    { id: '6', name: 'North Delhi', x: 52, y: 25, riskScore: 55 },
    { id: '7', name: 'South Delhi', x: 55, y: 70, riskScore: 48 },
    { id: '8', name: 'New Delhi', x: 50, y: 60, riskScore: 68 }
  ];

  // Merge with provided data or use defaults
  const wardData = DELHI_WARDS.map(ward => {
    const customData = data.find(d => d.wardId === ward.id);
    return { ...ward, ...(customData && { riskScore: customData.riskScore }) };
  });

  const getRiskColor = (score) => {
    if (score < 25) return '#10b981'; // green
    if (score < 50) return '#eab308'; // yellow
    if (score < 75) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getRiskColorLight = (score) => {
    if (score < 25) return '#d1fae5';
    if (score < 50) return '#fef3c7';
    if (score < 75) return '#fed7aa';
    return '#fecaca';
  };

  const handleWardClick = (ward) => {
    setSelectedWard(ward);
    if (onWardSelect) {
      onWardSelect(ward);
    }
  };

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl overflow-hidden border border-slate-700/50 backdrop-blur-sm">
      {/* Header */}
      <div className="px-6 py-6 border-b border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-2">Delhi NCR Risk Heatmap</h2>
        <p className="text-slate-400 text-sm">Interactive ward-level disease risk visualization</p>
      </div>

      {/* Map Container */}
      <div className="relative w-full px-6 py-8">
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
          <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ aspectRatio: '1/1' }}>
            {/* Background */}
            <rect width="100" height="100" fill="#0f172a" />

            {/* Grid lines */}
            <line x1="0" y1="50" x2="100" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />
            <line x1="50" y1="0" x2="50" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2" />

            {/* Ward circles */}
            {wardData.map((ward) => (
              <g key={ward.id}>
                {/* Ward circle */}
                <circle
                  cx={ward.x}
                  cy={ward.y}
                  r={hoveredWard?.id === ward.id || selectedWard?.id === ward.id ? 7 : 5}
                  fill={getRiskColor(ward.riskScore)}
                  fillOpacity={hoveredWard?.id === ward.id || selectedWard?.id === ward.id ? 1 : 0.7}
                  stroke="#fff"
                  strokeWidth={selectedWard?.id === ward.id ? "2" : "1"}
                  className="transition-all cursor-pointer hover:filter hover:drop-shadow-lg"
                  onMouseEnter={() => setHoveredWard(ward)}
                  onMouseLeave={() => setHoveredWard(null)}
                  onClick={() => handleWardClick(ward)}
                  style={{
                    filter: hoveredWard?.id === ward.id ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))' : 'none'
                  }}
                />

                {/* Pulsing aura for high risk */}
                {ward.riskScore > 70 && (
                  <>
                    <circle
                      cx={ward.x}
                      cy={ward.y}
                      r={8}
                      fill="none"
                      stroke={getRiskColor(ward.riskScore)}
                      strokeWidth="0.5"
                      opacity="0.5"
                      className="animate-pulse"
                    />
                  </>
                )}

                {/* Ward label - show on hover or select */}
                {(hoveredWard?.id === ward.id || selectedWard?.id === ward.id) && (
                  <g>
                    <rect
                      x={ward.x - 12}
                      y={ward.y - 15}
                      width="24"
                      height="8"
                      fill="#0f172a"
                      stroke={getRiskColor(ward.riskScore)}
                      strokeWidth="0.5"
                      rx="1"
                    />
                    <text
                      x={ward.x}
                      y={ward.y - 9}
                      textAnchor="middle"
                      fontSize="2.5"
                      fill={getRiskColor(ward.riskScore)}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {ward.riskScore}
                    </text>
                  </g>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-xs text-slate-400">Low (&lt;25)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500" />
            <span className="text-xs text-slate-400">Medium (25-50)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500" />
            <span className="text-xs text-slate-400">High (50-75)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-xs text-slate-400">Critical (&gt;75)</span>
          </div>
        </div>
      </div>

      {/* Selected Ward Details */}
      {selectedWard && (
        <div className="px-6 py-6 border-t border-slate-700/50 bg-slate-900/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedWard.name}</h3>
              <p className="text-sm text-slate-400">Ward ID: {selectedWard.id}</p>
            </div>
            <button
              onClick={() => setSelectedWard(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Risk Score</div>
              <div className="text-2xl font-bold" style={{ color: getRiskColor(selectedWard.riskScore) }}>
                {selectedWard.riskScore}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Status</div>
              <div className="text-sm font-semibold text-white">
                {selectedWard.riskScore < 25 ? 'Safe' : selectedWard.riskScore < 50 ? 'Caution' : selectedWard.riskScore < 75 ? 'Alert' : 'Critical'}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Trend</div>
              <div className="text-sm font-semibold text-orange-400">Monitoring</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 border border-slate-700/30">
              <div className="text-xs text-slate-400 mb-1">Last Update</div>
              <div className="text-sm font-semibold text-blue-400">Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
