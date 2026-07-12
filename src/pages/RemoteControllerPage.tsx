import { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, ShieldAlert, Home, BatteryCharging, ArrowUp, ArrowDown } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, Badge, Button } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';

interface RadarObstacle {
    angle: number;  // in radians
    distance: number; // in pixels from center
    baseX: number;
    baseY: number;
    intensity: number;
}

export function RemoteControllerPage() {
    const { showToast } = useToast();
    
    // Connection State
    const [connected, setConnected] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [robotState, setRobotState] = useState<{ x: number; y: number; theta: number; battery: number; status: string } | null>(null);

    // Driving Parameters
    const [maxLinearSpeed, setMaxLinearSpeed] = useState(1.5); // m/s
    const [maxAngularSpeed, setMaxAngularSpeed] = useState(2.0); // rad/s
    
    // Active velocities
    const [linearVel, setLinearVel] = useState(0);
    const [angularVel, setAngularVel] = useState(0);

    // Keyboard states
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false
    });

    // Lift State
    const [liftLevel, setLiftLevel] = useState(0); // 0 (lowered) to 100 (fully raised)
    const [isLifting, setIsLifting] = useState<'raising' | 'lowering' | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const teleopIntervalRef = useRef<number | null>(null);
    const radarCanvasRef = useRef<HTMLCanvasElement>(null);
    const joystickContainerRef = useRef<HTMLDivElement>(null);
    const joystickKnobRef = useRef<HTMLDivElement>(null);

    // Joystick Drag State
    const [isDragging, setIsDragging] = useState(false);
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

    // Radar Obstacles state
    const obstaclesRef = useRef<RadarObstacle[]>([]);

    // Initialize random obstacles for radar HUD
    useEffect(() => {
        const list: RadarObstacle[] = [];
        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 140;
            list.push({
                angle,
                distance,
                baseX: Math.cos(angle) * distance,
                baseY: Math.sin(angle) * distance,
                intensity: 0.3 + Math.random() * 0.7
            });
        }
        obstaclesRef.current = list;
    }, []);

    // Teleoperation transmit loop (sends vel commands to FastAPI every 100ms when connected)
    const sendTeleopCommand = useCallback((linear: number, angular: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'teleop',
                linear,
                angular
            }));
        }
    }, []);

    useEffect(() => {
        // Run control loop at 10Hz
        teleopIntervalRef.current = window.setInterval(() => {
            if (connected) {
                // If keyboard or joystick driving, send the values
                sendTeleopCommand(linearVel, angularVel);
            }
        }, 100);

        return () => {
            if (teleopIntervalRef.current) clearInterval(teleopIntervalRef.current);
        };
    }, [connected, linearVel, angularVel, sendTeleopCommand]);

    // WebSocket Telemetry Connection
    useEffect(() => {
        let ws: WebSocket;
        let pingInterval: number;
        let reconnectTimeout: number;

        const connect = () => {
            ws = new WebSocket('ws://localhost:8000/api/telemetry');
            wsRef.current = ws;

            ws.onopen = () => {
                setConnected(true);
                showToast('Control bridge online. Robot connected.', 'success');
                
                // Ping connection to compute latency
                let pingTime = Date.now();
                ws.send('ping');
                pingInterval = window.setInterval(() => {
                    pingTime = Date.now();
                    if (ws.readyState === WebSocket.OPEN) ws.send('ping');
                }, 3000);

                ws.onmessage = (event) => {
                    if (event.data === 'pong') {
                        setLatency(Date.now() - pingTime);
                        return;
                    }
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'telemetry') {
                            setRobotState({
                                x: data.x ?? 0.0,
                                y: data.y ?? 0.0,
                                theta: data.theta ?? 0.0,
                                battery: 78, // default battery status
                                status: data.status || 'idle'
                            });
                        }
                    } catch (e) {
                        // ignore
                    }
                };
            };

            ws.onclose = () => {
                setConnected(false);
                setLatency(null);
                clearInterval(pingInterval);
                reconnectTimeout = window.setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connect();

        return () => {
            clearInterval(pingInterval);
            clearTimeout(reconnectTimeout);
            if (ws) ws.close();
        };
    }, [showToast]);

    // Keyboard Driving Event Handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Prevent page scrolling on arrow keys
                if (e.key.startsWith('Arrow')) e.preventDefault();

                setKeysPressed(prev => {
                    const next = { ...prev, [e.key]: true };
                    updateVelocityFromKeys(next);
                    return next;
                });
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                setKeysPressed(prev => {
                    const next = { ...prev, [e.key]: false };
                    updateVelocityFromKeys(next);
                    return next;
                });
            }
        };

        const updateVelocityFromKeys = (keys: typeof keysPressed) => {
            // Forward/backward
            let linear = 0;
            if (keys.w || keys.ArrowUp) linear = maxLinearSpeed;
            else if (keys.s || keys.ArrowDown) linear = -maxLinearSpeed;

            // Rotation
            let angular = 0;
            if (keys.a || keys.ArrowLeft) angular = maxAngularSpeed; // Turn Left
            else if (keys.d || keys.ArrowRight) angular = -maxAngularSpeed; // Turn Right

            setLinearVel(linear);
            setAngularVel(angular);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [maxLinearSpeed, maxAngularSpeed]);

    // Handle virtual joystick drag inputs
    const handleJoystickStart = () => {
        setIsDragging(true);
    };

    const handleJoystickMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !joystickContainerRef.current) return;
        const container = joystickContainerRef.current;
        const rect = container.getBoundingClientRect();
        const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };

        let clientX = 0;
        let clientY = 0;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Relative coordinates from center of pad
        let rx = clientX - center.x;
        let ry = clientY - center.y;

        const maxDist = rect.width / 2 - 20; // limit travel boundary
        const dist = Math.sqrt(rx * rx + ry * ry);

        if (dist > maxDist) {
            rx = (rx / dist) * maxDist;
            ry = (ry / dist) * maxDist;
        }

        setJoystickPos({ x: rx, y: ry });

        // Translate position to linear (Y axis) and angular (X axis) speed ratios
        // Note: Y coordinates are inverted (going up should be positive speed)
        const lRatio = -(ry / maxDist);
        const aRatio = -(rx / maxDist); // turning left is positive in ROS

        setLinearVel(lRatio * maxLinearSpeed);
        setAngularVel(aRatio * maxAngularSpeed);
    }, [isDragging, maxLinearSpeed, maxAngularSpeed]);

    const handleJoystickEnd = useCallback(() => {
        setIsDragging(false);
        setJoystickPos({ x: 0, y: 0 });
        setLinearVel(0);
        setAngularVel(0);
        // Send a final zero-velocity message immediately
        sendTeleopCommand(0, 0);
    }, [sendTeleopCommand]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleJoystickMove);
            window.addEventListener('mouseup', handleJoystickEnd);
            window.addEventListener('touchmove', handleJoystickMove, { passive: false });
            window.addEventListener('touchend', handleJoystickEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleJoystickMove);
            window.removeEventListener('mouseup', handleJoystickEnd);
            window.removeEventListener('touchmove', handleJoystickMove);
            window.removeEventListener('touchend', handleJoystickEnd);
        };
    }, [isDragging, handleJoystickMove, handleJoystickEnd]);

    // Simulated Radar HUD Canvas Rendering Loop
    useEffect(() => {
        const canvas = radarCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let sweepAngle = 0;
        let frameId = 0;

        const renderRadar = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const maxR = canvas.width / 2 - 10;

            // Background circular grid lines
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
            ctx.lineWidth = 1;
            for (let r = 50; r <= maxR; r += 50) {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Crosshair lines
            ctx.beginPath();
            ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
            ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
            ctx.stroke();

            // Dynamic updates for radar obstacles based on driving speeds (LIDAR emulation)
            const dt = 0.033; // 30fps
            obstaclesRef.current.forEach(obs => {
                // If robot is driving forward, obstacles move backward (down on screen relative to center)
                if (linearVel !== 0) {
                    obs.baseY += linearVel * dt * 50.0;
                }
                if (angularVel !== 0) {
                    const rotAngle = -angularVel * dt; // Turn opposite to robot
                    const cosA = Math.cos(rotAngle);
                    const sinA = Math.sin(rotAngle);
                    const rx = obs.baseX * cosA - obs.baseY * sinA;
                    const ry = obs.baseX * sinA + obs.baseY * cosA;
                    obs.baseX = rx;
                    obs.baseY = ry;
                }

                // Recalculate distance and angle
                obs.distance = Math.sqrt(obs.baseX * obs.baseX + obs.baseY * obs.baseY);
                obs.angle = Math.atan2(obs.baseY, obs.baseX);

                // Recycle obstacles that drift out of bounds
                if (obs.distance > maxR || obs.distance < 10) {
                    obs.angle = Math.random() * Math.PI * 2;
                    obs.distance = maxR - 5;
                    obs.baseX = Math.cos(obs.angle) * obs.distance;
                    obs.baseY = Math.sin(obs.angle) * obs.distance;
                }
            });

            // Draw Sweep Beam
            sweepAngle = (sweepAngle + 0.04) % (Math.PI * 2);
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
            grad.addColorStop(0, 'rgba(16, 185, 129, 0.05)');
            grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, maxR, sweepAngle - 0.25, sweepAngle);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fill();

            // Draw Sweep Line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw obstacle pings with decay glow
            obstaclesRef.current.forEach(obs => {
                const angleDiff = Math.abs(obs.angle - sweepAngle);
                let alpha = 0.15;
                if (angleDiff < 0.3) {
                    alpha = 0.8 - (angleDiff / 0.3) * 0.6;
                }

                const ox = cx + obs.baseX;
                const oy = cy + obs.baseY;

                ctx.beginPath();
                ctx.arc(ox, oy, 8, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(244, 63, 94, ${alpha * 0.3})`; // Rose transparent
                ctx.fill();

                ctx.beginPath();
                ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
                ctx.fill();
            });

            // Draw Robot Center Node Indicator
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Forward direction indicator arrow on center node
            ctx.beginPath();
            ctx.moveTo(cx, cy - 12);
            ctx.lineTo(cx - 5, cy - 7);
            ctx.lineTo(cx + 5, cy - 7);
            ctx.closePath();
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            frameId = requestAnimationFrame(renderRadar);
        };

        renderRadar();

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [linearVel, angularVel]);

    // Handle Lift manual operations
    const handleRaiseLift = () => {
        if (liftLevel >= 100 || isLifting) return;
        setIsLifting('raising');
        showToast('Actuator lift raising initiated...', 'info');
        
        let level = liftLevel;
        const interval = window.setInterval(() => {
            level += 5;
            if (level >= 100) {
                level = 100;
                setIsLifting(null);
                clearInterval(interval);
                showToast('Lift actuator fully extended.', 'success');
            }
            setLiftLevel(level);
        }, 150);
    };

    const handleLowerLift = () => {
        if (liftLevel <= 0 || isLifting) return;
        setIsLifting('lowering');
        showToast('Actuator lift lowering initiated...', 'info');

        let level = liftLevel;
        const interval = window.setInterval(() => {
            level -= 5;
            if (level <= 0) {
                level = 0;
                setIsLifting(null);
                clearInterval(interval);
                showToast('Lift actuator fully retracted.', 'success');
            }
            setLiftLevel(level);
        }, 150);
    };

    const triggerEStop = () => {
        showToast('EMERGENCY SOFTWARE SHUTDOWN ENGAGED.', 'error');
        sendTeleopCommand(0, 0);
        setLinearVel(0);
        setAngularVel(0);
    };

    const isW = keysPressed.w || keysPressed.ArrowUp;
    const isA = keysPressed.a || keysPressed.ArrowLeft;
    const isS = keysPressed.s || keysPressed.ArrowDown;
    const isD = keysPressed.d || keysPressed.ArrowRight;

    return (
        <div className="min-h-screen bg-background relative isolate flex flex-col">
            <Header
                showBack={true}
                backTo="/store"
                title="Remote Controller"
                icon={Smartphone}
                iconColor="text-purple-400"
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
                {/* Visual HUD Map/Lidar Panel */}
                <div className="space-y-6 flex flex-col">
                    <Card hover={false} className="p-6 flex-1 flex flex-col justify-center items-center relative overflow-hidden">
                        <div className="w-full flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-text">LIDAR Navigation HUD</h2>
                                <p className="text-[10px] font-mono text-textMuted uppercase tracking-widest">
                                    {connected && robotState 
                                        ? `X: ${robotState.x.toFixed(1)} Y: ${robotState.y.toFixed(1)} θ: ${(robotState.theta * 180 / Math.PI).toFixed(0)}°`
                                        : 'Active Laser Scanner Telemetry'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Badge type={connected ? 'emerald' : 'rose'}>
                                    {connected ? 'LINK OK' : 'BRIDGE OFFLINE'}
                                </Badge>
                                {latency !== null && (
                                    <Badge type="blue">{latency} ms</Badge>
                                )}
                            </div>
                        </div>

                        {/* Radar sweeping feed */}
                        <div className="relative w-full max-w-[420px] aspect-square rounded-full border border-emerald-500/20 bg-black/40 shadow-inner flex items-center justify-center p-2 mb-4">
                            <canvas ref={radarCanvasRef} width={400} height={400} className="w-full h-full rounded-full" />
                            <div className="absolute bottom-6 left-6 font-mono text-[9px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                SCAN: 360° AUTO
                            </div>
                            <div className="absolute bottom-6 right-6 font-mono text-[9px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                GAIN: +12dB
                            </div>
                        </div>

                        {/* Control Velocities metrics */}
                        <div className="grid grid-cols-2 gap-4 w-full max-w-[420px]">
                            <div className="bg-black/30 px-4 py-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] font-mono text-textMuted uppercase">Linear Velocity</span>
                                <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{linearVel.toFixed(2)} m/s</p>
                            </div>
                            <div className="bg-black/30 px-4 py-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] font-mono text-textMuted uppercase">Angular Velocity</span>
                                <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{angularVel.toFixed(2)} rad/s</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Control Panel (Sliders, Joystick, Keyboard, Commands) */}
                <div className="space-y-6">
                    {/* Velocity limits */}
                    <Card hover={false} className="p-6">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted mb-6">Drive Limit Controls</h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-mono mb-2">
                                    <span className="text-textMuted">MAX LINEAR SPEED</span>
                                    <span className="text-emerald-400 font-bold">{maxLinearSpeed.toFixed(1)} m/s</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.2"
                                    max="3.0"
                                    step="0.1"
                                    value={maxLinearSpeed}
                                    onChange={(e) => setMaxLinearSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-mono mb-2">
                                    <span className="text-textMuted">MAX TURN RATE</span>
                                    <span className="text-emerald-400 font-bold">{maxAngularSpeed.toFixed(1)} rad/s</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="4.0"
                                    step="0.1"
                                    value={maxAngularSpeed}
                                    onChange={(e) => setMaxAngularSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Dual Driving Controllers (Keyboard WASD visual + Virtual Joystick) */}
                    <Card hover={false} className="p-6 flex flex-col gap-6 items-center">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted w-full align-left">Steering Interface</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[340px] md:max-w-none items-center justify-center">
                            {/* Visual WASD Keyboard */}
                            <div className="flex flex-col items-center justify-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-mono text-textMuted uppercase mb-4">Keyboard teleop</span>
                                
                                <div className="space-y-2">
                                    {/* W key */}
                                    <div className="flex justify-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs transition-all ${
                                            isW ? 'bg-emerald-500 text-background border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95' : 'bg-surface border-border text-textMuted'
                                        }`}>
                                            W
                                        </div>
                                    </div>
                                    {/* ASD keys */}
                                    <div className="flex gap-2 justify-center">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs transition-all ${
                                            isA ? 'bg-emerald-500 text-background border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95' : 'bg-surface border-border text-textMuted'
                                        }`}>
                                            A
                                        </div>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs transition-all ${
                                            isS ? 'bg-emerald-500 text-background border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95' : 'bg-surface border-border text-textMuted'
                                        }`}>
                                            S
                                        </div>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs transition-all ${
                                            isD ? 'bg-emerald-500 text-background border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95' : 'bg-surface border-border text-textMuted'
                                        }`}>
                                            D
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Virtual Joystick */}
                            <div className="flex flex-col items-center justify-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-mono text-textMuted uppercase mb-4">Touch Joystick</span>
                                
                                <div
                                    ref={joystickContainerRef}
                                    onMouseDown={handleJoystickStart}
                                    onTouchStart={handleJoystickStart}
                                    className="w-32 h-32 rounded-full bg-[#1e293b]/40 border border-white/10 backdrop-blur-md relative flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
                                >
                                    {/* Inner concentric ring */}
                                    <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center" />
                                    
                                    {/* Draggable Knob */}
                                    <div
                                        ref={joystickKnobRef}
                                        style={{
                                            transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`
                                        }}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border border-emerald-300 flex items-center justify-center absolute shadow-[0_4px_15px_rgba(16,185,129,0.4)] transition-all duration-75 pointer-events-none"
                                    >
                                        <div className="w-3.5 h-3.5 rounded-full bg-white/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Actuator control & Dock buttons */}
                    <Card hover={false} className="p-6">
                        <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted mb-6">Robotic Actuators</h3>

                        <div className="space-y-4">
                            {/* Lift Slider */}
                            <div>
                                <div className="flex justify-between text-[10px] font-mono mb-2">
                                    <span className="text-textMuted">LIFT EXTENSION</span>
                                    <span className="text-purple-400 font-bold">{liftLevel}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${liftLevel}%` }} />
                                </div>
                            </div>

                            {/* Lift Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="text-xs"
                                    onClick={handleRaiseLift}
                                    disabled={liftLevel >= 100 || isLifting !== null}
                                    icon={ArrowUp}
                                >
                                    RAISE LIFT
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-xs"
                                    onClick={handleLowerLift}
                                    disabled={liftLevel <= 0 || isLifting !== null}
                                    icon={ArrowDown}
                                >
                                    LOWER LIFT
                                </Button>
                            </div>

                            <hr className="border-border/30 my-4" />

                            {/* Standard Mission Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="text-xs font-mono tracking-wider"
                                    onClick={() => showToast('Command sent: Return to Base.', 'info')}
                                    icon={Home}
                                >
                                    GO HOME
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-xs font-mono tracking-wider"
                                    onClick={() => showToast('Docking sequence initiated.', 'info')}
                                    icon={BatteryCharging}
                                >
                                    DOCK ROBOT
                                </Button>
                            </div>

                            {/* Emergency stop */}
                            <Button
                                variant="danger"
                                className="w-full mt-4 font-bold tracking-widest text-xs"
                                onClick={triggerEStop}
                                icon={ShieldAlert}
                            >
                                EMERGENCY STOP (E-STOP)
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
}
