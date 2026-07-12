import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowRight, OctagonX, Smartphone, Route } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, Badge, Skeleton } from '../components/ui/Layout';

export function AppStorePage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading for animations
        const timer = setTimeout(() => setLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const themeStyles: Record<string, string> = {
        emerald: 'bg-emerald-400/10 text-emerald-400',
        blue: 'bg-blue-400/10 text-blue-400',
        amber: 'bg-amber-400/10 text-amber-400',
        rose: 'bg-rose-400/10 text-rose-400',
        teal: 'bg-teal-400/10 text-teal-400',
        pink: 'bg-pink-400/10 text-pink-400',
        purple: 'bg-purple-400/10 text-purple-400'
    };

    const primaryApps = [
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: LayoutDashboard,
            theme: 'emerald' as const,
            tag: 'Core',
            description: 'Robot info, sensors, configuration & system monitoring',
            version: 'v3.1.2',
            path: '/dashboard'
        },
        {
            id: 'emergency-stop',
            title: 'Emergency Stop',
            icon: OctagonX,
            theme: 'rose' as const,
            tag: 'Safety',
            description: 'Instantly halt all robot operations with global software E-Stop',
            version: 'v1.0.0',
            path: '/emergency-stop'
        },
        {
            id: 'remote-controller',
            title: 'Remote Controller',
            icon: Smartphone,
            theme: 'purple' as const,
            tag: 'Manual',
            description: 'Manual teleop controls with keyboard steering and radar HUD',
            version: 'v1.0.0',
            path: '/remote-controller'
        },
        {
        id: 'simple-route-planner',
        title: 'Simple Route Planner',
        icon: Route,
        theme: 'amber' as const,
        tag: 'Planning',
        description: 'Design and edit robot navigation routes on a map canvas',
        version: 'v1.0.0',
        path: '/simple-route-planner'
    },
];

    return (
        <div className="min-h-screen bg-background text-text flex flex-col relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none -z-10" />

            <Header />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 relative">
                <div className="mb-12 animate-fade-up">
                    <h1 className="text-3xl md:text-4xl font-mono font-extrabold mb-3 tracking-tight bg-gradient-to-r from-emerald-400 via-purple-400 to-rose-400 bg-clip-text text-transparent uppercase">
                        My appstore
                    </h1>
                    <p className="text-sm md:text-base text-textMuted max-w-2xl leading-relaxed">
                        Deploy telemetry monitors, control manual driving operations, or engage safety systems from your centralized robot dashboard.
                    </p>
                </div>

                {/* Primary Apps Section */}
                <div className="mb-14">
                    <div className="flex items-center gap-4 mb-6 animate-fade-up">
                        <h2 className="text-md md:text-lg font-mono font-bold text-text uppercase tracking-widest">Active Applications</h2>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/30 via-emerald-500/5 to-transparent" />
                        <Badge type="emerald">CORE CONTROLS</Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-[280px] rounded-2xl" />
                            ))
                        ) : (
                            primaryApps.map((app, i) => (
                                <Card
                                    key={app.id}
                                    theme={app.theme}
                                    onClick={() => navigate(app.path)}
                                    className={`stagger-${i + 1} opacity-0 animate-fade-up flex flex-col border border-white/5 hover:border-emerald-500/20 transition-all duration-300`}
                                >
                                    <div className="p-6 md:p-8 flex-1">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${themeStyles[app.theme] || themeStyles.purple}`}>
                                            <app.icon className="w-6 h-6" />
                                        </div>

                                        <div className="flex items-center gap-3 mb-3">
                                            <h3 className="text-lg font-bold text-text">{app.title}</h3>
                                            <Badge type={app.theme}>{app.tag}</Badge>
                                        </div>

                                        <p className="text-xs md:text-sm text-textMuted leading-relaxed">
                                            {app.description}
                                        </p>
                                    </div>

                                    <div className="px-6 md:px-8 py-3 bg-black/20 border-t border-border/30 flex items-center justify-between group">
                                        <span className="text-[10px] font-mono text-textMuted">{app.version}</span>
                                        <div className="flex items-center gap-2 text-xs font-semibold group-hover:gap-3 transition-all">
                                            <span>Launch</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-8 px-4 border-t border-border/30 text-center relative">
                <p className="text-xs font-mono text-textMuted">
                    &copy; 2026 ROBOSTORE SYSTEMS · ALL RIGHTS RESERVED
                </p>
            </footer>
        </div>
    );
}
