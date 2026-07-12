import { useNavigate, Link } from 'react-router-dom';
import { Bot, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { localDb } from '../../lib/localDb';
import { useEffect, useState } from 'react';
import { GATEWAY_URL } from '../../lib/config';

interface HeaderProps {
    showBack?: boolean;
    backTo?: string;
    onBack?: () => void;
    title?: string;
    icon?: any;
    iconColor?: string;
}

export function Header({ showBack, backTo = '/store', onBack, title, icon: Icon, iconColor = 'text-emerald-400' }: HeaderProps) {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [eStopActive, setEStopActive] = useState(false);
    const [robotAlive, setRobotAlive] = useState(false);

    useEffect(() => {
        const poll = () => {
            fetch(`${GATEWAY_URL}/health`)
                .then(r => r.json())
                .then(d => setRobotAlive(d.robot_alive ?? false))
                .catch(() => setRobotAlive(false));
        };
        poll();
        const id = setInterval(poll, 5000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchEStop = async () => {
            const data = await localDb.getEmergencyStops();
            const userEstop = data.find(e => e.user_id === user.id);
            if (userEstop) setEStopActive(userEstop.is_active);
        };

        fetchEStop();

        const handleEStopUpdate = (e: CustomEvent) => {
            if (e.detail?.user_id === user.id && typeof e.detail?.is_active === 'boolean') {
                setEStopActive(e.detail.is_active);
            }
        };

        window.addEventListener('localdb-estop-updated', handleEStopUpdate as EventListener);

        return () => {
            window.removeEventListener('localdb-estop-updated', handleEStopUpdate as EventListener);
        };
    }, [user]);

    return (
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 md:px-6 h-16 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                {showBack ? (
                    <button
                        onClick={onBack ? onBack : () => navigate(backTo)}
                        className="p-2 -ml-2 rounded-lg text-textMuted hover:text-text hover:bg-surface transition-colors focus:ring-2 focus:ring-emerald-400/50"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <Link to="/store" className="flex items-center gap-2 md:gap-3 group">
                        <div className="w-8 md:w-10 h-8 md:h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Bot className="w-5 md:w-6 h-5 md:h-6 text-white" />
                        </div>
                        <span className="font-mono text-lg md:text-xl font-bold tracking-tighter text-text group-hover:text-emerald-400 transition-colors hidden sm:block">ROBO<span className="text-emerald-500">STORE</span></span>
                    </Link>
                )}

                <div className="h-6 w-px bg-border/50 mx-1 md:mx-2" />

                <div className="flex items-center gap-2 font-semibold">
                    {Icon && <Icon className={`w-5 h-5 ${iconColor}`} />}
                    <span className="text-sm md:text-base whitespace-nowrap">{title || 'Hub'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                {user ? (
                    <>
                        {/* E-Stop Indicator */}
                        <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${eStopActive
                                ? 'bg-rose-500/15 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                                : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${eStopActive ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
                            <span className={`text-[10px] md:text-[11px] font-mono font-bold tracking-tight ${eStopActive ? 'text-rose-400' : 'text-emerald-400'}`}>
                                E-Stop: {eStopActive ? 'ACTIVE' : 'Clear'}
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <span className="text-xs font-medium text-textMuted max-w-[120px] md:max-w-[180px] truncate">{user.email}</span>
                            <div className={`animate-pulse flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
                                robotAlive
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                    : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${robotAlive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                {robotAlive ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 rounded-lg text-textMuted hover:text-rose-400 hover:bg-rose-400/10 transition-all flex items-center gap-2 group"
                            aria-label="Sign out"
                        >
                            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-medium hidden md:block">Sign Out</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="text-sm font-medium hover:text-emerald-400 transition-colors">Login</Link>
                )}
            </div>
        </header>
    );
}

export function StatusPill({ status, color = 'emerald', label }: { status: string; color?: 'emerald' | 'blue' | 'amber' | 'rose'; label?: string }) {
    const bgColors = {
        emerald: 'bg-emerald-400/10',
        blue: 'bg-blue-400/10',
        amber: 'bg-amber-400/10',
        rose: 'bg-rose-400/10',
    };
    const borderColors = {
        emerald: 'border-emerald-400/20',
        blue: 'border-blue-400/20',
        amber: 'border-amber-400/20',
        rose: 'border-rose-400/20',
    };
    const dotColors = {
        emerald: 'bg-emerald-400',
        blue: 'bg-blue-400',
        amber: 'bg-amber-400',
        rose: 'bg-rose-400',
    };
    const textColors = {
        emerald: 'text-emerald-400',
        blue: 'text-blue-400',
        amber: 'text-amber-400',
        rose: 'text-rose-400',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColors[color]} border ${borderColors[color]}`}>
            <div className={`w-2 h-2 rounded-full ${dotColors[color]} animate-pulse-status`} />
            <span className={`text-xs font-mono font-medium ${textColors[color]}`}>
                {label || status}
            </span>
        </div>
    );
}
