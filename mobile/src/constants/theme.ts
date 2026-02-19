export const colors = {
    bg: '#0B1220',
    surface: '#111827',
    surfaceAlt: '#1a2235',
    border: 'rgba(255,255,255,0.07)',
    text: '#f1f5f9',
    textMuted: 'rgba(255,255,255,0.45)',
    textDim: 'rgba(255,255,255,0.25)',
    accent: '#3b82f6',
    accentGlow: 'rgba(59,130,246,0.3)',
    green: '#22c55e',
    greenGlow: 'rgba(34,197,94,0.3)',
    orange: '#f97316',
    orangeGlow: 'rgba(249,115,22,0.3)',
    red: '#ef4444',
    redGlow: 'rgba(239,68,68,0.3)',
    yellow: '#eab308',
    yellowGlow: 'rgba(234,179,8,0.3)',
    purple: '#a855f7',
    purpleGlow: 'rgba(168,85,247,0.3)',
};

export const risk = {
    CRITICAL: { color: colors.red, glow: colors.redGlow, label: 'CRITICAL' },
    HIGH: { color: colors.orange, glow: colors.orangeGlow, label: 'HIGH' },
    MEDIUM: { color: colors.yellow, glow: colors.yellowGlow, label: 'MEDIUM' },
    LOW: { color: colors.green, glow: colors.greenGlow, label: 'LOW' },
};

export const getRiskLevel = (score: number): keyof typeof risk => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
};

export const spacing = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
};

export const radius = {
    sm: 8, md: 12, lg: 16, xl: 20, full: 999,
};

export const font = {
    regular: { fontWeight: '400' as const },
    medium: { fontWeight: '500' as const },
    semibold: { fontWeight: '600' as const },
    bold: { fontWeight: '700' as const },
    extrabold: { fontWeight: '800' as const },
};
