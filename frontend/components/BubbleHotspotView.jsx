'use client';
import { useState, useEffect } from 'react';
import { WARDS, getRiskLevel, RISK_COLORS } from '../lib/mockData';

// Deterministic seeded random — no hydration mismatch
function seededRand(seed) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Physics-based floating bubble layout
function useBubblePositions(wards) {
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        const cx = 50, cy = 50;
        const placed = wards.map((ward, i) => {
            const angle = (i / wards.length) * Math.PI * 2 - Math.PI / 2;
            // Spread bubbles further out to fill the card
            const radius = ward.riskScore > 70 ? 18 : ward.riskScore > 40 ? 28 : 36;
            return {
                ...ward,
                x: cx + Math.cos(angle) * radius,
                y: cy + Math.sin(angle) * radius,
                size: Math.max(56, (ward.riskScore / 100) * 150),
                animDelay: i * 0.3,
            };
        });
        // Highest risk stays in center
        const sorted = [...placed].sort((a, b) => b.riskScore - a.riskScore);
        sorted[0] = { ...sorted[0], x: cx, y: cy };
        setPositions(sorted);
    }, [wards]);

    return positions;
}

// Static scatter dots that fill empty corners
const SCATTER_DOTS = (() => {
    const rand = seededRand(42);
    const dots = [];
    const RISK_PALETTE = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    // Generate 40 small background dots spread across the whole canvas
    for (let i = 0; i < 40; i++) {
        dots.push({
            id: i,
            x: rand() * 100,
            y: rand() * 100,
            r: 3 + rand() * 6,
            color: RISK_PALETTE[Math.floor(rand() * RISK_PALETTE.length)],
            opacity: 0.12 + rand() * 0.2,
            animDelay: rand() * 4,
            animDuration: 2.5 + rand() * 3,
        });
    }
    return dots;
})();

export default function BubbleHotspotView({ onSelectWard, selectedWardId }) {
    const bubbles = useBubblePositions(WARDS);
    const [hovered, setHovered] = useState(null);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 50);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden" style={{ minHeight: 380 }}>
            {/* Background grid */}
            <div className="absolute inset-0" style={{
                backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%),
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
                backgroundSize: '100% 100%, 36px 36px, 36px 36px',
            }} />

            {/* Radar rings — 4 rings now instead of 3 */}
            {[1, 2, 3, 4].map(r => (
                <div key={r} className="absolute rounded-full border border-white/[0.04] pointer-events-none"
                    style={{
                        width: `${r * 22}%`, height: `${r * 22}%`,
                        top: `${50 - r * 11}%`, left: `${50 - r * 11}%`,
                    }}
                />
            ))}

            {/* ── Scatter dots: fill empty space ── */}
            {SCATTER_DOTS.map(d => (
                <div
                    key={d.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        left: `${d.x}%`,
                        top: `${d.y}%`,
                        width: d.r * 2,
                        height: d.r * 2,
                        transform: 'translate(-50%, -50%)',
                        background: d.color,
                        opacity: d.opacity,
                        boxShadow: `0 0 ${d.r * 2}px ${d.color}66`,
                        animation: `pulse-dot ${d.animDuration}s ${d.animDelay}s ease-in-out infinite`,
                    }}
                />
            ))}

            {/* ── Main ward bubbles ── */}
            {bubbles.map((ward, i) => {
                const level = getRiskLevel(ward.riskScore);
                const col = RISK_COLORS[level];
                const isSelected = selectedWardId === ward.wardId;
                const isHovered = hovered === ward.wardId;
                const floatY = Math.sin((tick * 0.04) + ward.animDelay * 2) * 4;
                const floatX = Math.cos((tick * 0.03) + ward.animDelay) * 2;

                return (
                    <div
                        key={ward.wardId}
                        onClick={() => onSelectWard(ward)}
                        onMouseEnter={() => setHovered(ward.wardId)}
                        onMouseLeave={() => setHovered(null)}
                        className="absolute flex flex-col items-center justify-center cursor-pointer select-none"
                        style={{
                            width: ward.size,
                            height: ward.size,
                            left: `calc(${ward.x}% - ${ward.size / 2}px)`,
                            top: `calc(${ward.y}% - ${ward.size / 2}px)`,
                            transform: `translate(${floatX}px, ${floatY}px)`,
                            transition: 'transform 0.1s linear',
                            zIndex: isSelected || isHovered ? 20 : 10,
                        }}
                    >
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                            style={{ background: col.glow, animationDuration: `${2 + i * 0.5}s` }}
                        />
                        {/* Bubble body */}
                        <div
                            className="absolute inset-0 rounded-full transition-all duration-300"
                            style={{
                                background: `radial-gradient(circle at 35% 35%, ${col.text}cc, ${col.text}44 50%, ${col.text}11)`,
                                boxShadow: `0 0 ${isSelected ? 60 : isHovered ? 40 : 20}px ${col.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                                border: `1.5px solid ${col.border}`,
                                transform: isSelected ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)',
                            }}
                        />
                        {/* Label */}
                        <div className="relative z-10 text-center pointer-events-none">
                            <div className="text-white font-bold leading-none"
                                style={{ fontSize: Math.max(11, ward.size * 0.18) }}>
                                {ward.riskScore}
                            </div>
                            <div className="text-white/80 font-medium leading-tight"
                                style={{ fontSize: Math.max(9, ward.size * 0.11) }}>
                                {ward.wardId}
                            </div>
                            {ward.size > 80 && (
                                <div className="text-white/60 leading-none"
                                    style={{ fontSize: Math.max(8, ward.size * 0.09) }}>
                                    {ward.name}
                                </div>
                            )}
                        </div>

                        {/* Tooltip */}
                        {isHovered && !isSelected && (
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30
                bg-gray-900/95 border border-white/10 rounded-xl px-3 py-2 whitespace-nowrap
                shadow-2xl backdrop-blur-sm pointer-events-none"
                                style={{ boxShadow: `0 0 20px ${col.glow}` }}
                            >
                                <div className="text-white font-semibold text-sm">{ward.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="font-bold text-sm" style={{ color: col.text }}>{ward.riskScore}%</span>
                                    <span className="text-white/50 text-xs">{level}</span>
                                    <span className="text-white/50 text-xs">·</span>
                                    <span className="text-white/50 text-xs">{ward.category.replace('_', ' ')}</span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Center label */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 text-xs tracking-widest uppercase pointer-events-none">
                Delhi Outbreak Intelligence
            </div>
        </div>
    );
}
