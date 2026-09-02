import { useEffect, useState, useCallback } from 'react';
import { OctagonX, ShieldAlert, KeyRound, AlertOctagon, History } from 'lucide-react';
import { localDb } from '../lib/localDb';
import { Header } from '../components/layout/Header';
import { Card, Badge, EmptyState, Skeleton } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';
import type { EmergencyStop } from '../types';

export function EmergencyStopPage() {
    const { showToast } = useToast();
    const [eStopActive, setEStopActive] = useState(false);
    const [stopHistory, setStopHistory] = useState<EmergencyStop[]>([]);
    const [loading, setLoading] = useState(true);

    const robotId = 'robot-1'; // Default local robot

    const fetchHistory = useCallback(async () => {
        try {
            const data = await localDb.getEmergencyStops();
            setStopHistory(data);
            if (data.length > 0) {
                // Use the most recent record to determine current state
                setEStopActive(!!data[0].is_active);
            } else {
                setEStopActive(false);
            }
        } catch (err: any) {
            showToast('Failed to load safety log.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Handle spacebar emergency trigger
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault(); // Prevent page scroll
                if (!eStopActive) {
                    handleTrigger(true, 'Spacebar shortcut press');
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [eStopActive]);

    const handleTrigger = async (state: boolean, reason: string) => {
        try {
            // Optimistically update UI for immediate feedback
            setEStopActive(state);
            // Persist the change to the local DB / backend
            await localDb.triggerEmergencyStop(robotId, state, reason);
            // Notify other components about the state change
            window.dispatchEvent(new CustomEvent('localdb-estop-updated', {
                detail: { robot_id: robotId, is_active: state, reason }
            }));
            // User feedback toast
            showToast(
                state ? 'Emergency Stop Engaged' : 'Emergency Stop Released',
                state ? 'error' : 'success'
            );
            // Refresh history (does not override UI state immediately)
            fetchHistory();
        } catch (err) {
            // Revert UI state if the DB call fails
            setEStopActive(!state);
            showToast('Failed to write safety registry.', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-background relative isolate flex flex-col">
            {/* Full-page flashing pulsing overlay when active */}
            {eStopActive && (
                <div className="absolute inset-0 bg-rose-950/20 border-8 border-rose-500/50 animate-pulse pointer-events-none -z-10" />
            )}

            <Header
                showBack
                title="Emergency Stop"
                icon={OctagonX}
                iconColor="text-rose-400"
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                {/* Big Button Panel */}
                <div className="flex flex-col items-center justify-center">
                    <Card hover={false} className="p-8 w-full flex-1 flex flex-col justify-center items-center relative overflow-hidden">
                        {/* Outer rotating/pulsing safety rings */}
                        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
                            <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-1000 ${eStopActive ? 'border-rose-500 animate-spin-slow' : 'border-emerald-500/30'}`} />
                            <div className={`absolute inset-6 rounded-full border border-dashed transition-all duration-1000 ${eStopActive ? 'border-rose-500/50 animate-pulse-gentle' : 'border-emerald-500/10'}`} />

                            <button
                                onClick={() => handleTrigger(!eStopActive, eStopActive ? 'Manual release sequence' : 'Console big red button click')}
                                className={`
                  w-56 h-56 rounded-full font-bold text-lg tracking-widest transition-all duration-300 shadow-2xl relative z-10 flex flex-col items-center justify-center border-4 outline-none focus:ring-4
                  ${eStopActive
                                        ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-rose-500/30 focus:ring-rose-500/50'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400/50 shadow-emerald-500/30 focus:ring-emerald-500/50'
                                    }
                `}
                            >
                                <ShieldAlert className="w-10 h-10 mb-2 animate-bounce" />
                                <span>{eStopActive ? 'STOP RELEASED' : 'STOP ENGAGED'}</span>
                                <span className="text-[10px] font-mono opacity-80 mt-1 uppercase">ESTOP SYSTEM</span>
                            </button>
                        </div>

                        <div className="text-center max-w-md">
                            <Badge type={eStopActive ? 'rose' : 'emerald'} className="mb-4">
                                {eStopActive ? 'STATE: ACTIVE STOP' : 'STATE: SYSTEM IN OPERATION'}
                            </Badge>
                            <p className="text-sm text-textMuted leading-relaxed">
                                {eStopActive
                                    ? 'The robot is currently locked in hardware shutdown. Clear this safety trigger to restore autonomous drive capability.'
                                    : 'Pressing the button above (or the Spacebar key) will broadcast an instant safety interrupt code to all active controllers.'}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Side History Panel */}
                <div className="space-y-6">
                    {/* Keyboard layout alert */}
                    <Card hover={false} className="p-6">
                        <div className="flex gap-4 items-start">
                            <KeyRound className="w-8 h-8 text-amber-400 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-text mb-1">Keyboard Override Active</h4>
                                <p className="text-xs text-textMuted leading-relaxed">
                                    Press the <kbd className="px-1.5 py-0.5 bg-white/5 border border-border rounded text-[10px] font-mono">SPACEBAR</kbd> key anywhere on this page to lock system movements instantly.
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Log History */}
                    <Card hover={false} className="p-6 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-6">
                            <History className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted">Safety Event Log</h3>
                        </div>

                        {loading ? (
                            <div className="space-y-3 flex-1">
                                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10" />)}
                            </div>
                        ) : stopHistory.length === 0 ? (
                            <EmptyState
                                icon={AlertOctagon}
                                title="No Events Recorded"
                                description="The safety registry has no reports of emergency interruptions."
                            />
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                                {stopHistory.map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${item.is_active ? 'bg-rose-950/20 border-rose-500/20' : 'bg-surface border-border/50'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full mt-1.5 ${item.is_active ? 'bg-rose-500 animate-pulse' : 'bg-textMuted'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center gap-2 mb-1">
                                                <span className="text-[10px] font-mono font-bold text-text uppercase">
                                                    {item.is_active ? 'HALT ENGAGED' : 'HALT RELEASED'}
                                                </span>
                                                <span className="text-[9px] font-mono text-textDim">
                                                    {new Date(item.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-textMuted truncate">{item.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
