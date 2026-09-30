import type { Config } from 'tailwindcss'

const config: Config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            // Every colour resolves through a CSS custom property holding a
            // bare "R G B" triple, so a theme swaps palettes by redefining the
            // variables on <html data-theme> and Tailwind's opacity modifiers
            // (bg-card/50, border-live/20) keep working. Values live in
            // src/index.css; the dark theme there is byte-identical to the
            // hexes this block used before, so the default look is unchanged.
            colors: {
                background: 'rgb(var(--c-background) / <alpha-value>)',
                surface: 'rgb(var(--c-surface) / <alpha-value>)',
                card: 'rgb(var(--c-card) / <alpha-value>)',
                border: 'rgb(var(--c-border) / <alpha-value>)',
                accent: 'rgb(var(--c-accent) / <alpha-value>)',
                info: 'rgb(var(--c-info) / <alpha-value>)',
                warning: 'rgb(var(--c-warning) / <alpha-value>)',
                danger: 'rgb(var(--c-danger) / <alpha-value>)',
                text: 'rgb(var(--c-text) / <alpha-value>)',
                textMuted: 'rgb(var(--c-text-muted) / <alpha-value>)',
                textDim: 'rgb(var(--c-text-dim) / <alpha-value>)',

                // Tints and insets. Was literal white/black at low alpha, which
                // inverts wrongly the moment the canvas goes light — this flips
                // with the theme so `bg-overlay/5` is always a subtle lift of
                // the surface beneath it.
                overlay: 'rgb(var(--c-overlay) / <alpha-value>)',

                // ── Live-state semantics ──────────────────────────────────
                // Gap: the palette above has no token for "this telemetry
                // channel is live / faulted / streaming", so pages reached
                // for raw emerald-/rose-/purple-* utilities instead (446
                // occurrences repo-wide). Values are byte-identical to the
                // Tailwind palette entries already rendering today, so
                // adopting them is a rename, not a restyle.
                live: 'rgb(var(--c-live) / <alpha-value>)',                 // link up, data flowing
                liveStrong: 'rgb(var(--c-live-strong) / <alpha-value>)',   // active/pressed affordance
                fault: 'rgb(var(--c-fault) / <alpha-value>)',              // link down, offline
                faultStrong: 'rgb(var(--c-fault-strong) / <alpha-value>)', // destructive / E-Stop
                // White on faultStrong measures 3.67:1 — under 4.5 for the
                // 14px label on the one destructive control in the console.
                // Each theme supplies the darkest step that clears 4.5:1.
                faultDeep: 'rgb(var(--c-fault-deep) / <alpha-value>)',
                stream: 'rgb(var(--c-stream) / <alpha-value>)',            // media + feed-toggle chrome
                streamStrong: 'rgb(var(--c-stream-strong) / <alpha-value>)',

                // Gap: focus was drawn in emerald-400, which sits on top of
                // emerald-filled active controls at ~1.1:1. Needs to be a hue
                // no state token uses, in every theme.
                focus: 'rgb(var(--c-focus) / <alpha-value>)',

                // A camera viewport and a radar dial are media, not page
                // surface — they stay dark in every theme so returns and video
                // stay readable, and their chrome must not follow the canvas
                // or it inverts to black-on-black. Theme-invariant by design;
                // see the media block in src/index.css.
                media: {
                    bg: 'rgb(var(--c-media-bg) / <alpha-value>)',
                    fg: 'rgb(var(--c-media-fg) / <alpha-value>)',
                    live: 'rgb(var(--c-media-live) / <alpha-value>)',
                    stream: 'rgb(var(--c-media-stream) / <alpha-value>)',
                },

                // Categorical ramp for Card/Badge, whose `theme`/`type` props
                // are public API across the app (including dynamic values like
                // `badge.type`). Keeping all seven keys means no caller
                // changes; routing them through variables means they stop
                // being invisible on a light canvas, where emerald-400 sits at
                // roughly 1.8:1.
                hue: {
                    emerald: 'rgb(var(--c-hue-emerald) / <alpha-value>)',
                    blue: 'rgb(var(--c-hue-blue) / <alpha-value>)',
                    amber: 'rgb(var(--c-hue-amber) / <alpha-value>)',
                    rose: 'rgb(var(--c-hue-rose) / <alpha-value>)',
                    purple: 'rgb(var(--c-hue-purple) / <alpha-value>)',
                    pink: 'rgb(var(--c-hue-pink) / <alpha-value>)',
                    teal: 'rgb(var(--c-hue-teal) / <alpha-value>)',
                },
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
