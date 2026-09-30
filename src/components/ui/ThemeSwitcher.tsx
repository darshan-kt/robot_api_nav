import { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun, Droplet, Check } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { THEMES, THEME_LABELS, type Theme } from '../../lib/theme';

const ICONS: Record<Theme, typeof Monitor> = {
    dark: Moon,
    light: Sun,
    blue: Droplet,
    auto: Monitor,
};

const HINTS: Record<Theme, string> = {
    dark: 'Deep teal console',
    light: 'Bright canvas',
    blue: 'Cool navy console',
    auto: 'Match system setting',
};

/**
 * Theme picker for the header.
 *
 * A menu button rather than a segmented control: four 44px options in a row
 * would not survive the 375px header, where the title already truncates.
 * Items are menuitemradio so assistive tech announces both the options and
 * which one is active — a plain menu would say nothing about the current
 * choice.
 */
export function ThemeSwitcher() {
    const { theme, resolved, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Close on outside pointer or Escape; Escape also returns focus to the
    // trigger so keyboard users are not dropped at the top of the document.
    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('touchstart', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    // Move focus into the menu when it opens, landing on the active option.
    useEffect(() => {
        if (!open) return;
        const index = Math.max(0, THEMES.indexOf(theme));
        itemRefs.current[index]?.focus();
    }, [open, theme]);

    const onItemKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const next = (index + delta + THEMES.length) % THEMES.length;
        itemRefs.current[next]?.focus();
    };

    const TriggerIcon = ICONS[theme];

    return (
        <div ref={rootRef} className="relative shrink-0">
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={`Colour theme: ${THEME_LABELS[theme]}${theme === 'auto' ? ` (currently ${resolved})` : ''}`}
                title="Colour theme"
                className="tap-target flex items-center gap-1.5 p-2 rounded-lg text-textMuted hover:text-text hover:bg-surface transition-colors duration-base ease-standard"
            >
                <TriggerIcon className="w-5 h-5" />
                <span className="hidden xl:block text-body font-medium">{THEME_LABELS[theme]}</span>
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Colour theme"
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-lg py-1 z-50"
                >
                    {THEMES.map((option, index) => {
                        const Icon = ICONS[option];
                        const active = option === theme;
                        return (
                            <button
                                key={option}
                                ref={el => { itemRefs.current[index] = el; }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                onKeyDown={e => onItemKeyDown(e, index)}
                                onClick={() => {
                                    setTheme(option);
                                    setOpen(false);
                                    buttonRef.current?.focus();
                                }}
                                className={`w-full min-h-tap px-3 flex items-center gap-3 text-left transition-colors duration-base ease-standard ${active ? 'text-text bg-overlay/5' : 'text-textMuted hover:text-text hover:bg-overlay/5'
                                    }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-body font-medium">{THEME_LABELS[option]}</span>
                                    <span className="block text-meta text-textMuted truncate">{HINTS[option]}</span>
                                </span>
                                {active && <Check className="w-4 h-4 shrink-0 text-live" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
