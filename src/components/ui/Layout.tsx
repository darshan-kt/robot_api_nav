import React from 'react';

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-white/5 rounded-lg ${className}`} />
    );
}

export function Card({ children, className, hover = true, theme = 'emerald', onClick }: { children: React.ReactNode; className?: string; hover?: boolean; theme?: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'pink' | 'teal'; onClick?: () => void }) {
    const gradients = {
        emerald: 'from-emerald-400 to-emerald-600',
        blue: 'from-blue-400 to-blue-600',
        amber: 'from-amber-400 to-amber-600',
        rose: 'from-rose-400 to-rose-600',
        purple: 'from-purple-400 to-purple-600',
        pink: 'from-pink-400 to-pink-600',
        teal: 'from-teal-400 to-teal-600',
    };

    const borderHovers = {
        emerald: 'hover:border-emerald-400/50',
        blue: 'hover:border-blue-400/50',
        amber: 'hover:border-amber-400/50',
        rose: 'hover:border-rose-400/50',
        purple: 'hover:border-purple-400/50',
        pink: 'hover:border-pink-400/50',
        teal: 'hover:border-teal-400/50',
    };

    const shadows = {
        emerald: 'hover:shadow-[0_8px_30px_rgba(52,211,153,0.15)]',
        blue: 'hover:shadow-[0_8px_30px_rgba(96,165,250,0.15)]',
        amber: 'hover:shadow-[0_8px_30px_rgba(251,191,36,0.15)]',
        rose: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.15)]',
        purple: 'hover:shadow-[0_8px_30px_rgba(167,139,250,0.15)]',
        pink: 'hover:shadow-[0_8px_30px_rgba(244,114,182,0.15)]',
        teal: 'hover:shadow-[0_8px_30px_rgba(20,184,166,0.15)]',
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
        emerald: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
        blue: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
        amber: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
        rose: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
        purple: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
        pink: 'bg-pink-400/10 text-pink-400 border-pink-400/20',
        teal: 'bg-teal-400/10 text-teal-400 border-teal-400/20',
        muted: 'bg-white/5 text-textMuted border-border/50',
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
    type = 'button'
}: {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    icon?: any;
    type?: 'button' | 'submit';
}) {
    const variants = {
        primary: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20',
        secondary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20',
        outline: 'bg-transparent border-border hover:border-text hover:bg-white/5 text-text',
        ghost: 'bg-transparent border-transparent text-textMuted hover:text-text hover:bg-white/5',
        danger: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20',
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
            className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-xl border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
        focus:outline-none focus:ring-2 focus:ring-emerald-400/50
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
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-border/50">
                <Icon className="w-8 h-8 text-textMuted opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
            <p className="text-sm text-textMuted max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
