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

                // ── Live-state semantics ──────────────────────────────────
                // Gap: the palette above has no token for "this telemetry
                // channel is live / faulted / streaming", so pages reached
                // for raw emerald-/rose-/purple-* utilities instead (446
                // occurrences repo-wide). Values are byte-identical to the
                // Tailwind palette entries already rendering today, so
                // adopting them is a rename, not a restyle.
                live: '#34d399',          // was emerald-400 — link up, data flowing
                liveStrong: '#10b981',    // was emerald-500 — active/pressed affordance
                fault: '#fb7185',         // was rose-400 — link down, offline
                faultStrong: '#f43f5e',   // was rose-500 — destructive / E-Stop
                // White on faultStrong measures 3.67:1 — under 4.5 for the
                // 14px label on the one destructive control in the console.
                // This is the darkest step that clears it (4.70:1).
                faultDeep: '#e11d48',
                stream: '#c084fc',        // was purple-400 — media + feed-toggle chrome
                streamStrong: '#a855f7',  // was purple-500

                // Gap: focus was drawn in emerald-400, which sits on top of
                // emerald-filled active controls at ~1.1:1. Needs to be a hue
                // no state token uses. sky-300 on #0a1b20 measures 11.2:1.
                focus: '#7dd3fc',
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['"DM Sans"', 'sans-serif'],
            },
            // ── Type scale ────────────────────────────────────────────────
            // Gap: the console rendered 10 distinct sizes, 211 text nodes of
            // them below 12px (172 at 10px, 18 at 9px) — under the 12px floor
            // DESIGN.md sets for its smallest caption. These four are the
            // whole ladder the console needs; 12px is the floor.
            fontSize: {
                meta: ['0.75rem', { lineHeight: '1rem' }],       // 12 — labels, badges, chips
                body: ['0.875rem', { lineHeight: '1.25rem' }],   // 14 — running text, buttons
                title: ['1rem', { lineHeight: '1.5rem' }],       // 16 — panel headings
                readout: ['1.25rem', { lineHeight: '1.75rem' }], // 20 — live numeric values
            },
            spacing: {
                // Gap: no token expressed a minimum hit area, so controls
                // shipped at 6–34px. WCAG 2.5.8 target minimum.
                tap: '2.75rem',   // 44px

                // Gap: the console's side rail and its stacked-control column
                // were written as one-off bracket widths on each page.
                rail: '25rem',    // 400px — fixed control rail beside the feeds
                stack: '21.25rem', // 340px — max width of a stacked control group
                identity: '11.25rem', // 180px — truncation cap for the account label
            },
            transitionDuration: {
                // Gap: DESIGN.md declares animation timings explicitly out of
                // scope, but the brief requires restrained 120–260ms motion.
                fast: '120ms',
                base: '180ms',
                slow: '260ms',
            },
            transitionTimingFunction: {
                standard: 'cubic-bezier(0.2, 0, 0, 1)',
            },
        },
    },
    plugins: [],
}

export default config
