import { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, ShieldAlert, Home, BatteryCharging, ArrowUp, ArrowDown, Radar, Video, VideoOff } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, Badge, Button } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';
import { localDb } from '../lib/localDb';
import { useScan } from '../hooks/useScan';
import { useVelocityCtrl } from '../hooks/useVelocityCtrl';
import { useCameraStream } from '../hooks/useCameraStream';
import { GATEWAY_URL } from '../lib/config';

export function RemoteControllerPage() {
    const { showToast } = useToast();

    // Live LIDAR stream (/api/scan WebSocket — same source as Scan Observation).
    // Off by default: building each scan frame costs the gateway an O(n)
    // pass over every beam, so it only runs while the user has this toggled
    // on ("Scan Update" button below).
    const [scanUpdateOn, setScanUpdateOn] = useState(false);
    const { connected: scanConnected, scan } = useScan(scanUpdateOn);
    const scanRef = useRef(scan);
    scanRef.current = scan;
    const lidarLive = scanConnected && scan !== null;

    // Live camera feed (WebRTC, signaled via gateway POST /webrtc/offer →
    // hive_camera_bridge). Same "off by default" convention as the LIDAR
    // scan toggle above — encoding video on the robot side costs real CPU.
    const [cameraOn, setCameraOn] = useState(false);
    const { videoRef, connected: cameraConnected, connecting: cameraConnecting } = useCameraStream(cameraOn);

    // Teleop command channel (/api/velocity_ctrl WebSocket → ROS /cmd_vel)
    const { connected: ctrlConnected, sendVelocity } = useVelocityCtrl();

    // Connection State
    const [connected, setConnected] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);
    const [robotState, setRobotState] = useState<{ x: number; y: number; theta: number; battery: number; status: string } | null>(null);

    // Driving Parameters — defaults come from the Dashboard Configuration tab
    // (max_linear_speed / max_turn_rate on the robot record), bounded 0.1–0.8 / 0.1–1.0
    const [maxLinearSpeed, setMaxLinearSpeed] = useState(0.5); // m/s
    const [maxAngularSpeed, setMaxAngularSpeed] = useState(1.0); // rad/s

    useEffect(() => {
        localDb.getRobot().then(robot => {
            if (!robot) return;
            if (typeof robot.max_linear_speed === 'number') {
                setMaxLinearSpeed(Math.min(0.8, Math.max(0.1, robot.max_linear_speed)));
            }
            if (typeof robot.max_turn_rate === 'number') {
                setMaxAngularSpeed(Math.min(1.0, Math.max(0.1, robot.max_turn_rate)));
            }
        }).catch(() => {});
    }, []);
    
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

    // Teleoperation transmit loop — 10 Hz, NOT latched:
    //   * while any input is active (non-zero velocity): stream frames
    //   * on release: send exactly ONE final all-zero frame, then go quiet
    //   * quiet while idle — nothing is sent until the user drives again
    const wasDrivingRef = useRef(false);
    useEffect(() => {
        teleopIntervalRef.current = window.setInterval(() => {
            const driving = linearVel !== 0 || angularVel !== 0;
            if (driving) {
                sendVelocity(linearVel, angularVel);
                wasDrivingRef.current = true;
            } else if (wasDrivingRef.current) {
                sendVelocity(0, 0);            // single stop frame on release
                wasDrivingRef.current = false;
            }
        }, 100);

        return () => {
            if (teleopIntervalRef.current) clearInterval(teleopIntervalRef.current);
        };
    }, [linearVel, angularVel, sendVelocity]);

    // WebSocket Telemetry Connection
    useEffect(() => {
        let ws: WebSocket;
        let pingInterval: number;
        let reconnectTimeout: number;

        const connect = () => {
            ws = new WebSocket(GATEWAY_URL.replace(/^http/, 'ws') + '/api/telemetry');
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

    // Shared key→velocity mapping (ROS conventions — REP 103, CCW-positive yaw):
    //   W → linear.x  = +MAX_LINEAR_SPEED   (forward)
    //   S → linear.x  = -MAX_LINEAR_SPEED   (reverse)
    //   A → angular.z = +MAX_TURN_RATE      (turn left)
    //   D → angular.z = -MAX_TURN_RATE      (turn right)
    // Used by BOTH the physical keyboard and the clickable on-screen keys.
    const updateVelocityFromKeys = useCallback((keys: { [key: string]: boolean }) => {
        let linear = 0;
        if (keys.w || keys.ArrowUp) linear = maxLinearSpeed;
        else if (keys.s || keys.ArrowDown) linear = -maxLinearSpeed;

        let angular = 0;
        if (keys.a || keys.ArrowLeft) angular = maxAngularSpeed;
        else if (keys.d || keys.ArrowRight) angular = -maxAngularSpeed;

        setLinearVel(linear);
        setAngularVel(angular);
    }, [maxLinearSpeed, maxAngularSpeed]);

    // Press/release a virtual or physical key
    const setKeyState = useCallback((key: string, pressed: boolean) => {
        setKeysPressed(prev => {
            const next = { ...prev, [key]: pressed };
            updateVelocityFromKeys(next);
            return next;
        });
    }, [updateVelocityFromKeys]);

    // Keyboard Driving Event Handlers
    useEffect(() => {
        const KEYS = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (KEYS.includes(e.key)) {
                if (e.key.startsWith('Arrow')) e.preventDefault();
                setKeyState(e.key, true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (KEYS.includes(e.key)) setKeyState(e.key, false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [setKeyState]);

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

        // ── Sector-based command mapping (ROS conventions, yaw CCW-positive) ──
        // Joystick angle in degrees, math convention: 0°=right, 90°=front(up),
        // 180°=left, 270°=back. Screen Y is inverted, hence -ry.
        //
        //   FRONT  (90°±10°)  → linear.x = +MAX_LINEAR   (like W)
        //   BACK   (270°±10°) → linear.x = -MAX_LINEAR   (like S — reverse)
        //   LEFT   (180°±10°) → angular.z = +MAX_TURN (rotate left in place)
        //   RIGHT  (0°±10°)   → angular.z = -MAX_TURN (rotate right in place)
        //   FRONT-RIGHT (10°–80°)   → +0.5·MAX_LINEAR, -0.5·MAX_TURN
        //   FRONT-LEFT  (100°–170°) → +0.5·MAX_LINEAR, +0.5·MAX_TURN
        //   BACK-LEFT   (190°–260°) → -0.5·MAX_LINEAR, -0.5·MAX_TURN
        //   BACK-RIGHT  (280°–350°) → -0.5·MAX_LINEAR, +0.5·MAX_TURN
        //   (reverse diagonals mirror like teleop_twist_keyboard: stick toward
        //    back-left drives the robot backward-left on screen)
        //   Deadzone: <25 % stick travel → no command
        const dist2 = Math.sqrt(rx * rx + ry * ry);
        const mag = dist2 / maxDist;

        let linear = 0;
        let angular = 0;

        if (mag >= 0.25) {
            const angDeg = ((Math.atan2(-ry, rx) * 180 / Math.PI) + 360) % 360;
            const within = (center: number, tol: number) => {
                let d = Math.abs(angDeg - center);
                if (d > 180) d = 360 - d;
                return d <= tol;
            };

            if (within(90, 10)) {                        // FRONT
                linear = maxLinearSpeed;
            } else if (within(270, 10)) {                // BACK → reverse
                linear = -maxLinearSpeed;
            } else if (within(180, 10)) {                // LEFT
                angular = maxAngularSpeed;
            } else if (within(0, 10)) {                  // RIGHT
                angular = -maxAngularSpeed;
            } else if (angDeg > 10 && angDeg < 80) {     // FRONT-RIGHT
                linear = 0.5 * maxLinearSpeed;
                angular = -0.5 * maxAngularSpeed;
            } else if (angDeg > 100 && angDeg < 170) {   // FRONT-LEFT
                linear = 0.5 * maxLinearSpeed;
                angular = 0.5 * maxAngularSpeed;
            } else if (angDeg > 190 && angDeg < 260) {   // BACK-LEFT
                linear = -0.5 * maxLinearSpeed;
                angular = -0.5 * maxAngularSpeed;
            } else {                                     // BACK-RIGHT (280°–350°)
                linear = -0.5 * maxLinearSpeed;
                angular = 0.5 * maxAngularSpeed;
            }
        }

        setLinearVel(linear);
        setAngularVel(angular);
    }, [isDragging, maxLinearSpeed, maxAngularSpeed]);

    const handleJoystickEnd = useCallback(() => {
        setIsDragging(false);
        setJoystickPos({ x: 0, y: 0 });
        setLinearVel(0);
        setAngularVel(0);
        // Send the final zero immediately (don't wait for the 10 Hz tick)
        sendVelocity(0, 0);
        wasDrivingRef.current = false;
    }, [sendVelocity]);

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

    // Live LIDAR HUD Canvas Rendering Loop — draws real /scan data.
    // Robot at centre, forward = up. ROS scan angles are CCW-positive with
    // 0 = robot forward, so: dx = -sin(a)*r, dy = -cos(a)*r.
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

            const s = scanRef.current;
            // metres → pixels: fit the lidar's max range inside the dial
            const displayMaxM = s ? Math.min(s.range_max, 5.0) : 4.0;
            const ppm = maxR / displayMaxM;

            // Background range rings with metre labels
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
            ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            ctx.lineWidth = 1;
            for (let m = 1; m <= displayMaxM; m++) {
                ctx.beginPath();
                ctx.arc(cx, cy, m * ppm, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillText(`${m}m`, cx + 3, cy - m * ppm + 10);
            }

            // Crosshair lines
            ctx.beginPath();
            ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy);
            ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR);
            ctx.stroke();

            // Sweep beam (cosmetic)
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

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Real LIDAR returns
            if (s && s.ranges.length > 0) {
                for (let i = 0; i < s.ranges.length; i++) {
                    const r = s.ranges[i];
                    if (r === null || r < s.range_min) continue;
                    const rPx = r * ppm;
                    if (rPx > maxR) continue;

                    const a = s.angle_min + i * s.angle_increment;
                    const ox = cx - Math.sin(a) * rPx;
                    const oy = cy - Math.cos(a) * rPx;

                    // Beams near the sweep line glow brighter
                    const screenAngle = Math.atan2(oy - cy, ox - cx);
                    let diff = Math.abs(screenAngle - sweepAngle) % (Math.PI * 2);
                    if (diff > Math.PI) diff = Math.PI * 2 - diff;
                    const alpha = diff < 0.5 ? 0.95 - (diff / 0.5) * 0.5 : 0.45;

                    ctx.beginPath();
                    ctx.arc(ox, oy, 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(244, 63, 94, ${alpha})`;
                    ctx.fill();
                }
            } else {
                // No data — show a hint in the dial
                ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
                ctx.font = '11px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('WAITING FOR /scan …', cx, cy + maxR / 2);
            }

            // Robot centre node
            ctx.beginPath();
            ctx.arc(cx, cy, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Forward direction indicator arrow
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
    }, []);

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
        sendVelocity(0, 0);
        setLinearVel(0);
        setAngularVel(0);
        wasDrivingRef.current = false;
    };

    const isW = keysPressed.w || keysPressed.ArrowUp;
    const isA = keysPressed.a || keysPressed.ArrowLeft;
    const isS = keysPressed.s || keysPressed.ArrowDown;
    const isD = keysPressed.d || keysPressed.ArrowRight;

    // Clickable on-screen key tile — press-and-hold drives, release stops
    const KeyTile = ({ k, active }: { k: 'w' | 'a' | 's' | 'd'; active: boolean }) => (
        <button
            onMouseDown={() => setKeyState(k, true)}
            onMouseUp={() => setKeyState(k, false)}
            onMouseLeave={() => { if (keysPressed[k]) setKeyState(k, false); }}
            onTouchStart={(e) => { e.preventDefault(); setKeyState(k, true); }}
            onTouchEnd={(e) => { e.preventDefault(); setKeyState(k, false); }}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-10 h-10 rounded-lg flex items-center justify-center border font-bold text-xs transition-all select-none cursor-pointer ${
                active
                    ? 'bg-emerald-500 text-background border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-95'
                    : 'bg-surface border-border text-textMuted hover:border-emerald-500/50 hover:text-text active:scale-95'
            }`}
        >
            {k.toUpperCase()}
        </button>
    );

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
                {/* Navigation HUD — LIDAR + Camera side by side, each its own
                    panel with independent connection state, sharing one
                    telemetry strip below (position/heading/velocity apply
                    to the robot as a whole, not to either feed alone). */}
                <div className="space-y-6 flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LIDAR panel */}
                        <Card hover={false} className="p-6 flex flex-col items-center relative overflow-hidden">
                            <div className="w-full flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-base font-bold text-text">LIDAR HUD</h2>
                                    <p className="text-[10px] font-mono text-textMuted uppercase tracking-widest">
                                        Laser Scanner
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <button
                                        onClick={() => setScanUpdateOn(v => !v)}
                                        title="Toggle live LIDAR scan updates (off by default to save robot CPU)"
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide transition-colors cursor-pointer ${
                                            scanUpdateOn
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                                : 'bg-white/5 border-border text-textMuted hover:border-purple-500/40 hover:text-purple-300'
                                        }`}
                                    >
                                        <Radar className="w-3 h-3" />
                                        {scanUpdateOn ? 'ON' : 'OFF'}
                                    </button>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
                                        lidarLive ? 'animate-pulse bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${lidarLive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        {lidarLive ? 'LIVE' : 'OFFLINE'}
                                    </div>
                                </div>
                            </div>

                            {/* Radar sweeping feed */}
                            <div className="relative w-full aspect-square rounded-full border border-emerald-500/20 bg-black/40 shadow-inner flex items-center justify-center p-2">
                                <canvas ref={radarCanvasRef} width={400} height={400} className="w-full h-full rounded-full" />
                                <div className="absolute bottom-6 left-6 font-mono text-[9px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                    {scan ? `${scan.ranges.filter(r => r !== null).length}/${scan.ranges.length} BEAMS` : 'SCAN: — '}
                                </div>
                                <div className="absolute bottom-6 right-6 font-mono text-[9px] text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                                    {scan ? `RANGE: ${scan.range_max.toFixed(1)}m` : 'RANGE: —'}
                                </div>
                            </div>
                        </Card>

                        {/* Camera panel — WebRTC feed from hive_camera_bridge.
                            Deliberately NOT forced into the LIDAR dial's
                            circle: a camera has a real rectangular field of
                            view and a radial sensor doesn't, so matching
                            shapes would just crop the picture to look
                            uniform. 4:3 frame (the model's actual 320x240
                            resolution) shown in full via object-contain —
                            an operator relying on this for situational
                            awareness needs the whole frame, not a crop. */}
                        <Card hover={false} className="p-6 flex flex-col items-center relative overflow-hidden">
                            <div className="w-full flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-base font-bold text-text">Camera Feed</h2>
                                    <p className="text-[10px] font-mono text-textMuted uppercase tracking-widest">
                                        WebRTC · /camera
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <button
                                        onClick={() => setCameraOn(v => !v)}
                                        title="Toggle the live WebRTC camera feed (off by default to save robot CPU)"
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide transition-colors cursor-pointer ${
                                            cameraOn
                                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                                                : 'bg-white/5 border-border text-textMuted hover:border-purple-500/40 hover:text-purple-300'
                                        }`}
                                    >
                                        {cameraOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                        {cameraOn ? 'ON' : 'OFF'}
                                    </button>
                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
                                        cameraConnected ? 'animate-pulse bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${cameraConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        {cameraConnected ? 'LIVE' : 'OFFLINE'}
                                    </div>
                                </div>
                            </div>

                            <div className="relative w-full aspect-square flex items-center justify-center">
                                <div className="relative w-full aspect-[4/3] rounded-xl border border-purple-500/20 bg-black shadow-inner overflow-hidden flex items-center justify-center">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className="w-full h-full object-contain"
                                    />
                                    {!cameraConnected && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
                                            <VideoOff className="w-7 h-7 text-textMuted" />
                                            <span className="font-mono text-[10px] text-textMuted uppercase tracking-widest px-4 text-center">
                                                {!cameraOn ? 'Feed Off' : cameraConnecting ? 'Negotiating…' : 'No Signal'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-3 left-3 font-mono text-[9px] text-purple-300 bg-purple-950/50 px-2.5 py-1.5 rounded-lg border border-purple-500/20">
                                        RGB · 320×240
                                    </div>
                                    <div className="absolute bottom-3 right-3 font-mono text-[9px] text-purple-300 bg-purple-950/50 px-2.5 py-1.5 rounded-lg border border-purple-500/20">
                                        WEBRTC
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Shared robot telemetry — applies to the robot as a
                        whole, not to either feed above */}
                    <Card hover={false} className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-black/30 px-4 py-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] font-mono text-textMuted uppercase">Position</span>
                                <p className="text-sm font-mono font-bold text-text mt-1">
                                    {connected && robotState
                                        ? `${robotState.x.toFixed(1)}, ${robotState.y.toFixed(1)}`
                                        : '—, —'}
                                </p>
                            </div>
                            <div className="bg-black/30 px-4 py-3 rounded-xl border border-white/5 text-center">
                                <span className="text-[10px] font-mono text-textMuted uppercase">Heading</span>
                                <p className="text-sm font-mono font-bold text-text mt-1">
                                    {connected && robotState ? `${(robotState.theta * 180 / Math.PI).toFixed(0)}°` : '—'}
                                </p>
                                {latency !== null && <Badge type="blue" className="mt-1.5">{latency} ms</Badge>}
                            </div>
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
                                    min="0.1"
                                    max="0.8"
                                    step="0.05"
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
                                    min="0.1"
                                    max="1.0"
                                    step="0.05"
                                    value={maxAngularSpeed}
                                    onChange={(e) => setMaxAngularSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-emerald-500 bg-black/40 h-1.5 rounded-lg appearance-none cursor-pointer border border-white/5"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Dual Driving Controllers (Keyboard WASD visual + Virtual Joystick) */}
                    <Card hover={false} className="p-6 flex flex-col gap-6 items-center">
                        <div className="w-full flex items-center justify-between">
                            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted">Steering Interface</h3>
                            <div className={`flex items-center gap-1.5 text-[9px] font-mono font-bold ${ctrlConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${ctrlConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                {ctrlConnected ? 'CTRL LINK' : 'CTRL OFFLINE'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[340px] md:max-w-none items-center justify-center">
                            {/* Visual WASD Keyboard */}
                            <div className="flex flex-col items-center justify-center bg-black/20 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-mono text-textMuted uppercase mb-4">Keyboard teleop</span>
                                
                                <div className="space-y-2">
                                    {/* W key — forward */}
                                    <div className="flex justify-center">
                                        <KeyTile k="w" active={isW} />
                                    </div>
                                    {/* A / S / D — left, reverse, right */}
                                    <div className="flex gap-2 justify-center">
                                        <KeyTile k="a" active={isA} />
                                        <KeyTile k="s" active={isS} />
                                        <KeyTile k="d" active={isD} />
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
