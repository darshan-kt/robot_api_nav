import { useCallback, useEffect, useState } from 'react';
import {
    applyTheme,
    onSystemThemeChange,
    readStoredTheme,
    resolveTheme,
    storeTheme,
    type ResolvedTheme,
    type Theme,
} from '../lib/theme';

/**
 * Current theme choice plus the palette it resolves to.
 *
 * The attribute is already on <html> before React mounts (index.html runs the
 * bootstrap inline), so this hook does not cause a first-paint change — it
 * adopts what is there and owns it from then on.
 */
export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
    const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()));

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        storeTheme(next);
        setResolved(applyTheme(next));
    }, []);

    // Follow the OS while — and only while — the choice is "auto".
    useEffect(() => {
        if (theme !== 'auto') return;
        return onSystemThemeChange(() => setResolved(applyTheme('auto')));
    }, [theme]);

    // Another tab changed the preference: keep windows in step.
    useEffect(() => {
        const onStorage = () => {
            const stored = readStoredTheme();
            setThemeState(stored);
            setResolved(applyTheme(stored));
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    return { theme, resolved, setTheme };
}
