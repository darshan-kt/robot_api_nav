import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                background: '#0a1b20',   // deep ocean teal
                surface: '#102830',
                card: '#132e38',
                border: '#2b4d58',
                accent: '#00e5a0',
                info: '#38bdf8',
                warning: '#ffb020',
                danger: '#ff4d6a',
                text: '#e8ecf4',
                textMuted: '#8892a8',
                textDim: '#5a6580',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['"DM Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

export default config
