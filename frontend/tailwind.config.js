/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                kavach: {
                    bg: '#080f0a',
                    surface: '#0d1810',
                    surface2: '#111f14',
                    border: '#1a2e1d',
                    accent: '#84cc16',
                    'accent-dim': 'rgba(132,204,22,0.15)',
                    critical: '#ef4444',
                    high: '#f97316',
                    medium: '#eab308',
                    low: '#4ade80',
                    text: '#ecfdf5',
                    muted: '#6b8f72',
                    'muted-bright': '#a3c4a8',
                },
            },
            fontFamily: {
                sans: ['Ubuntu', 'system-ui', 'sans-serif'],
                display: ['Ubuntu', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                'glow-lime': '0 0 20px rgba(132,204,22,0.25)',
                'glow-lime-lg': '0 0 40px rgba(132,204,22,0.35)',
                'glow-green': '0 0 20px rgba(74,222,128,0.2)',
            },
            backgroundImage: {
                'green-radial': 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(132,204,22,0.10) 0%, transparent 60%)',
            },
        },
    },
    plugins: [],
};
