export default function SkeletonCard({ rows = 3, height = 12 }) {
    return (
        <div
            style={{
                background: 'rgba(17,31,20,0.7)',
                border: '1px solid rgba(26,46,29,0.8)',
                borderRadius: 12,
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
            }}
        >
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height,
                        borderRadius: 6,
                        background: 'rgba(132,204,22,0.08)',
                        animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
                        animationDelay: `${i * 0.15}s`,
                        width: i === rows - 1 ? '65%' : '100%',
                    }}
                />
            ))}
        </div>
    );
}
