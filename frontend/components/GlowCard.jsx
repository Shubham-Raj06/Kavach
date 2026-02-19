export default function GlowCard({ children, className = '', style = {}, glowColor = 'rgba(132,204,22,0.18)' }) {
    return (
        <div
            className={className}
            style={{
                background: 'rgba(17,31,20,0.80)',
                border: '1px solid rgba(26,46,29,0.9)',
                borderRadius: 14,
                boxShadow: `0 0 24px ${glowColor}, 0 2px 8px rgba(0,0,0,0.4)`,
                transition: 'box-shadow 0.2s',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
