import React, { useState, useEffect } from 'react';

export default function DiseaseHeroStatus({
  riskScore = 45,
  category = 'MEDIUM',
  confidence = 85,
  outbreakType = 'Waterborne',
  lastUpdated = new Date().toISOString(),
  trend = 'STABLE'
}) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Animate score on mount
    const timer = setTimeout(() => setDisplayScore(riskScore), 100);
    return () => clearTimeout(timer);
  }, [riskScore]);

  const getGradient = () => {
    if (riskScore < 25) return 'from-green-500/20 to-green-600/20';
    if (riskScore < 50) return 'from-yellow-500/20 to-yellow-600/20';
    if (riskScore < 75) return 'from-orange-500/20 to-orange-600/20';
    return 'from-red-500/20 to-red-600/20';
  };

  const getBgColor = () => {
    if (riskScore < 25) return 'bg-gradient-to-br from-green-900/40 to-green-800/20';
    if (riskScore < 50) return 'bg-gradient-to-br from-yellow-900/40 to-yellow-800/20';
    if (riskScore < 75) return 'bg-gradient-to-br from-orange-900/40 to-orange-800/20';
    return 'bg-gradient-to-br from-red-900/40 to-red-800/20';
  };

  const getTextColor = () => {
    if (riskScore < 25) return 'text-green-300';
    if (riskScore < 50) return 'text-yellow-300';
    if (riskScore < 75) return 'text-orange-300';
    return 'text-red-300';
  };

  const getStatusBadgeColor = () => {
    if (riskScore < 25) return 'bg-green-500/20 text-green-300 border-green-500/50';
    if (riskScore < 50) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    if (riskScore < 75) return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    return 'bg-red-500/20 text-red-300 border-red-500/50';
  };

  const getCategoryLabel = () => {
    if (riskScore < 25) return 'LOW RISK';
    if (riskScore < 50) return 'MEDIUM RISK';
    if (riskScore < 75) return 'HIGH RISK';
    return 'CRITICAL';
  };

  return (
    <div className="relative w-full min-h-[500px] overflow-hidden bg-slate-950">
      {/* Background blur effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950" />
      
      {/* Animated gradient background */}
      <div className={`absolute inset-0 ${getBgColor()} animate-pulse`} />

      {/* Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 py-20">
        {/* Status Badge */}
        <div className={`mb-6 px-4 py-2 rounded-full border ${getStatusBadgeColor()} text-sm font-semibold tracking-wide`}>
          {getCategoryLabel()}
        </div>

        {/* Risk Score - Main Display */}
        <div className="mb-8">
          <div className={`relative w-64 h-64 flex items-center justify-center`}>
            {/* Animated pulsing aura for high risk */}
            {riskScore > 70 && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse blur-xl" />
                <div className="absolute inset-8 rounded-full bg-red-500/10 animate-pulse blur-lg" />
              </>
            )}
            
            {/* Score circle */}
            <div className={`flex flex-col items-center justify-center`}>
              <div className={`text-7xl font-black ${getTextColor()} transition-all duration-500`}>
                {Math.round(displayScore)}
              </div>
              <div className="text-slate-400 text-lg font-light mt-2">Risk Score</div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="w-full max-w-3xl grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {/* Confidence */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg border border-slate-700/50 p-4 text-center">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Confidence</div>
            <div className="text-2xl font-bold text-blue-400">{confidence}%</div>
          </div>

          {/* Category */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg border border-slate-700/50 p-4 text-center">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Category</div>
            <div className="text-lg font-bold text-purple-400">{outbreakType}</div>
          </div>

          {/* Trend */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg border border-slate-700/50 p-4 text-center">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Trend</div>
            <div className={`text-lg font-bold ${trend === 'RISING' ? 'text-red-400' : trend === 'FALLING' ? 'text-green-400' : 'text-yellow-400'}`}>
              {trend}
            </div>
          </div>

          {/* Last Updated */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-lg border border-slate-700/50 p-4 text-center">
            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2">Updated</div>
            <div className="text-sm font-mono text-slate-300">{new Date(lastUpdated).toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 max-w-2xl text-center text-slate-400 text-sm">
          <p>Real-time disease outbreak risk assessment for Delhi NCR region. Data updated every 5 minutes.</p>
        </div>
      </div>
    </div>
  );
}
