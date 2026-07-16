import { useEffect, useState, useCallback } from 'react';
import { LayoutDashboard, Battery, Activity, Clock, CheckCircle2, Server, Edit2, Check, X, AlertTriangle } from 'lucide-react';
import { localDb } from '../lib/localDb';
import { Header } from '../components/layout/Header';
import { Card, Badge, Skeleton, Button, EmptyState } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import type { Robot, RobotSensor } from '../types';

export function DashboardPage() {
    const [activeTab, setActiveTab] = useState('Robot Info');
    const [robot, setRobot] = useState<Robot | null>(null);
    const [sensors, setSensors] = useState<RobotSensor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();
    const { user } = useAuth();

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
            console.log('Dashboard: Starting data fetch for user:', user.id);
            setLoading(true);
            setError(null);

            const rData = await localDb.getRobot();

            if (rData) {
                setRobot(rData as Robot);
                const sData = await localDb.getSensors(rData.id);
                setSensors(sData || []);
                console.log('Dashboard: Data successfully initialized');
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
    const CONFIG_KEYS = ['max_speed', 'max_linear_speed', 'max_turn_rate', 'obstacle_distance', 'navigation_mode', 'localization_method', 'path_planner', 'recovery_behavior'];

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
                        {/* Tab Content: Robot Info */}
                        {activeTab === 'Robot Info' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <MetricCard icon={Activity} label="Status" value={robot.status} theme="emerald" />
                                    <MetricCard icon={Battery} label="Battery" value={`${robot.battery_level}%`} theme="amber" />
                                    <MetricCard icon={Clock} label="Uptime" value={`${robot.uptime_hours}h`} theme="blue" />
                                    <MetricCard icon={CheckCircle2} label="Comm" value="Optimal" theme="rose" />
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

                        {/* Tab Content: Sensors */}
                        {activeTab === 'Sensors' && (
                            <div className="bg-surface border border-border/50 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                                {sensors.length === 0 ? (
                                    <EmptyState icon={Activity} title="No Sensors Detected" description="System telemetry is not reporting any active sensor modules." />
                                ) : (
                                    <div className="table-container">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-black/20 border-b border-border/50 text-textMuted font-medium">
                                                <tr>
                                                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider">Module</th>
                                                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider">Model</th>
                                                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider text-center">Status</th>
                                                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider">Frequency</th>
                                                    <th className="px-6 py-4 font-mono text-[10px] uppercase tracking-wider">Temp</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/30">
                                                {sensors.map(s => (
                                                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 text-text font-medium">{s.name}</td>
                                                        <td className="px-6 py-4 text-textMuted">{s.model}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <Badge type={s.status === 'active' ? 'emerald' : 'amber'}>
                                                                {s.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-textMuted">{s.frequency}</td>
                                                        <td className="px-6 py-4 font-mono text-textMuted">{s.temperature}°C</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab Content: Configuration */}
                        {activeTab === 'Configuration' && (
                            <div className="bg-surface border border-border/50 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
                                <div className="px-6 py-4 border-b border-border/50 bg-black/10">
                                    <h3 className="font-semibold text-text">Navigation Control Parameters</h3>
                                </div>
                                <div className="table-container">
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-border/30">
                                            {CONFIG_KEYS.map((key) => (
                                                <tr key={key} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-6 py-4 font-medium text-textMuted uppercase tracking-wider text-[10px] w-1/3 align-middle">{key.replace('_', ' ')}</td>
                                                    <td className="px-6 py-4 text-text font-mono align-middle">
                                                        {editingKey === key ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    autoFocus
                                                                    className="bg-background border border-emerald-500/30 rounded-lg px-3 py-1.5 text-text text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 w-full max-w-[240px]"
                                                                    value={editValue}
                                                                    onChange={e => setEditValue(e.target.value)}
                                                                    onKeyDown={e => e.key === 'Enter' && saveField(key)}
                                                                />
                                                                <Button size="sm" onClick={() => saveField(key)} icon={Check}>Save</Button>
                                                                <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)} icon={X}>Cancel</Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between group/row">
                                                                <span>{(robot as any)[key]}</span>
                                                                <button
                                                                    onClick={() => { setEditingKey(key); setEditValue((robot as any)[key]?.toString() || ''); }}
                                                                    className="p-1.5 rounded-md text-textMuted hover:text-emerald-400 opacity-0 group-hover/row:opacity-100 transition-all focus:opacity-100"
                                                                    aria-label={`Edit ${key}`}
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: System */}
                        {activeTab === 'System' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
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

                                <Card hover={false} className="overflow-hidden">
                                    <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-emerald-400" />
                                        <h3 className="font-semibold text-text">Environment Details</h3>
                                    </div>
                                    <div className="table-container">
                                        <table className="w-full text-left text-sm">
                                            <tbody className="divide-y divide-border/30">
                                                {[
                                                    ['OS Distribution', 'Ubuntu 22.04.3 LTS'],
                                                    ['Robot Middleware', 'ROS2 Humble Desktop'],
                                                    ['SoC Module', 'NVIDIA Jetson Orin NX'],
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

function MetricCard({ icon: Icon, label, value, theme }: { icon: any; label: string; value: string | number; theme: 'emerald' | 'amber' | 'blue' | 'rose' }) {
    const iconColors = {
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        blue: 'text-blue-400',
        rose: 'text-rose-400',
    };

    return (
        <Card hover={false} className="p-6 flex flex-col justify-between h-32 group hover:border-emerald-400/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <Icon className={`w-5 h-5 ${iconColors[theme]}`} />
                <Badge type={theme}>{label}</Badge>
            </div>
            <div className="text-2xl font-mono font-bold text-text group-hover:scale-105 origin-left transition-transform">{value}</div>
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

    return (
        <div>
            <div className="flex justify-between text-[10px] font-mono mb-2">
                <span className="text-textMuted uppercase tracking-widest">{label}</span>
                <span className="text-text font-bold">{val}%</span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 p-[1px]">
                <div
                    className={`h-full ${barColors[theme]} rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${val}%` }}
                />
            </div>
        </div>
    );
}
