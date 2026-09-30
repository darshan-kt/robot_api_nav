import React from 'react';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-overlay/5 rounded-lg ${className}`} />
    );
}

export function Card({ children, className, hover = true, theme = 'emerald', onClick }: { children: React.ReactNode; className?: string; hover?: boolean; theme?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'pink' | 'teal'; onClick?: () => void }) {
    // The 400->600 ramp became one hue at two alphas: a second variable per
    // hue only to darken a 3px bar is not worth the palette surface.
    const gradients = {
        emerald: 'from-hue-emerald/70 to-hue-emerald',
        blue: 'from-hue-blue/70 to-hue-blue',
        amber: 'from-hue-amber/70 to-hue-amber',
        rose: 'from-hue-rose/70 to-hue-rose',
        purple: 'from-hue-purple/70 to-hue-purple',
        pink: 'from-hue-pink/70 to-hue-pink',
        teal: 'from-hue-teal/70 to-hue-teal',
    };

    const borderHovers = {
        emerald: 'hover:border-hue-emerald/50',
        blue: 'hover:border-hue-blue/50',
        amber: 'hover:border-hue-amber/50',
        rose: 'hover:border-hue-rose/50',
        purple: 'hover:border-hue-purple/50',
        pink: 'hover:border-hue-pink/50',
        teal: 'hover:border-hue-teal/50',
    };

    const shadows = {
        emerald: 'hover:shadow-lg hover:shadow-hue-emerald/20',
        blue: 'hover:shadow-lg hover:shadow-hue-blue/20',
        amber: 'hover:shadow-lg hover:shadow-hue-amber/20',
        rose: 'hover:shadow-lg hover:shadow-hue-rose/20',
        purple: 'hover:shadow-lg hover:shadow-hue-purple/20',
        pink: 'hover:shadow-lg hover:shadow-hue-pink/20',
        teal: 'hover:shadow-lg hover:shadow-hue-teal/20',
    };

    return (
        <div
            onClick={onClick}
            className={`
      relative bg-surface border border-border/50 rounded-2xl overflow-hidden transition-all duration-300
      ${hover ? `cursor-pointer hover:-translate-y-1 ${borderHovers[theme]} ${shadows[theme]}` : ''}
      ${className}
    `}>
            {hover && <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${gradients[theme]}`} />}
            {children}
        </div>
    );
}

export function Badge({ children, type = 'emerald', className }: { children: React.ReactNode; type?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'pink' | 'teal' | 'muted'; className?: string }) {
    const styles = {
        emerald: 'bg-hue-emerald/10 text-hue-emerald border-hue-emerald/20',
        blue: 'bg-hue-blue/10 text-hue-blue border-hue-blue/20',
        amber: 'bg-hue-amber/10 text-hue-amber border-hue-amber/20',
        rose: 'bg-hue-rose/10 text-hue-rose border-hue-rose/20',
        purple: 'bg-hue-purple/10 text-hue-purple border-hue-purple/20',
        pink: 'bg-hue-pink/10 text-hue-pink border-hue-pink/20',
        teal: 'bg-hue-teal/10 text-hue-teal border-hue-teal/20',
        muted: 'bg-overlay/5 text-textMuted border-border/50',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border uppercase tracking-wider ${styles[type]} ${className}`}>
            {children}
        </span>
    );
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled,
    onClick,
    icon: Icon,
    type = 'button',
    title
}: {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    icon?: any;
    type?: 'button' | 'submit';
    title?: string;
}) {
    const variants = {
        primary: 'bg-liveStrong hover:bg-liveStrong/90 text-white border-liveStrong shadow-lg shadow-liveStrong/20',
        secondary: 'bg-info hover:bg-info/90 text-white border-info shadow-lg shadow-info/20',
        outline: 'bg-transparent border-border hover:border-text hover:bg-overlay/5 text-text',
        ghost: 'bg-transparent border-transparent text-textMuted hover:text-text hover:bg-overlay/5',
        danger: 'bg-faultStrong hover:bg-faultStrong/90 text-white border-faultStrong shadow-lg shadow-faultStrong/20',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            title={title}
            className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
        focus:outline-none focus-visible:ring-2 focus-visible:ring-focus
        ${variants[variant]} ${sizes[size]} ${className}
      `}
        >
            {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />}
            {children}
        </button>
    );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-overlay/5 flex items-center justify-center mb-4 border border-border/50">
                <Icon className="w-8 h-8 text-textMuted opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
            <p className="text-sm text-textMuted max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
