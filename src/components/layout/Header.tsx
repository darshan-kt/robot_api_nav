import { useNavigate, Link } from 'react-router-dom';
import { Bot, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { localDb } from '../../lib/localDb';
import { useEffect, useState } from 'react';
import { GATEWAY_URL } from '../../lib/config';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

interface HeaderProps {
    showBack?: boolean;
    backTo?: string;
    onBack?: () => void;
    title?: string;
    icon?: any;
    iconColor?: string;
}

export function Header({ showBack, backTo = '/store', onBack, title, icon: Icon, iconColor = 'text-live' }: HeaderProps) {
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
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border/50 px-4 md:px-6 h-16 flex items-center justify-between gap-3 transition-all duration-base ease-standard">
            {/* min-w-0 lets this group shrink so the title truncates instead of
                growing into the status cluster — at 320/375 the two overlapped
                by 38x20px and 6x20px respectively. */}
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                {showBack ? (
                    <button
                        onClick={onBack ? onBack : () => navigate(backTo)}
                        className="tap-target shrink-0 p-2 -ml-2 rounded-lg text-textMuted hover:text-text hover:bg-surface transition-colors duration-base ease-standard"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <Link to="/store" className="flex items-center gap-2 md:gap-3 group shrink-0">
                        <div className="w-8 md:w-10 h-8 md:h-10 bg-liveStrong rounded-xl flex items-center justify-center shadow-lg shadow-liveStrong/20 group-hover:scale-110 transition-transform duration-base ease-standard">
                            <Bot className="w-5 md:w-6 h-5 md:h-6 text-white" />
                        </div>
                        <span className="font-mono text-lg md:text-xl font-bold tracking-tighter text-text group-hover:text-live transition-colors duration-base ease-standard hidden sm:block">ROBO<span className="text-liveStrong">STORE</span></span>
                    </Link>
                )}

                <div className="h-6 w-px bg-border/50 mx-1 md:mx-2 shrink-0" />

                <div className="flex items-center gap-2 font-semibold min-w-0">
                    {Icon && <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />}
                    {/* The page title is the document's h1. Every route except
                        /store lacked one entirely; /store passes no title, so
                        it keeps its own in-page h1 and gains no second one. */}
                    {title ? (
                        <h1 className="text-body md:text-title font-semibold truncate">{title}</h1>
                    ) : (
                        <span className="text-body md:text-title truncate">Hub</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {user ? (
                    <>
                        {/* E-Stop Indicator. whitespace-nowrap keeps this on one
                            line — wrapping grew it to 40px tall and was what
                            drove the overlap with the title at <=375px. */}
                        <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors duration-base ease-standard ${eStopActive
                                ? 'bg-faultStrong/15 border-faultStrong/50'
                                : 'bg-liveStrong/10 border-liveStrong/20'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${eStopActive ? 'bg-faultStrong animate-pulse' : 'bg-live'}`} />
                            <span className={`text-meta font-mono font-bold tracking-tight ${eStopActive ? 'text-fault' : 'text-live'}`}>
                                E-Stop: {eStopActive ? 'ACTIVE' : 'Clear'}
                            </span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            {/* Yields before the page title does: raising the
                                status chips to the 12px floor widened this
                                cluster enough to truncate the h1 at 768. */}
                            <span className="hidden lg:block text-meta font-medium text-textMuted max-w-identity truncate">{user.email}</span>
                            {/* Pulse moved off the pill and onto the dot alone:
                                an entire throbbing label is ambient noise, the
                                dot still carries the "live" affordance. */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border whitespace-nowrap text-meta font-mono font-bold tracking-wide ${
                                robotAlive
                                    ? 'bg-liveStrong/20 border-liveStrong/50 text-live'
                                    : 'bg-faultStrong/20 border-faultStrong/50 text-fault'
                            }`}>
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${robotAlive ? 'bg-live animate-pulse' : 'bg-fault'}`} />
                                {robotAlive ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                        <ThemeSwitcher />
                        <button
                            onClick={() => signOut()}
                            className="tap-target p-2 rounded-lg text-textMuted hover:text-fault hover:bg-fault/10 transition-colors duration-base ease-standard flex items-center gap-2 group shrink-0"
                            aria-label="Sign out"
                        >
                            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-base ease-standard" />
                            <span className="text-body font-medium hidden md:block">Sign Out</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="text-body font-medium hover:text-live transition-colors duration-base ease-standard">Login</Link>
                )}
            </div>
        </header>
    );
}

// NOTE: exported but currently rendered by nothing in src/. Kept (deleting is
// outside this pass's remit) and moved onto tokens so it can't reintroduce raw
// palette values if someone wires it up later. The `blue`/`amber` keys now
// resolve to the existing info/warning tokens rather than blue-400/amber-400 —
// a change of hex, but not of anything on screen, since nothing renders this.
export function StatusPill({ status, color = 'live', label }: { status: string; color?: 'live' | 'info' | 'warning' | 'fault'; label?: string }) {
    const bgColors = {
        live: 'bg-live/10',
        info: 'bg-info/10',
        warning: 'bg-warning/10',
        fault: 'bg-fault/10',
    };
    const borderColors = {
        live: 'border-live/20',
        info: 'border-info/20',
        warning: 'border-warning/20',
        fault: 'border-fault/20',
    };
    const dotColors = {
        live: 'bg-live',
        info: 'bg-info',
        warning: 'bg-warning',
        fault: 'bg-fault',
    };
    const textColors = {
        live: 'text-live',
        info: 'text-info',
        warning: 'text-warning',
        fault: 'text-fault',
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColors[color]} border ${borderColors[color]}`}>
            <div className={`w-2 h-2 rounded-full ${dotColors[color]} animate-pulse-status`} />
            <span className={`text-meta font-mono font-medium ${textColors[color]}`}>
                {label || status}
            </span>
        </div>
    );
}
