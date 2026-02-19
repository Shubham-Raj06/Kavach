import { useEffect, useRef, memo } from 'react';
import useCommandStore from '../../store/commandStore';

// Color bands per category / risk level
function getRiskColor(riskScore, opacity = 0.35) {
    if (riskScore >= 80) return `rgba(239,68,68,${opacity})`;
    if (riskScore >= 60) return `rgba(249,115,22,${opacity})`;
    if (riskScore >= 40) return `rgba(234,179,8,${opacity})`;
    return `rgba(34,197,94,${opacity})`;
}

const BASE_RADIUS = 30;
const GROWTH_MULT = 0.85;
const CYCLE_MS = 48000; // 48s = represents 48h

function SpreadSimulation({ ward }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const startRef = useRef(null);

    useEffect(() => {
        if (!ward) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;

        const maxRadius = BASE_RADIUS + ward.riskScore * GROWTH_MULT;
        const highRisk = ward.riskScore > 75;
        const primaryColor = getRiskColor(ward.riskScore);
        const shockColor = getRiskColor(ward.riskScore, 0.18);

        function draw(ts) {
            if (!startRef.current) startRef.current = ts;
            const elapsed = (ts - startRef.current) % CYCLE_MS;
            const progress = elapsed / CYCLE_MS; // 0 → 1

            ctx.clearRect(0, 0, W, H);

            // ── Primary expanding ring ──────────────────────────────────────
            const radius = maxRadius * Math.pow(progress, 0.6);
            const alpha = 1 - progress;

            // Filled radial gradient blob
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, getRiskColor(ward.riskScore, 0.55 * alpha));
            grad.addColorStop(0.6, getRiskColor(ward.riskScore, 0.25 * alpha));
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Ring stroke
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = getRiskColor(ward.riskScore, 0.7 * alpha);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // ── Secondary shockwave (high-risk only) ───────────────────────
            if (highRisk) {
                const shockProgress = (progress + 0.4) % 1;
                const shockRadius = maxRadius * Math.pow(shockProgress, 0.55);
                const shockAlpha = (1 - shockProgress) * 0.6;
                ctx.beginPath();
                ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
                ctx.strokeStyle = getRiskColor(ward.riskScore, shockAlpha);
                ctx.lineWidth = 1.2;
                ctx.setLineDash([4, 8]);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // ── Core epicenter dot ─────────────────────────────────────────
            const dotPulse = 0.5 + 0.5 * Math.sin(ts / 400);
            const dotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10 + dotPulse * 4);
            dotGrad.addColorStop(0, getRiskColor(ward.riskScore, 0.9));
            dotGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, 10 + dotPulse * 4, 0, Math.PI * 2);
            ctx.fillStyle = dotGrad;
            ctx.fill();

            rafRef.current = requestAnimationFrame(draw);
        }

        rafRef.current = requestAnimationFrame(draw);
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startRef.current = null;
        };
    }, [ward]);

    if (!ward) return null;

    return (
        <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
            {/* Label row */}
            <div style={{
                padding: '8px 14px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                <span style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    Spread Simulation · 48h
                </span>
                <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: getRiskColor(ward.riskScore, 1).replace(/,[\d.]+\)$/, ',1)'),
                    padding: '2px 7px', borderRadius: 20,
                    background: getRiskColor(ward.riskScore, 0.15),
                    border: `1px solid ${getRiskColor(ward.riskScore, 0.4)}`,
                }}>
                    Radius: ~{Math.round(BASE_RADIUS + ward.riskScore * GROWTH_MULT * 0.4)} km
                </span>
            </div>
            <canvas
                ref={canvasRef}
                width={260} height={130}
                style={{ display: 'block', width: '100%', height: 130 }}
            />
        </div>
    );
}

export default memo(SpreadSimulation);
