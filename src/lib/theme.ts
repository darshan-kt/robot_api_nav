/**
 * Theme selection for the console.
 *
 * Four choices, three palettes: "auto" is not a palette of its own — it
 * resolves to dark or light from the OS setting and keeps tracking it, so a
 * machine that flips at sunset flips the console with it.
 *
 * The chosen value is written to <html data-theme> as a RESOLVED palette
 * (never the literal "auto"), which keeps src/index.css to three simple
 * attribute selectors instead of duplicating every palette inside a
 * prefers-color-scheme block. index.html applies the same resolution inline
 * before first paint; keep the two in sync — THEME_BOOTSTRAP below is the
 * source that script is copied from.
 */
export const THEMES = ['dark', 'light', 'blue', 'auto'] as const;
export type Theme = (typeof THEMES)[number];

/** What actually lands on <html data-theme>. */
export type ResolvedTheme = Exclude<Theme, 'auto'>;

export const STORAGE_KEY = 'robostore-theme';

export const THEME_LABELS: Record<Theme, string> = {
    dark: 'Dark',
    light: 'Light',
    blue: 'Blue',
    auto: 'Auto',
};

export function isTheme(value: unknown): value is Theme {
    return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Reads the stored choice. Falls back to "auto" — matching the OS is the
 *  least surprising default for someone who has never opened the picker. */
export function readStoredTheme(): Theme {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return isTheme(raw) ? raw : 'auto';
    } catch {
        // Private mode / storage disabled — not worth failing a page render over.
        return 'auto';
    }
}

export function storeTheme(theme: Theme): void {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        /* non-fatal: the theme still applies for this session */
    }
}

export function prefersLight(): boolean {
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-color-scheme: light)').matches;
}

export function resolveTheme(theme: Theme): ResolvedTheme {
    if (theme !== 'auto') return theme;
    return prefersLight() ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): ResolvedTheme {
    const resolved = resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolved);
    return resolved;
}

/**
 * Calls back when the OS light/dark preference changes. Only meaningful
 * while the user's choice is "auto"; the caller decides whether to act.
 * Returns an unsubscribe function.
 */
export function onSystemThemeChange(cb: () => void): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => { };
    }
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    // addEventListener on MediaQueryList is unavailable on older Safari,
    // which only has the deprecated addListener.
    if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', cb);
        return () => mq.removeEventListener('change', cb);
    }
    mq.addListener(cb);
    return () => mq.removeListener(cb);
}

/**
 * The pre-paint bootstrap, kept here so it lives next to the logic it
 * mirrors. index.html inlines an equivalent snippet; if you change the
 * storage key or the resolution rule, change it there too.
 */
export const THEME_BOOTSTRAP = `(function(){try{
var t=localStorage.getItem('${STORAGE_KEY}');
if(t!=='dark'&&t!=='light'&&t!=='blue'&&t!=='auto')t='auto';
var r=t==='auto'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):t;
document.documentElement.setAttribute('data-theme',r);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
