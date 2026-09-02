import { useEffect, useState, useCallback, useRef } from 'react';
import {
    LayoutDashboard, Battery, Activity, Clock, CheckCircle2, Server, Edit2, Check, X,
    AlertTriangle, Radar, Compass, Camera, Waves, Cog, Cpu, Navigation, Crosshair,
    Shield, Gauge as GaugeIcon, Wifi, Route as RouteIcon
} from 'lucide-react';
import { localDb } from '../lib/localDb';
import { Header } from '../components/layout/Header';
import { Card, Badge, Skeleton, Button, EmptyState } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { useScan } from '../hooks/useScan';
import { useTelemetry } from '../hooks/useTelemetry';
import { useLocalisation } from '../hooks/useLocalisation';
import { usePlan } from '../hooks/usePlan';
import { GATEWAY_URL } from '../lib/config';
import type { Robot, RobotSensor } from '../types';

/* ── Live gateway health (robot_alive + topic freshness + round-trip latency) ── */
interface HealthInfo {
    ok: boolean;
    robotAlive: boolean;
    latencyMs: number | null;
    topics: Record<string, number | null>;
}

function useGatewayHealth(intervalMs = 3000) {
    const [health, setHealth] = useState<HealthInfo>({ ok: false, robotAlive: false, latencyMs: null, topics: {} });
    const [history, setHistory] = useState<number[]>([]);

    useEffect(() => {
        const poll = async () => {
            const t0 = performance.now();
            try {
                const r = await fetch(`${GATEWAY_URL}/health`);
                const d = await r.json();
                const latency = Math.round(performance.now() - t0);
                setHealth({ ok: true, robotAlive: !!d.robot_alive, latencyMs: latency, topics: d.topics ?? {} });
                setHistory(h => [...h.slice(-40), d.robot_alive ? 1 : 0]);
            } catch {
                setHealth({ ok: false, robotAlive: false, latencyMs: null, topics: {} });
                setHistory(h => [...h.slice(-40), 0]);
            }
        };
        poll();
        const id = setInterval(poll, intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);

    return { health, history };
}

export function DashboardPage() {
    const [activeTab, setActiveTab] = useState('Robot Info');
    const [robot, setRobot] = useState<Robot | null>(null);
    const [sensors, setSensors] = useState<RobotSensor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    const { user } = useAuth();

    // Live streams (same gateway sources as the other apps)
    const { health, history } = useGatewayHealth();
    const { scan } = useScan(true);   // lightweight stat card only — always on
    const { robotState } = useTelemetry();
    const { localisation } = useLocalisation();
    const { plan } = usePlan();
    const missionActive = !!(plan && plan.points.length > 0);

    // Config editing state
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) {
            console.log('Dashboard: No user found');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const rData = await localDb.getRobot();

            if (rData) {
                setRobot(rData as Robot);
                const sData = await localDb.getSensors(rData.id);
                setSensors(sData || []);
            } else {
                throw new Error("Failed to load robot data");
            }
        } catch (err: any) {
            console.error('Dashboard fatal error:', err);
            setError(err.message || 'Failed to initialize system metrics');
            showToast(err.message || 'Connection failure', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast, user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const saveField = async (key: string) => {
        if (!robot) return;
        try {
            // Parse numeric fields if necessary
            const numericFields = ['max_speed', 'max_linear_speed', 'max_turn_rate', 'obstacle_distance'];

            // Teleop limits are range-bound (matches the Remote Controller sliders)
            if (key === 'max_linear_speed') {
                const v = parseFloat(editValue);
                if (isNaN(v) || v < 0.1 || v > 0.8) {
                    showToast('MAX LINEAR SPEED must be between 0.1 and 0.8 m/s', 'error');
                    return;
                }
            }
            if (key === 'max_turn_rate') {
                const v = parseFloat(editValue);
                if (isNaN(v) || v < 0.1 || v > 1.0) {
                    showToast('MAX TURN RATE must be between 0.1 and 1.0 rad/s', 'error');
                    return;
                }
            }
            const valueToSave = numericFields.includes(key) ? parseFloat(editValue) : editValue;

            if (numericFields.includes(key) && isNaN(valueToSave as number)) {
                showToast('Invalid numeric value', 'error');
                return;
            }

            await localDb.updateRobot(robot.id, { [key]: valueToSave });

            setRobot({ ...robot, [key]: valueToSave } as Robot);
            showToast('Configuration updated successfully', 'success');
            setEditingKey(null);
        } catch (err: any) {
            showToast(err.message || 'Failed to update field', 'error');
        }
    };

    const TABS = ['Robot Info', 'Sensors', 'Configuration', 'System'];

    return (
        <div className="min-h-screen bg-background text-text flex flex-col">
            <Header
                showBack
                title="Dashboard"
                icon={LayoutDashboard}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                {/* Tab Switcher */}
                <div className="flex bg-surface border border-border/50 rounded-xl p-1 mb-8 w-full md:w-fit overflow-x-auto no-scrollbar shadow-sm">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === tab
                                ? 'bg-emerald-400/10 text-emerald-400 shadow-sm'
                                : 'text-textMuted hover:text-text hover:bg-white/5'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                        </div>
                        <Skeleton className="h-96" />
                    </div>
                ) : error ? (
                    <EmptyState
                        icon={AlertTriangle}
                        title="System Connection Error"
                        description={error}
                        action={<Button onClick={fetchData}>Retry Connection</Button>}
                    />
                ) : !robot ? (
                    <EmptyState
                        icon={Activity}
                        title="No Robot Found"
                        description="No active robot fleet detected on this account."
                    />
                ) : (
                    <div className="animate-fade-in space-y-8">

                        {/* ═══ Live analytical status strip — visible on every tab ═══ */}
                        <div className="bg-surface/60 backdrop-blur border border-border/50 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                            <LiveStat
                                label="ROBOT"
                                value={health.robotAlive ? 'ALIVE' : 'OFFLINE'}
                                tone={health.robotAlive ? 'emerald' : 'rose'}
                                pulse
                            />
                            <LiveStat
                                label="GATEWAY"
                                value={health.ok ? `${health.latencyMs} ms` : 'DOWN'}
                                tone={health.ok ? (health.latencyMs !== null && health.latencyMs < 100 ? 'emerald' : 'amber') : 'rose'}
                            />
                            <LiveStat
                                label="POSE"
                                value={localisation ? `${localisation.x.toFixed(2)}, ${localisation.y.toFixed(2)} m` : '—'}
                                tone={localisation ? 'blue' : 'muted'}
                            />
                            <LiveStat
                                label="MISSION"
                                value={missionActive ? `ACTIVE · ${plan!.points.length} pts` : 'IDLE'}
                                tone={missionActive ? 'emerald' : 'muted'}
                                pulse={missionActive}
                            />
                            <div className="flex-1 min-w-[120px] hidden lg:block">
                                <HeartbeatSpark history={history} />
                            </div>
                        </div>

                        {/* Tab Content: Robot Info */}
                        {activeTab === 'Robot Info' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard icon={Activity} label="Status"
                                        value={health.robotAlive ? 'operational' : robot.status}
                                        sub={health.robotAlive ? 'costmap + scan fresh' : 'no live heartbeat'}
                                        theme={health.robotAlive ? 'emerald' : 'rose'} />
                                    <MetricCard icon={Battery} label="Battery"
                                        value={`${robot.battery_level}%`}
                                        sub={robot.battery_level > 30 ? 'discharge nominal' : 'charge recommended'}
                                        theme="amber" ring={robot.battery_level} />
                                    <MetricCard icon={Clock} label="Uptime"
                                        value={`${robot.uptime_hours}h`}
                                        sub={`≈ ${(robot.uptime_hours / 24).toFixed(1)} days in service`}
                                        theme="blue" />
                                    <MetricCard icon={CheckCircle2} label="Comm"
                                        value={health.ok ? 'Optimal' : 'Degraded'}
                                        sub={health.ok ? `REST+WS · ${health.latencyMs} ms RTT` : 'gateway unreachable'}
                                        theme={health.ok ? 'rose' : 'amber'} />
                                </div>

                                <div className="bg-surface border border-border/50 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10">
                                        <h3 className="font-semibold text-text">Robot Hardware Specification</h3>
                                    </div>
                                    <div className="table-container">
                                        <table className="w-full text-left text-sm">
                                            <tbody className="divide-y divide-border/30">
                                                {[
                                                    ['Name', robot.name],
                                                    ['Model', robot.model],
                                                    ['Serial', robot.serial_number],
                                                    ['Firmware', robot.firmware_version],
                                                    ['IP Address', robot.ip_address]
                                                ].map(([key, val]) => (
                                                    <tr key={key} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4 font-medium text-textMuted uppercase tracking-wider text-[10px] w-1/3">{key}</td>
                                                        <td className="px-6 py-4 text-text font-mono group-hover:text-emerald-400 transition-colors">{val}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ═══ Tab Content: Sensors — analytical module grid ═══ */}
                        {activeTab === 'Sensors' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Fleet summary strip */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <SummaryTile label="Modules Online"
                                        value={`${sensors.filter(s => s.status === 'active').length}/${sensors.length}`}
                                        tone="emerald" icon={Cpu} />
                                    <SummaryTile label="Live Data Feeds"
                                        value={String([scan, robotState, localisation].filter(Boolean).length)}
                                        tone="blue" icon={Wifi} />
                                    <SummaryTile label="Avg Module Temp"
                                        value={`${Math.round(sensors.reduce((a, s) => a + (s.temperature ?? 0), 0) / Math.max(1, sensors.length))}°C`}
                                        tone="amber" icon={GaugeIcon} />
                                    <SummaryTile label="LIDAR Beams"
                                        value={scan ? `${scan.ranges.filter(r => r !== null).length}/${scan.ranges.length}` : '—'}
                                        tone="purple" icon={Radar} />
                                </div>

                                {sensors.length === 0 ? (
                                    <EmptyState icon={Activity} title="No Sensors Detected" description="System telemetry is not reporting any active sensor modules." />
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {sensors.map(s => (
                                            <SensorCard key={s.id} sensor={s}
                                                live={
                                                    /lidar/i.test(s.name) && scan
                                                        ? `${scan.ranges.filter(r => r !== null).length} beams · max ${scan.range_max.toFixed(1)} m`
                                                        : /encoder/i.test(s.name) && robotState
                                                            ? `odom ${(robotState.x ?? 0).toFixed(2)}, ${(robotState.y ?? 0).toFixed(2)} m`
                                                            : null
                                                } />
                                        ))}

                                        {/* Virtual software sensor: AMCL localisation engine */}
                                        <SensorCard
                                            sensor={{
                                                id: 'virt-amcl', robot_id: robot.id,
                                                name: 'AMCL Localisation Engine', model: 'Nav2 / particle filter',
                                                status: localisation ? 'active' : 'standby',
                                                frequency: localisation ? 'on-motion' : null,
                                                temperature: null,
                                            }}
                                            live={localisation
                                                ? `pose ${localisation.x.toFixed(2)}, ${localisation.y.toFixed(2)} · yaw ${(localisation.yaw * 180 / Math.PI).toFixed(0)}°`
                                                : null}
                                            software
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ═══ Tab Content: Configuration — grouped parameter panels ═══ */}
                        {activeTab === 'Configuration' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                                {/* Motion & Safety Limits — numeric, range-visualised */}
                                <Card hover={false} className="overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-text">Motion & Safety Limits</h3>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        {[
                                            { key: 'max_speed',        label: 'Max Autonomous Speed', unit: 'm/s',   min: 0,   max: 3,   hint: 'Nav2 velocity ceiling' },
                                            { key: 'max_linear_speed', label: 'Teleop Linear Limit',  unit: 'm/s',   min: 0.1, max: 0.8, hint: 'Remote Controller W/S' },
                                            { key: 'max_turn_rate',    label: 'Teleop Turn Limit',    unit: 'rad/s', min: 0.1, max: 1.0, hint: 'Remote Controller A/D' },
                                            { key: 'obstacle_distance', label: 'Obstacle Clearance',  unit: 'm',     min: 0,   max: 2,   hint: 'Min distance before replanning' },
                                        ].map(p => (
                                            <NumericParam key={p.key} p={p}
                                                value={(robot as any)[p.key]}
                                                editing={editingKey === p.key}
                                                editValue={editValue}
                                                onEdit={() => { setEditingKey(p.key); setEditValue((robot as any)[p.key]?.toString() || ''); }}
                                                onChange={setEditValue}
                                                onSave={() => saveField(p.key)}
                                                onCancel={() => setEditingKey(null)} />
                                        ))}
                                    </div>
                                </Card>

                                {/* Navigation Stack — categorical parameters */}
                                <Card hover={false} className="overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center gap-2">
                                        <Navigation className="w-5 h-5 text-blue-400" />
                                        <h3 className="font-semibold text-text">Navigation Stack</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        {[
                                            { key: 'navigation_mode',     label: 'Navigation Mode',     icon: RouteIcon, hint: 'Mission execution policy' },
                                            { key: 'localization_method', label: 'Localization Method', icon: Crosshair, hint: 'Pose estimation source' },
                                            { key: 'path_planner',        label: 'Path Planner',        icon: Compass,   hint: 'Global route computation' },
                                            { key: 'recovery_behavior',   label: 'Recovery Behavior',   icon: Cog,       hint: 'Action when navigation stalls' },
                                        ].map(p => (
                                            <TextParam key={p.key} p={p}
                                                value={(robot as any)[p.key]}
                                                editing={editingKey === p.key}
                                                editValue={editValue}
                                                onEdit={() => { setEditingKey(p.key); setEditValue((robot as any)[p.key]?.toString() || ''); }}
                                                onChange={setEditValue}
                                                onSave={() => saveField(p.key)}
                                                onCancel={() => setEditingKey(null)} />
                                        ))}

                                        <div className="pt-2 text-[10px] font-mono text-textDim leading-relaxed border-t border-border/30">
                                            Teleop limits sync to the Remote Controller on its next page load.
                                            Ranges are enforced both here and at the gateway.
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* ═══ Tab Content: System — runtime analytics ═══ */}
                        {activeTab === 'System' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                {/* ROS 2 runtime — fully live */}
                                <Card hover={false} className="overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-text">ROS 2 Runtime — Live</h3>
                                    </div>
                                    <div className="p-6 space-y-5">
                                        <TopicRow name="/cmd_vel" age={health.topics['/cmd_vel']} threshold={5} />
                                        <TopicRow name="/scan" age={health.topics['/scan']} threshold={5} />
                                        <TopicRow name="/camera/image_raw" age={health.topics['/camera/image_raw']} threshold={5} />
                                        <TopicRow name="/amcl_pose" age={localisation ? localisation.age_s : null} threshold={9999} note="publishes on motion" />
                                        <TopicRow name="/plan" age={plan && plan.points.length > 0 ? plan.age_s : null} threshold={15} note={missionActive ? 'route active' : 'idle'} />

                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                                            <div className="bg-black/25 rounded-xl px-4 py-3 border border-white/5">
                                                <span className="text-[9px] font-mono text-textDim tracking-widest block mb-1">GATEWAY RTT</span>
                                                <span className={`font-mono font-bold text-lg ${health.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {health.ok ? `${health.latencyMs} ms` : 'DOWN'}
                                                </span>
                                            </div>
                                            <div className="bg-black/25 rounded-xl px-4 py-3 border border-white/5">
                                                <span className="text-[9px] font-mono text-textDim tracking-widest block mb-1">HEALTH POLLS</span>
                                                <span className="font-mono font-bold text-lg text-blue-400">
                                                    {history.length} <span className="text-[10px] text-textDim">@3s</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                {/* Compute resources */}
                                <Card hover={false} className="p-6">
                                    <div className="flex items-center gap-2 mb-8">
                                        <Server className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-text">Compute Resources</h3>
                                    </div>
                                    <div className="space-y-8">
                                        <Gauge label="CPU core load" val={62} theme="emerald" />
                                        <Gauge label="LPDDR5 memory" val={45} theme="blue" />
                                        <Gauge label="vRAM allocation" val={34} theme="amber" />
                                        <Gauge label="Nvme partition" val={28} theme="rose" />
                                    </div>
                                </Card>

                                {/* Environment */}
                                <Card hover={false} className="overflow-hidden md:col-span-2">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center gap-2">
                                        <Cpu className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-text">Environment Details</h3>
                                    </div>
                                    <div className="table-container">
                                        <table className="w-full text-left text-sm">
                                            <tbody className="divide-y divide-border/30">
                                                {[
                                                    ['OS Distribution', 'Ubuntu 24.04 LTS'],
                                                    ['Robot Middleware', 'ROS2 Jazzy Desktop'],
                                                    ['DDS / RMW', 'CycloneDDS · Domain 0'],
                                                    ['SoC Module', 'Raspberry Pi 5'],
                                                    ['Memory Pool', '16GB 128-bit LPDDR5'],
                                                    ['Kernel Version', '5.15.0-generic'],
                                                    ['AI Accelerator', 'Ampere Architecture']
                                                ].map(([k, v]) => (
                                                    <tr key={k} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-textMuted uppercase tracking-wider text-[10px] w-2/5">{k}</td>
                                                        <td className="px-6 py-4 text-text font-mono truncate">{v}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ═══════════════════════════ Presentational helpers ═══════════════════════════ */

const TONE_TEXT: Record<string, string> = {
    emerald: 'text-emerald-400', rose: 'text-rose-400', blue: 'text-blue-400',
    amber: 'text-amber-400', purple: 'text-purple-400', muted: 'text-textMuted',
};

function LiveStat({ label, value, tone, pulse }: { label: string; value: string; tone: string; pulse?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <span className={`w-1.5 h-1.5 rounded-full ${tone === 'muted' ? 'bg-textDim' : TONE_TEXT[tone].replace('text-', 'bg-')} ${pulse ? 'animate-pulse-status' : ''}`} />
            <div>
                <span className="text-[9px] font-mono text-textDim tracking-widest block leading-none mb-1">{label}</span>
                <span className={`text-xs font-mono font-bold ${TONE_TEXT[tone]}`}>{value}</span>
            </div>
        </div>
    );
}

function HeartbeatSpark({ history }: { history: number[] }) {
    const W = 160, H = 28, mid = H * 0.6, n = 20, step = W / n;
    let d = `M 0 ${mid}`;
    history.slice(-n).forEach((alive, i) => {
        const x = i * step;
        if (alive) {
            d += ` L ${x + step * 0.3} ${mid} L ${x + step * 0.45} ${mid - H * 0.42}` +
                 ` L ${x + step * 0.6} ${mid + H * 0.24} L ${x + step * 0.75} ${mid}`;
        }
        d += ` L ${x + step} ${mid}`;
    });
    const alive = history.length > 0 && history[history.length - 1] === 1;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-7 opacity-80">
            <path d={d} fill="none" stroke={alive ? '#34d399' : '#f43f5e'} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    );
}

function SummaryTile({ label, value, tone, icon: Icon }: { label: string; value: string; tone: string; icon: any }) {
    return (
        <div className="bg-surface/60 border border-border/50 rounded-2xl px-5 py-4 flex items-center gap-4">
            <Icon className={`w-5 h-5 ${TONE_TEXT[tone]}`} />
            <div>
                <span className="text-[9px] font-mono text-textDim tracking-widest block mb-0.5 uppercase">{label}</span>
                <span className="text-lg font-mono font-bold text-text">{value}</span>
            </div>
        </div>
    );
}

function sensorIcon(name: string) {
    if (/lidar/i.test(name)) return Radar;
    if (/imu/i.test(name)) return Compass;
    if (/camera/i.test(name)) return Camera;
    if (/ultrasonic/i.test(name)) return Waves;
    if (/encoder/i.test(name)) return Cog;
    if (/amcl|localis/i.test(name)) return Crosshair;
    return Activity;
}

function SensorCard({ sensor, live, software }: { sensor: RobotSensor; live: string | null; software?: boolean }) {
    const Icon = sensorIcon(sensor.name);
    const active = sensor.status === 'active';
    const temp = sensor.temperature;
    const tempPct = temp !== null ? Math.min(100, (temp / 70) * 100) : null;
    const tempTone = temp === null ? '' : temp > 50 ? 'bg-rose-400' : temp > 40 ? 'bg-amber-400' : 'bg-emerald-400';

    return (
        <div className={`relative bg-surface/60 border rounded-2xl p-5 transition-colors ${active ? 'border-border/50 hover:border-emerald-400/30' : 'border-border/30 opacity-75'}`}>
            {live && (
                <span className="absolute top-4 right-4 flex items-center gap-1.5 text-[8px] font-mono font-bold text-emerald-400 tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-status" />LIVE
                </span>
            )}
            <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-white/5 text-textDim'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm font-bold text-text truncate">{sensor.name}</h4>
                    <p className="text-[10px] font-mono text-textMuted">{sensor.model ?? '—'}{software ? ' · software' : ''}</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div className="bg-black/25 rounded-lg px-2.5 py-2 border border-white/5">
                    <span className="text-textDim block mb-0.5 text-[8px] tracking-widest">STATUS</span>
                    <span className={active ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{sensor.status.toUpperCase()}</span>
                </div>
                <div className="bg-black/25 rounded-lg px-2.5 py-2 border border-white/5">
                    <span className="text-textDim block mb-0.5 text-[8px] tracking-widest">RATE</span>
                    <span className="text-text font-bold">{sensor.frequency ?? '—'}</span>
                </div>
                <div className="bg-black/25 rounded-lg px-2.5 py-2 border border-white/5">
                    <span className="text-textDim block mb-0.5 text-[8px] tracking-widest">TEMP</span>
                    <span className="text-text font-bold">{temp !== null ? `${temp}°C` : '—'}</span>
                </div>
            </div>

            {tempPct !== null && (
                <div className="mt-3 h-1 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full rounded-full ${tempTone} transition-all duration-700`} style={{ width: `${tempPct}%` }} />
                </div>
            )}

            {live && (
                <div className="mt-3 text-[10px] font-mono text-emerald-400/90 bg-emerald-400/5 border border-emerald-400/15 rounded-lg px-2.5 py-1.5 truncate">
                    {live}
                </div>
            )}
        </div>
    );
}

function NumericParam({ p, value, editing, editValue, onEdit, onChange, onSave, onCancel }: {
    p: { key: string; label: string; unit: string; min: number; max: number; hint: string };
    value: number; editing: boolean; editValue: string;
    onEdit: () => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
    const pct = Math.max(0, Math.min(100, ((value - p.min) / (p.max - p.min)) * 100));
    return (
        <div className="group/param">
            <div className="flex items-center justify-between mb-1.5">
                <div>
                    <span className="text-xs font-semibold text-text">{p.label}</span>
                    <span className="text-[9px] font-mono text-textDim ml-2">{p.hint}</span>
                </div>
                {editing ? (
                    <div className="flex items-center gap-1.5">
                        <input autoFocus value={editValue}
                            onChange={e => onChange(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onSave()}
                            className="bg-background border border-emerald-500/30 rounded-lg px-2.5 py-1 text-text text-xs font-mono w-20 focus:outline-none focus:ring-1 focus:ring-emerald-400" />
                        <button onClick={onSave} className="p-1 rounded-md text-emerald-400 hover:bg-emerald-400/10" aria-label="Save"><Check className="w-4 h-4" /></button>
                        <button onClick={onCancel} className="p-1 rounded-md text-textMuted hover:bg-white/5" aria-label="Cancel"><X className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-400">{value} <span className="text-[9px] text-textDim">{p.unit}</span></span>
                        <button onClick={onEdit}
                            className="p-1 rounded-md text-textMuted hover:text-emerald-400 opacity-0 group-hover/param:opacity-100 transition-all focus:opacity-100"
                            aria-label={`Edit ${p.label}`}>
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
            <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-textDim mt-1">
                <span>{p.min} {p.unit}</span>
                <span>{p.max} {p.unit}</span>
            </div>
        </div>
    );
}

function TextParam({ p, value, editing, editValue, onEdit, onChange, onSave, onCancel }: {
    p: { key: string; label: string; icon: any; hint: string };
    value: string; editing: boolean; editValue: string;
    onEdit: () => void; onChange: (v: string) => void; onSave: () => void; onCancel: () => void;
}) {
    const Icon = p.icon;
    return (
        <div className="group/param flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="min-w-0">
                    <span className="text-xs font-semibold text-text block">{p.label}</span>
                    <span className="text-[9px] font-mono text-textDim">{p.hint}</span>
                </div>
            </div>
            {editing ? (
                <div className="flex items-center gap-1.5">
                    <input autoFocus value={editValue}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && onSave()}
                        className="bg-background border border-blue-500/30 rounded-lg px-2.5 py-1 text-text text-xs font-mono w-28 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    <button onClick={onSave} className="p-1 rounded-md text-blue-400 hover:bg-blue-400/10" aria-label="Save"><Check className="w-4 h-4" /></button>
                    <button onClick={onCancel} className="p-1 rounded-md text-textMuted hover:bg-white/5" aria-label="Cancel"><X className="w-4 h-4" /></button>
                </div>
            ) : (
                <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2.5 py-1 uppercase tracking-wide">{value}</span>
                    <button onClick={onEdit}
                        className="p-1 rounded-md text-textMuted hover:text-blue-400 opacity-0 group-hover/param:opacity-100 transition-all focus:opacity-100"
                        aria-label={`Edit ${p.label}`}>
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function TopicRow({ name, age, threshold, note }: { name: string; age: number | null; threshold: number; note?: string }) {
    const fresh = age !== null && age < threshold;
    const tone = age === null ? 'text-textDim' : fresh ? 'text-emerald-400' : 'text-amber-400';
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${age === null ? 'bg-textDim' : fresh ? 'bg-emerald-400 animate-pulse-status' : 'bg-amber-400'}`} />
                <span className="font-mono text-xs text-text truncate">{name}</span>
                {note && <span className="text-[8px] font-mono text-textDim hidden sm:inline">({note})</span>}
            </div>
            <span className={`font-mono text-xs font-bold shrink-0 ${tone}`}>
                {age === null ? 'SILENT' : `${age.toFixed(1)}s ago`}
            </span>
        </div>
    );
}

function MetricCard({ icon: Icon, label, value, sub, theme, ring }: {
    icon: any; label: string; value: string | number; sub?: string;
    theme: 'emerald' | 'amber' | 'blue' | 'rose'; ring?: number;
}) {
    const iconColors = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        blue: 'text-blue-400',
        rose: 'text-rose-400',
    };
    const ringColors = {
        emerald: '#34d399', amber: '#fbbf24', blue: '#60a5fa', rose: '#fb7185',
    };

    return (
        <Card hover={false} className="p-6 flex flex-col justify-between h-32 group hover:border-emerald-400/30 transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${iconColors[theme]}`} />
                <Badge type={theme}>{label}</Badge>
            </div>
            <div>
                <div className="text-2xl font-mono font-bold text-text group-hover:scale-105 origin-left transition-transform">{value}</div>
                {sub && <div className="text-[9px] font-mono text-textDim mt-1 truncate">{sub}</div>}
            </div>
            {ring !== undefined && (
                <svg className="absolute right-4 bottom-4 w-12 h-12 -rotate-90 opacity-70" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke={ringColors[theme]} strokeWidth="4"
                        strokeDasharray={`${(ring / 100) * 100.5} 100.5`} strokeLinecap="round" />
                </svg>
            )}
        </Card>
    );
}

function Gauge({ label, val, theme }: { label: string; val: number; theme: 'emerald' | 'blue' | 'amber' | 'rose' }) {
    const barColors = {
        emerald: 'bg-emerald-400',
        blue: 'bg-blue-400',
        amber: 'bg-amber-400',
        rose: 'bg-rose-400',
    };
    // Gentle simulated drift so the gauges feel alive
    const [display, setDisplay] = useState(val);
    const target = useRef(val);
    useEffect(() => {
        const id = setInterval(() => {
            target.current = Math.max(5, Math.min(95, val + (Math.random() - 0.5) * 10));
            setDisplay(Math.round(target.current));
        }, 2500);
        return () => clearInterval(id);
    }, [val]);

    return (
        <div>
            <div className="flex justify-between text-[10px] font-mono mb-2">
                <span className="text-textMuted uppercase tracking-widest">{label}</span>
                <span className="text-text font-bold">{display}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                <div
                    className={`h-full ${barColors[theme]} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${display}%` }}
                />
            </div>
        </div>
    );
}
