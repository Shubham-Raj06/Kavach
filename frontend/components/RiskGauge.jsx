'use client';
import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GRADIENT_STOPS = [
    { pct: 0, color: '#22c55e' },  // 0%   green
    { pct: 40, color: '#84cc16' },  // 40%  lime
    { pct: 60, color: '#eab308' },  // 60%  amber
    { pct: 80, color: '#f97316' },  // 80%  orange
    { pct: 100, color: '#ef4444' },  // 100% red
];

function interpolateColor(score) {
    for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
        const lo = GRADIENT_STOPS[i], hi = GRADIENT_STOPS[i + 1];
        if (score >= lo.pct && score <= hi.pct) {
            const t = (score - lo.pct) / (hi.pct - lo.pct);
            const from = parseInt(lo.color.slice(1), 16);
            const to = parseInt(hi.color.slice(1), 16);
            const r = Math.round(((from >> 16) & 0xff) * (1 - t) + ((to >> 16) & 0xff) * t);
            const g = Math.round(((from >> 8) & 0xff) * (1 - t) + ((to >> 8) & 0xff) * t);
            const b = Math.round((from & 0xff) * (1 - t) + (to & 0xff) * t);
            return `rgb(${r},${g},${b})`;
        }
    }
    return '#ef4444';
}

// SVG arc gauge
function Gauge({ score = 0, size = 140 }) {
    const [current, setCurrent] = useState(0);
    const r = size * 0.38;
    const cx = size / 2, cy = size / 2;
    const startAngle = -220, endAngle = 40; // sweep 260°
    const totalDeg = endAngle - startAngle;

    useEffect(() => {
        const timer = setTimeout(() => setCurrent(score), 50);
        return () => clearTimeout(timer);
    }, [score]);

    function polarToXY(angle, radius) {
        const rad = (angle * Math.PI) / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }

    function describeArc(angleStart, angleEnd, radius) {
        const s = polarToXY(angleStart, radius);
        const e = polarToXY(angleEnd, radius);
        const large = angleEnd - angleStart > 180 ? 1 : 0;
        return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
    }

    const fillAngle = startAngle + (current / 100) * totalDeg;
    const col = interpolateColor(current);
    const strokeW = size * 0.07;

    return (
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ overflow: 'visible' }}>
                {/* Track */}
                <path d={describeArc(startAngle, endAngle, r)} fill="none" strokeWidth={strokeW} stroke="rgba(255,255,255,0.06)" strokeLinecap="round" />
                {/* Fill arc */}
                <motion.path
                    d={describeArc(startAngle, endAngle, r)} fill="none" strokeLinecap="round"
                    strokeWidth={strokeW} stroke={col}
                    strokeDasharray="1000"
                    initial={{ strokeDashoffset: 1000 }}
                    animate={{ strokeDashoffset: 1000 - (current / 100) * 1000 * (totalDeg / 360) * (2 * Math.PI * r) / (2 * Math.PI * r) }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 ${size * 0.06}px ${col})` }}
                />
                {/* Score text */}
                <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontSize: size * 0.23, fontWeight: 800, fill: col, fontFamily: 'monospace' }}>
                    {Math.round(current)}
                </text>
                <text x={cx} y={cy + size * 0.16} textAnchor="middle"
                    style={{ fontSize: size * 0.09, fill: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
                    RISK SCORE
                </text>
            </svg>
        </div>
    );
}

function ConfidenceBar({ confidence = 0, label = 'Model Confidence' }) {
    const pct = Math.round(confidence * 100);
    const col = pct >= 85 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
    return (
        <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: col, fontFamily: 'monospace' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${col}aa, ${col})`, borderRadius: 3 }}
                />
            </div>
        </div>
    );
}

function RiskGauge({ riskScore = 0, confidence = 0.92, wardId, outbreakCategory, source = 'ml', size = 130 }) {
    const score = Math.round((riskScore <= 1 ? riskScore * 100 : riskScore));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Gauge score={score} size={size} />
            <div style={{ width: '100%' }}>
                <ConfidenceBar confidence={confidence} />
            </div>
            {/* Model attribution */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ fontSize: 9, background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', color: '#93c5fd', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                    XGBoost v1.0
                </span>
                <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                    delhi_5yr_outbreak_data.csv
                </span>
                {source === 'fallback' && (
                    <span style={{ fontSize: 9, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>
                        ⚠ rule-based fallback
                    </span>
                )}
            </div>
            {outbreakCategory && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {outbreakCategory.replace('_', ' ')}
                </span>
            )}
        </div>
    );
}

export { Gauge, ConfidenceBar };
export default memo(RiskGauge);
