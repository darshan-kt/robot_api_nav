import { useState, useEffect, useRef, useCallback } from 'react';
import { Route, Target, Send, CheckCircle2, Upload, RotateCcw, Radar, Navigation, XCircle, LocateFixed } from 'lucide-react';
import { localDb } from '../lib/localDb';
import { Header } from '../components/layout/Header';
import { Card, Skeleton, Button } from '../components/ui/Layout';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import type { MapData, Waypoint } from '../types';
import { useTelemetry } from '../hooks/useTelemetry';
import { useScan } from '../hooks/useScan';
import { useLocalisation } from '../hooks/useLocalisation';
import { usePlan } from '../hooks/usePlan';
import { parsePgmToDataUrl } from '../lib/pgmParser';
import { GATEWAY_URL } from '../lib/config';

export function SimpleRoutePlannerPage() {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { connected, robotState } = useTelemetry();
    // Off by default: building each scan frame costs the gateway an O(n)
    // pass over every beam, so it only runs while toggled on below.
    // Two independent toggles share one WS subscription — scanUpdateOn
    // drives the sidebar polar plot, scanOnMapOn drives the on-map overlay
    // below, either one live is enough to turn the underlying stream on.
    const [scanUpdateOn, setScanUpdateOn] = useState(false);
    const [scanOnMapOn, setScanOnMapOn] = useState(false);
    const { connected: scanConnected, scan } = useScan(scanUpdateOn || scanOnMapOn);
    const { localisation } = useLocalisation();
    const { plan } = usePlan();
    const scanCanvasRef = useRef<HTMLCanvasElement>(null);

    // Draw polar scan plot whenever scan data updates
    useEffect(() => {
        if (!scan || !scanCanvasRef.current) return;
        const canvas = scanCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const cx = W / 2;
        const cy = H / 2;
        const maxR = scan.range_max || 12;
        const scale = (Math.min(W, H) / 2 - 4) / maxR;

        ctx.clearRect(0, 0, W, H);

        // Background
        ctx.fillStyle = '#0a0f1a';
        ctx.fillRect(0, 0, W, H);

        // Grid rings
        [0.25, 0.5, 0.75, 1.0].forEach(f => {
            ctx.beginPath();
            ctx.arc(cx, cy, f * maxR * scale, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Cross hairs
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(0, cy); ctx.lineTo(W, cy);
        ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
        ctx.stroke();

        // Scan points
        scan.ranges.forEach((r, i) => {
            if (r === null || r < scan.range_min || r > scan.range_max) return;
            const angle = scan.angle_min + i * scan.angle_increment;
            const px = cx + Math.cos(angle) * r * scale;
            const py = cy - Math.sin(angle) * r * scale;
            ctx.fillStyle = 'rgba(168,85,247,0.85)';
            ctx.fillRect(px - 1, py - 1, 2, 2);
        });

        // Robot dot
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
    }, [scan]);

    // Map States
    const [maps, setMaps] = useState<MapData[]>([]);
    const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
    const [loading, setLoading] = useState(true);

    // Canvas & Waypoint States
    const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
    const [drawMode, setDrawMode] = useState(false);
    const [missionId, setMissionId] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
const [isUploading, setIsUploading] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);
    // Direct Nav2 "Send Goal" — separate loading/success state from the
    // Hive mission dispatch above, since it's an independent action.
    const [isSendingGoal, setIsSendingGoal] = useState(false);
    const [goalSentSuccess, setGoalSentSuccess] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSettingPose, setIsSettingPose] = useState(false);
    const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
    const [mapMeta, setMapMeta] = useState({ resolution: 0.05, origin_x: -10.0, origin_y: -10.0 });
    const [pendingWaypoint, setPendingWaypoint] = useState<{ x: number, y: number } | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const robotMapLoadedRef = useRef(false);

    // Emergency Stop state
    const [eStopActive, setEStopActive] = useState(false);


    useEffect(() => {
        if (!user) return;
        const fetchEStop = async () => {
            const data = await localDb.getEmergencyStops();
            const userEstop = data.find(e => e.user_id === user.id);
            if (userEstop) setEStopActive(userEstop.is_active);
        };
        fetchEStop();
        const handleEStopUpdate = (e: Event) => {
            const custom = e as CustomEvent;
            if (custom.detail?.user_id === user.id && typeof custom.detail?.is_active === 'boolean') {
                setEStopActive(custom.detail.is_active);
            }
        };
        window.addEventListener('localdb-estop-updated', handleEStopUpdate as EventListener);
        return () => window.removeEventListener('localdb-estop-updated', handleEStopUpdate as EventListener);
    }, [user]);

    // Load map.pgm from public/ on mount — no gateway or robot connection required
    useEffect(() => {
        fetch('/map.pgm')
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.arrayBuffer();
            })
            .then(buf => parsePgmToDataUrl(buf))
            .then(dataUrl => {
                robotMapLoadedRef.current = true;
                const img = new Image();
                img.src = dataUrl;
                img.onload = () => setMapImage(img);
            })
            .catch(err => console.warn('[map] Failed to load /map.pgm:', err));

        // Fetch map metadata for coordinate conversion
        fetch(`${GATEWAY_URL}/api/map/meta`)
            .then(r => r.json())
            .then(m => setMapMeta({ resolution: m.resolution, origin_x: m.origin_x, origin_y: m.origin_y }))
            .catch(() => {}); // keep default [-10, -10] / 0.05 from map.yaml
    }, []);

    const fetchAndInitializeMaps = useCallback(async () => {
        try {
            setLoading(true);
            let data = await localDb.getMaps();
            let publishedMaps = data.filter(m => ['published', 'complete'].includes(m.status));

            // Seed default warehouse map if no published maps exist
            if (publishedMaps.length === 0 && user) {
                const defaultMapSeed: MapData = {
                    id: 'default-warehouse-map',
                    user_id: user.id,
                    name: 'Warehouse Floor A',
                    description: 'Pre-processed factory & warehouse environment model',
                    status: 'published',
                    source: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="%230f172a"/><path d="M 50 50 L 850 50 L 850 550 L 50 550 Z" fill="none" stroke="%23334155" stroke-width="4"/><circle cx="450" cy="300" r="50" fill="%231e293b" stroke="%23475569" stroke-width="2"/><rect x="200" y="150" width="80" height="80" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="8"/><rect x="620" y="150" width="80" height="80" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="8"/><rect x="200" y="370" width="80" height="80" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="8"/><rect x="620" y="370" width="80" height="80" fill="%231e293b" stroke="%23475569" stroke-width="2" rx="8"/><line x1="50" y1="300" x2="250" y2="300" stroke="%23334155" stroke-width="4"/><line x1="650" y1="300" x2="850" y2="300" stroke="%23334155" stroke-width="4"/></svg>',
                    resolution: 0.05,
                    width: 900,
                    height: 600,
                    map_data: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                const saved = await localDb.saveMap(defaultMapSeed);
                publishedMaps = [saved];
            }

            setMaps(publishedMaps);
            if (publishedMaps.length > 0) {
                handleSelectMap(publishedMaps[0]);
            }
        } catch (err: any) {
            showToast(err.message || 'Error indexing spatial maps', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, showToast]);

    useEffect(() => {
        if (user) {
            fetchAndInitializeMaps();
        }
    }, [user, fetchAndInitializeMaps]);

    // Handle map selection/switching
    const handleSelectMap = async (map: MapData) => {
        if (!user) return;
        try {
            setSelectedMap(map);
            setWaypoints([]);
            setPendingWaypoint(null);
            setDrawMode(false);

            const newMission = await localDb.saveMission({
                map_id: map.id,
                name: `${map.name} Strategy`,
                status: 'draft',
                waypoints: [],
                user_id: user.id
            });

            if (newMission) setMissionId(newMission.id);
            showToast(`Loaded map context: ${map.name}`, 'info');
        } catch (err: any) {
            showToast(err.message || 'Map loading failed', 'error');
        }
    };

    // Load Map Image
    useEffect(() => {
        // If map.pgm already loaded from public/, don't let the dummy map override it
        if (robotMapLoadedRef.current) return;

        if (!selectedMap) {
            setMapImage(null);
            return;
        }

        if (selectedMap.source) {
            const img = new Image();
            img.src = selectedMap.source;
            img.onload = () => {
                // Only apply if PGM hasn't loaded yet (race-condition guard)
                if (!robotMapLoadedRef.current) setMapImage(img);
            };
            img.onerror = () => {
                console.error('Failed to load map image:', selectedMap.source);
            };
        } else {
            setMapImage(null);
        }
    }, [selectedMap, showToast]);

    // Canvas Rendering Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Map Image
            if (mapImage) {
                const scale = Math.min(canvas.width / mapImage.width, canvas.height / mapImage.height);
                const x = (canvas.width / 2) - (mapImage.width / 2) * scale;
                const y = (canvas.height / 2) - (mapImage.height / 2) * scale;
                ctx.drawImage(mapImage, x, y, mapImage.width * scale, mapImage.height * scale);
            }

            // Grid overlay
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.03)';
            ctx.lineWidth = 1;
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
            }

            // Nav2 global planner path (/plan) — the robot's REAL planned trajectory.
            // Waypoints are intentionally NOT connected to each other; only the
            // planner's computed path is drawn.
            if (plan && plan.points.length > 1 && mapImage) {
                const scale = Math.min(canvas.width / mapImage.width, canvas.height / mapImage.height);
                const drawX = (canvas.width / 2) - (mapImage.width / 2) * scale;
                const drawY = (canvas.height / 2) - (mapImage.height / 2) * scale;

                const toCanvas = (p: { x: number; y: number }) => ({
                    cx: drawX + ((p.x - mapMeta.origin_x) / mapMeta.resolution) * scale,
                    cy: drawY + ((mapImage.height - 1) - (p.y - mapMeta.origin_y) / mapMeta.resolution) * scale,
                });

                ctx.beginPath();
                const first = toCanvas(plan.points[0]);
                ctx.moveTo(first.cx, first.cy);
                for (let i = 1; i < plan.points.length; i++) {
                    const pt = toCanvas(plan.points[i]);
                    ctx.lineTo(pt.cx, pt.cy);
                }
                // Glow pass
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';   // emerald glow
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                // Core pass — animated dashes flowing toward the goal
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.95)';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([10, 8]);
                ctx.lineDashOffset = -((Date.now() / 40) % 18);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.lineDashOffset = 0;
            }

            // Draw Waypoint nodes
            waypoints.forEach((wp) => {
                // Halo
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 16, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Direction Arrow
                if (wp.theta !== undefined) {
                    const arrowLen = 28;
                    const arrowX = wp.x + Math.cos(wp.theta) * arrowLen;
                    const arrowY = wp.y + Math.sin(wp.theta) * arrowLen;

                    ctx.beginPath();
                    ctx.moveTo(wp.x, wp.y);
                    ctx.lineTo(arrowX, arrowY);
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Arrowhead
                    ctx.beginPath();
                    ctx.moveTo(arrowX + 6 * Math.cos(wp.theta), arrowY + 6 * Math.sin(wp.theta));
                    ctx.lineTo(arrowX - 8 * Math.cos(wp.theta - Math.PI / 6), arrowY - 8 * Math.sin(wp.theta - Math.PI / 6));
                    ctx.lineTo(arrowX - 8 * Math.cos(wp.theta + Math.PI / 6), arrowY - 8 * Math.sin(wp.theta + Math.PI / 6));
                    ctx.closePath();
                    ctx.fillStyle = '#fbbf24';
                    ctx.fill();
                }

                // Core
                ctx.beginPath();
                ctx.arc(wp.x, wp.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();

                // Order Label
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(wp.order.toString(), wp.x, wp.y);
            });

            // Live Robot telemetries
            if (robotState && typeof robotState.x === 'number' && typeof robotState.y === 'number') {
                const rx = robotState.x;
                const ry = robotState.y;
                const rtheta = robotState.theta ?? 0.0;

                // Pulsing Ring
                const pulseRadius = 14 + Math.sin(Date.now() / 150) * 3;
                ctx.beginPath();
                ctx.arc(rx, ry, pulseRadius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(167, 139, 250, 0.15)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Main body
                ctx.beginPath();
                ctx.arc(rx, ry, 10, 0, Math.PI * 2);
                ctx.fillStyle = '#a78bfa';
                ctx.fill();
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Heading arrow
                const rArrowLen = 22;
                const rArrowX = rx + Math.cos(rtheta) * rArrowLen;
                const rArrowY = ry + Math.sin(rtheta) * rArrowLen;

                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rArrowX, rArrowY);
                ctx.strokeStyle = '#a78bfa';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(rArrowX + 5 * Math.cos(rtheta), rArrowY + 5 * Math.sin(rtheta));
                ctx.lineTo(rArrowX - 7 * Math.cos(rtheta - Math.PI / 6), rArrowY - 7 * Math.sin(rtheta - Math.PI / 6));
                ctx.lineTo(rArrowX - 7 * Math.cos(rtheta + Math.PI / 6), rArrowY - 7 * Math.sin(rtheta + Math.PI / 6));
                ctx.closePath();
                ctx.fillStyle = '#a78bfa';
                ctx.fill();

                // Center core
                ctx.beginPath();
                ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }

            // Live LIDAR scan, projected onto the map — anchored to the SAME
            // AMCL pose (localisation.x/y/yaw) that drives the marker below,
            // through the SAME map-frame→image-pixel→canvas-pixel formula
            // used for waypoints/plan/AMCL position. That's deliberate: reusing
            // one pipeline end to end is what keeps scan, AMCL marker, and map
            // aligned — a second, slightly-different conversion here would drift.
            if (scanOnMapOn && scan && localisation && mapImage) {
                const scale = Math.min(canvas.width / mapImage.width, canvas.height / mapImage.height);
                const drawX = (canvas.width / 2) - (mapImage.width / 2) * scale;
                const drawY = (canvas.height / 2) - (mapImage.height / 2) * scale;

                const robotMapX = localisation.x;
                const robotMapY = localisation.y;
                const yaw = localisation.yaw;      // raw ROS yaw (CCW-positive, Y-up) — NOT
                                                    // the canvas-negated one the heading arrow
                                                    // uses below; the rotation here happens in
                                                    // map-metre space, before the Y-flip that
                                                    // the pixel conversion applies.
                const cosYaw = Math.cos(yaw);
                const sinYaw = Math.sin(yaw);

                ctx.fillStyle = 'rgba(244, 63, 94, 0.8)';   // rose — obstacle/scan convention
                                                             // shared with the Remote Controller HUD
                for (let i = 0; i < scan.ranges.length; i++) {
                    const r = scan.ranges[i];
                    if (r === null || r < scan.range_min || r > scan.range_max) continue;

                    // Beam → robot-local metres (ROS convention: x=forward, y=left)
                    const beamAngle = scan.angle_min + i * scan.angle_increment;
                    const localX = r * Math.cos(beamAngle);
                    const localY = r * Math.sin(beamAngle);

                    // Rotate into the map frame by the robot's AMCL heading, then translate
                    const mapX = robotMapX + (localX * cosYaw - localY * sinYaw);
                    const mapY = robotMapY + (localX * sinYaw + localY * cosYaw);

                    // map-frame metres → image pixel → canvas pixel (identical to
                    // the AMCL marker and waypoint-send conversions)
                    const imgX = (mapX - mapMeta.origin_x) / mapMeta.resolution;
                    const imgY = (mapImage.height - 1) - (mapY - mapMeta.origin_y) / mapMeta.resolution;
                    const px = drawX + imgX * scale;
                    const py = drawY + imgY * scale;

                    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
                }
            }

            // AMCL localisation — GPS-style blinking position marker
            if (localisation && mapImage) {
                // map frame (metres) → image pixels → canvas pixels
                const scale = Math.min(canvas.width / mapImage.width, canvas.height / mapImage.height);
                const drawX = (canvas.width / 2) - (mapImage.width / 2) * scale;
                const drawY = (canvas.height / 2) - (mapImage.height / 2) * scale;

                const imgX = (localisation.x - mapMeta.origin_x) / mapMeta.resolution;
                const imgY = (mapImage.height - 1) - (localisation.y - mapMeta.origin_y) / mapMeta.resolution;
                const gx = drawX + imgX * scale;
                const gy = drawY + imgY * scale;
                const gTheta = -localisation.yaw;   // canvas Y is flipped vs map frame

                const t = Date.now();

                // Expanding sonar ripple (two rings, phase-shifted) — the "GPS blink"
                for (const phase of [0, 0.5]) {
                    const p = ((t / 1500 + phase) % 1);        // 0 → 1 every 1.5 s
                    const rippleR = 8 + p * 30;
                    const rippleA = 0.45 * (1 - p);
                    ctx.beginPath();
                    ctx.arc(gx, gy, rippleR, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(59, 130, 246, ${rippleA})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Accuracy halo
                ctx.beginPath();
                ctx.arc(gx, gy, 18, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
                ctx.fill();

                // Heading beam (Google-Maps-style wedge)
                ctx.beginPath();
                ctx.moveTo(gx, gy);
                ctx.arc(gx, gy, 24, gTheta - Math.PI / 7, gTheta + Math.PI / 7);
                ctx.closePath();
                const beam = ctx.createRadialGradient(gx, gy, 4, gx, gy, 24);
                beam.addColorStop(0, 'rgba(96, 165, 250, 0.55)');
                beam.addColorStop(1, 'rgba(96, 165, 250, 0)');
                ctx.fillStyle = beam;
                ctx.fill();

                // Core dot — blue with white ring, pulsing slightly
                const coreR = 6 + Math.sin(t / 300) * 0.8;
                ctx.beginPath();
                ctx.arc(gx, gy, coreR + 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(gx, gy, coreR, 0, Math.PI * 2);
                ctx.fillStyle = '#3b82f6';
                ctx.fill();
            }

            // Pending placement node preview
            if (pendingWaypoint && mousePos) {
                const x = pendingWaypoint.x;
                const y = pendingWaypoint.y;
                const theta = Math.atan2(mousePos.y - pendingWaypoint.y, mousePos.x - pendingWaypoint.x);

                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                ctx.stroke();

                const arrowLen = 28;
                const arrowX = x + Math.cos(theta) * arrowLen;
                const arrowY = y + Math.sin(theta) * arrowLen;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(arrowX, arrowY);
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(arrowX + 6 * Math.cos(theta), arrowY + 6 * Math.sin(theta));
                ctx.lineTo(arrowX - 8 * Math.cos(theta - Math.PI / 6), arrowY - 8 * Math.sin(theta - Math.PI / 6));
                ctx.lineTo(arrowX - 8 * Math.cos(theta + Math.PI / 6), arrowY - 8 * Math.sin(theta + Math.PI / 6));
                ctx.closePath();
                ctx.fillStyle = '#fbbf24';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#fbbf24';
                ctx.fill();

                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((waypoints.length + 1).toString(), x, y);
            }
        };

        let frameId = requestAnimationFrame(function loop() {
            draw();
            frameId = requestAnimationFrame(loop);
        });
        return () => cancelAnimationFrame(frameId);
    }, [waypoints, mapImage, pendingWaypoint, mousePos, robotState, localisation, plan, mapMeta, scan, scanOnMapOn]);

    // Handle telemetry complete mission states
    useEffect(() => {
        if (robotState && robotState.type === 'status' && robotState.status === 'completed' && missionId) {
            localDb.updateMissionStatus(missionId, 'completed');
            showToast('Navigation mission completed successfully.', 'success');
        }
    }, [robotState, missionId, showToast]);

    // File upload handler (mirrors RoutePlanner implementation)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        try {
            setIsUploading(true);
            const isPgm = file.name.toLowerCase().endsWith('.pgm');
            const reader = new FileReader();
            if (isPgm) {
                reader.readAsArrayBuffer(file);
            } else {
                reader.readAsDataURL(file);
            }
            reader.onload = async () => {
                try {
                    let base64Data = '';
                    if (isPgm) {
                        const buffer = reader.result as ArrayBuffer;
                        base64Data = await parsePgmToDataUrl(buffer);
                    } else {
                        base64Data = reader.result as string;
                    }
                    const newMap = await localDb.saveMap({
                        name: file.name,
                        status: 'published',
                        source: base64Data,
                        user_id: user.id,
                        description: 'User uploaded map',
                        resolution: 0.05,
                        width: 900,
                        height: 600,
                        map_data: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    } as any);
                    if (newMap) handleSelectMap(newMap as MapData);
                } catch (dbErr: any) {
                    showToast(dbErr.message || 'Map upload failed', 'error');
                } finally {
                    setIsUploading(false);
                }
            };
            reader.onerror = () => {
                showToast('Failed to read map file', 'error');
                setIsUploading(false);
            };
        } catch (err: any) {
            showToast(err.message || 'Upload error', 'error');
            setIsUploading(false);
        }
    };
    const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawMode) return;
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (!rect || !canvas) return;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        if (!pendingWaypoint) {
            setPendingWaypoint({ x, y });
        } else {
            const theta = Math.atan2(y - pendingWaypoint.y, x - pendingWaypoint.x);
            const newWp: Waypoint = {
                x: pendingWaypoint.x,
                y: pendingWaypoint.y,
                theta,
                order: waypoints.length + 1,
                label: `WP-${waypoints.length + 1}`
            };
            const updated = [...waypoints, newWp];
            setWaypoints(updated);
            setPendingWaypoint(null);

            if (missionId) {
                await localDb.saveMission({ id: missionId, waypoints: updated });
            }
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!drawMode || !pendingWaypoint) return;
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();
        if (!rect || !canvas) return;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        setMousePos({ x, y });
    };

    const removeWaypoint = async (idxToRemove: number) => {
        const updated = waypoints.filter((_, idx) => idx !== idxToRemove).map((wp, idx) => ({
            ...wp,
            order: idx + 1,
            label: `WP-${idx + 1}`
        }));
        setWaypoints(updated);
        if (missionId) {
            await localDb.saveMission({ id: missionId, waypoints: updated });
        }
    };

    const clearAll = async () => {
        setWaypoints([]);
        setPendingWaypoint(null);
        setSentSuccess(false);
        if (missionId) {
            await localDb.saveMission({ id: missionId, waypoints: [] });
        }
    };

    // Canvas-pixel waypoint → ROS map-frame PoseStamped-shaped dict. Shared
    // by sendMission (all waypoints, via Hive/BT) and sendGoal (one
    // waypoint, direct to Nav2) so both paths convert coordinates
    // identically — the map image is drawn centred on the 900×600 canvas,
    // scaled to fit, same as every other pixel→map conversion on this page.
    const waypointToPose = (wp: Waypoint) => {
        const canvas  = canvasRef.current;
        const imgEl   = mapImage;
        const imgW    = imgEl?.width  ?? 384;
        const imgH    = imgEl?.height ?? 384;
        const canvasW = canvas?.width  ?? 900;
        const canvasH = canvas?.height ?? 600;
        const scale   = Math.min(canvasW / imgW, canvasH / imgH);
        const drawX   = (canvasW - imgW * scale) / 2;
        const drawY   = (canvasH - imgH * scale) / 2;

        const imgX  = (wp.x - drawX) / scale;
        const imgY  = (wp.y - drawY) / scale;
        const mapX  = mapMeta.origin_x + imgX * mapMeta.resolution;
        // Y axis is flipped: row 0 = top of image = maximum map Y
        const mapY  = mapMeta.origin_y + (imgH - 1 - imgY) * mapMeta.resolution;
        // Canvas theta uses Y-down convention; ROS uses Y-up → negate
        const theta = -(wp.theta ?? 0);
        const sinH  = Math.sin(theta / 2);
        const cosH  = Math.cos(theta / 2);
        console.log(`[wp ${wp.order}] canvas(${wp.x.toFixed(1)},${wp.y.toFixed(1)}) → img(${imgX.toFixed(1)},${imgY.toFixed(1)}) → map(${mapX.toFixed(3)},${mapY.toFixed(3)}) θ=${(theta*180/Math.PI).toFixed(1)}°`);
        return {
            header: { frame_id: 'map' },
            pose: {
                position:    { x: mapX, y: mapY, z: 0.0 },
                orientation: { x: 0.0, y: 0.0, z: sinH, w: cosH },
            },
        };
    };

    const sendMission = async () => {
        if (waypoints.length === 0 || !missionId || eStopActive) return;
        try {
            setIsSending(true);
            await localDb.updateMissionStatus(missionId, 'sent');

            const poses = waypoints.map(waypointToPose);

            const response = await fetch(`${GATEWAY_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: 22,
                    behavior_name: 'FollowRoute',
                    task_id: missionId,
                    note: `Mission ${missionId}`,
                    poses,   // map-frame ROS PoseStamped array — gateway forwards to Nav2
                }),
            });

            if (response.ok) {
                setSentSuccess(true);
                showToast('Navigation goal dispatched to Hive.', 'success');
                setTimeout(() => setSentSuccess(false), 3000);
            } else {
                const body = await response.json().catch(() => ({}));
                const detail = body?.detail ?? response.statusText;
                if (response.status === 503) {
                    showToast(`Gateway: ${detail}`, 'error');
                } else {
                    showToast(`Gateway error ${response.status}: ${detail}`, 'error');
                }
            }
        } catch (err: any) {
            const isNetErr = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
            if (isNetErr) {
                showToast(`Cannot reach gateway at ${GATEWAY_URL} — is it running?`, 'error');
            } else {
                showToast(err.message || 'Dispatch failed', 'error');
            }
        } finally {
            setIsSending(false);
        }
    };

    // Direct Nav2 dispatch — POST /nav_goal → gateway → cmd/goal (MQTT) →
    // bridge sends the WHOLE waypoint list as one NavigateThroughPoses
    // action goal, bypassing the Hive route planner entirely. Unlike the
    // old single-pose /goal_pose version, this genuinely carries a route —
    // NavigateThroughPoses accepts multiple poses, so every waypoint on the
    // map goes out in one call. Deliberately doesn't touch
    // missionId/localDb: this isn't part of the mission-tracking system,
    // it's a direct, ad-hoc dispatch.
    const sendGoal = async () => {
        if (waypoints.length === 0 || eStopActive) return;
        try {
            setIsSendingGoal(true);
            const poses = waypoints.map(waypointToPose);

            const response = await fetch(`${GATEWAY_URL}/nav_goal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ poses }),
            });

            if (response.ok) {
                setGoalSentSuccess(true);
                showToast(
                    `Route (${waypoints.length} waypoint${waypoints.length > 1 ? 's' : ''}) dispatched directly to Nav2.`,
                    'success'
                );
                setTimeout(() => setGoalSentSuccess(false), 3000);
            } else {
                const body = await response.json().catch(() => ({}));
                const detail = body?.detail ?? response.statusText;
                showToast(`Gateway error ${response.status}: ${detail}`, 'error');
            }
        } catch (err: any) {
            const isNetErr = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
            if (isNetErr) {
                showToast(`Cannot reach gateway at ${GATEWAY_URL} — is it running?`, 'error');
            } else {
                showToast(err.message || 'Send goal failed', 'error');
            }
        } finally {
            setIsSendingGoal(false);
        }
    };

    // POST /cancel_nav → gateway → cmd/cancel_nav → bridge cancels whatever
    // NavigateThroughPoses goal is active (from either sendGoal above or
    // /tasks' own Nav2-fallback path). Deliberately NOT gated on
    // waypoints.length or eStopActive — cancelling is a stop action, it
    // should stay available even with the map cleared or mid-e-stop.
    const cancelNav = async () => {
        try {
            setIsCancelling(true);
            const response = await fetch(`${GATEWAY_URL}/cancel_nav`, { method: 'POST' });
            const body = await response.json().catch(() => ({}));
            if (response.ok) {
                showToast(
                    body.cancelled ? 'Navigation cancelled.' : (body.detail || 'Nothing to cancel — no active direct-dispatch goal.'),
                    body.cancelled ? 'success' : 'info'
                );
            } else {
                showToast(`Gateway error ${response.status}: ${body?.detail ?? response.statusText}`, 'error');
            }
        } catch (err: any) {
            const isNetErr = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
            if (isNetErr) {
                showToast(`Cannot reach gateway at ${GATEWAY_URL} — is it running?`, 'error');
            } else {
                showToast(err.message || 'Cancel failed', 'error');
            }
        } finally {
            setIsCancelling(false);
        }
    };

    // POST /set_pose → gateway → cmd/set_pose → bridge publishes once to
    // /initialpose, re-seeding AMCL's estimate. Only one pose makes sense
    // here (there's only one robot), so — same convention as sendGoal used
    // to have — this uses the LAST placed waypoint.
    const setInitPose = async () => {
        if (waypoints.length === 0) return;
        try {
            setIsSettingPose(true);
            const target = waypoints[waypoints.length - 1];
            const pose = waypointToPose(target);

            if (waypoints.length > 1) {
                showToast(`Using WP-${target.order} (last placed) as the AMCL initial pose.`, 'info');
            }

            const response = await fetch(`${GATEWAY_URL}/set_pose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pose }),
            });

            if (response.ok) {
                showToast('Initial pose set — AMCL will re-localise from here.', 'success');
            } else {
                const body = await response.json().catch(() => ({}));
                showToast(`Gateway error ${response.status}: ${body?.detail ?? response.statusText}`, 'error');
            }
        } catch (err: any) {
            const isNetErr = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
            if (isNetErr) {
                showToast(`Cannot reach gateway at ${GATEWAY_URL} — is it running?`, 'error');
            } else {
                showToast(err.message || 'Set pose failed', 'error');
            }
        } finally {
            setIsSettingPose(false);
        }
    };

    return (
        <div className="min-h-screen bg-background relative isolate flex flex-col">
            <Header
                showBack={true}
                backTo="/"
                title="Simple Route Planner"
                icon={Route}
                iconColor="text-amber-400"
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-10">
                {loading ? (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                            <Skeleton className="h-[550px] w-full rounded-2xl" />
                            <div className="space-y-4">
                                <Skeleton className="h-40 w-full rounded-2xl" />
                                <Skeleton className="h-80 w-full rounded-2xl" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
                        {/* Map Interaction Area */}
                        <Card hover={false} className="p-6 flex flex-col overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-text truncate max-w-[200px]">{selectedMap?.name}</h2>
                                        <p className="text-[10px] font-mono text-textMuted uppercase tracking-widest">Active Planning Canvas</p>
                                    </div>
                                    <div className="h-8 w-px bg-border/50" />
                                    {/* Map Selection Dropdown */}
                                    <select
  value={selectedMap?.id || ''}
  onChange={(e) => {
    const map = maps.find(m => m.id === e.target.value);
    if (map) handleSelectMap(map);
  }}
  className="bg-surface border border-border/50 text-text text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-amber-400/50 transition-all font-mono cursor-pointer"
>
  {maps.map(m => (
    <option key={m.id} value={m.id}>{m.name}</option>
  ))}
</select>
<label className={`inline-flex items-center gap-2 ml-2 bg-surface border border-border/50 text-xs rounded-xl px-3 py-1.5 transition-all ${isUploading ? 'opacity-50 pointer-events-none text-textMuted' : 'cursor-pointer text-text hover:bg-surface/80'}`}>
  <Upload className="w-4 h-4" />
  <span>{isUploading ? 'LOADING...' : 'Load Map'}</span>
  <input type="file" accept=".pgm,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
</label>

                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={clearAll}
                                        disabled={waypoints.length === 0 && !pendingWaypoint}
                                        className="text-rose-400 border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-40"
                                        icon={RotateCcw}
                                    >
                                        CLEAR ROUTE
                                    </Button>
                                    <Button
                                        variant={drawMode ? 'primary' : 'outline'}
                                        onClick={() => {
                                            setDrawMode(!drawMode);
                                            if (drawMode) setPendingWaypoint(null);
                                        }}
                                        className={drawMode ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
                                        icon={Target}
                                    >
                                        {drawMode ? 'STOP PLACING' : 'PLACE WAYPOINT'}
                                    </Button>
                                    {/* POST /set_pose → /initialpose — re-seeds AMCL from the
                                        last placed waypoint. Cyan to stay visually distinct from
                                        amber (route planning), blue (direct nav dispatch), and
                                        rose (cancel/danger) elsewhere on this page. */}
                                    <Button
                                        variant="outline"
                                        onClick={setInitPose}
                                        disabled={waypoints.length === 0 || isSettingPose}
                                        title="Set AMCL's initial pose from the last placed waypoint"
                                        className="text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10 disabled:opacity-40"
                                        icon={LocateFixed}
                                    >
                                        {isSettingPose ? 'SETTING...' : 'INIT POSE'}
                                    </Button>
                                </div>
                            </div>

                            <div
                                className={`relative border border-border/50 rounded-2xl bg-black/40 flex-1 flex items-center justify-center overflow-hidden min-h-[500px] transition-all ${drawMode ? 'ring-2 ring-amber-400/30' : ''}`}
                                style={{ cursor: drawMode ? (pendingWaypoint ? 'alias' : 'crosshair') : 'default' }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={900}
                                    height={600}
                                    className="w-full h-full object-contain"
                                    onClick={handleCanvasClick}
                                    onMouseMove={handleCanvasMouseMove}
                                />

                                {/* Scan-on-map overlay toggle — shares the /api/scan stream
                                    with the sidebar's Scan Observation panel (see scanOnMapOn
                                    above); turning this on is enough by itself to light up
                                    the stream even if the sidebar toggle is off. */}
                                <button
                                    onClick={() => setScanOnMapOn(v => !v)}
                                    title="Overlay live LIDAR returns on the map, anchored to the AMCL pose (off by default to save robot CPU)"
                                    className={`absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-mono font-bold tracking-wide transition-colors cursor-pointer shadow-lg ${
                                        scanOnMapOn
                                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                            : 'bg-black/50 border-border text-textMuted hover:border-rose-500/40 hover:text-rose-300'
                                    }`}
                                >
                                    <Radar className="w-3 h-3" />
                                    Scan on Map: {scanOnMapOn ? 'ON' : 'OFF'}
                                    {scanOnMapOn && (
                                        <div className={`w-1.5 h-1.5 rounded-full ml-0.5 ${scanConnected && scan ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                                    )}
                                </button>

                                {drawMode && (
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-background px-4 py-2 rounded-full text-xs font-bold shadow-2xl animate-fade-in flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-background rounded-full animate-pulse" />
                                        {pendingWaypoint ? 'CLICK TO SET ORIENTATION' : 'SELECT POINT ON GRID'}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Path Manifest Sidebar */}
                        <div className="flex flex-col gap-6">
                            {/* Live Telemetry Panel */}
                            <Card hover={false} className="p-6 border border-border/50 bg-surface/40 backdrop-blur-md rounded-2xl flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted">
                                        LIVE TELEMETRY
                                    </h3>
                                    <div className={`animate-pulse flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
                                        connected
                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                            : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                    }`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                        {connected ? 'Connected' : 'Not Connected'}
                                    </div>
                                </div>

                                {connected && robotState ? (
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-mono text-textMuted uppercase">X (m)</p>
                                            <p className="text-xs font-mono font-bold text-purple-400 mt-1">{(robotState.x ?? 0.0).toFixed(3)}</p>
                                        </div>
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-mono text-textMuted uppercase">Y (m)</p>
                                            <p className="text-xs font-mono font-bold text-purple-400 mt-1">{(robotState.y ?? 0.0).toFixed(3)}</p>
                                        </div>
                                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                            <p className="text-[10px] font-mono text-textMuted uppercase">YAW (°)</p>
                                            <p className="text-xs font-mono font-bold text-purple-400 mt-1">
                                                {robotState.theta !== undefined
                                                    ? `${(robotState.theta * 180 / Math.PI).toFixed(1)}°`
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 bg-black/20 rounded-xl border border-dashed border-border/30">
                                        <p className="text-xs text-textMuted">Waiting for /odom data…</p>
                                        <p className="text-[9px] font-mono text-textMuted/60 mt-1">ws://gateway/api/telemetry</p>
                                    </div>
                                )}

                                {connected && robotState?.status && (
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                                        <span className="text-textMuted">NAV STATUS:</span>
                                        <span className={`font-bold uppercase tracking-wide ${
                                            robotState.status === 'completed' ? 'text-emerald-400' :
                                            robotState.status === 'active' ? 'text-amber-400' :
                                            robotState.status === 'teleop' ? 'text-blue-400' : 'text-purple-400'
                                        }`}>
                                            {robotState.status}
                                        </span>
                                    </div>
                                )}

                                {connected && robotState?.distance_remaining !== undefined && robotState.distance_remaining > 0 && (
                                    <div className="bg-black/20 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                                        <span className="text-textMuted">DIST REMAINING:</span>
                                        <span className="font-bold text-text">
                                            {robotState.distance_remaining.toFixed(1)} px
                                        </span>
                                    </div>
                                )}
                            </Card>

                            {/* Scan Observation */}
                            <Card hover={false} className="flex-1 flex flex-col overflow-hidden">
                                <div className="px-6 py-4 border-b border-border/50 bg-black/10 flex items-center justify-between">
                                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-textMuted">Scan Observation</h3>
                                    <div className="flex items-center gap-2">
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
                                            Scan Update: {scanUpdateOn ? 'ON' : 'OFF'}
                                        </button>
                                        <div className={`animate-pulse flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
                                            scanConnected
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                                                : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                        }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${scanConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            {scanConnected ? 'Live' : 'No Signal'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 p-4 flex flex-col gap-3">
                                    {/* Polar plot */}
                                    <div className="flex justify-center">
                                        <canvas
                                            ref={scanCanvasRef}
                                            width={220}
                                            height={220}
                                            className="rounded-xl border border-white/10"
                                        />
                                    </div>

                                    {/* Scan stats */}
                                    {scan ? (() => {
                                        const valid = scan.ranges.filter(r => r !== null && r >= scan.range_min && r <= scan.range_max) as number[];
                                        const closest = valid.length ? Math.min(...valid) : null;
                                        const farthest = valid.length ? Math.max(...valid) : null;
                                        return (
                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                    <p className="text-[10px] font-mono text-textMuted uppercase">Beams</p>
                                                    <p className="text-xs font-mono font-bold text-purple-400 mt-1">{valid.length} / {scan.ranges.length}</p>
                                                </div>
                                                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                    <p className="text-[10px] font-mono text-textMuted uppercase">Frame</p>
                                                    <p className="text-xs font-mono font-bold text-purple-400 mt-1 truncate">{scan.frame_id}</p>
                                                </div>
                                                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                    <p className="text-[10px] font-mono text-textMuted uppercase">Closest</p>
                                                    <p className="text-xs font-mono font-bold text-rose-400 mt-1">{closest !== null ? `${closest.toFixed(2)} m` : '—'}</p>
                                                </div>
                                                <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                                                    <p className="text-[10px] font-mono text-textMuted uppercase">Farthest</p>
                                                    <p className="text-xs font-mono font-bold text-emerald-400 mt-1">{farthest !== null ? `${farthest.toFixed(2)} m` : '—'}</p>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="text-center py-4 bg-black/20 rounded-xl border border-dashed border-border/30">
                                            <p className="text-xs text-textMuted">Waiting for /scan data…</p>
                                            <p className="text-[9px] font-mono text-textMuted/60 mt-1">ws://gateway/api/scan</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-border/50 bg-black/10 space-y-4">
                                    {waypoints.length > 0 && (
                                        <Button variant="outline" className="w-full text-xs" onClick={clearAll}>
                                            CLEAR WAYPOINTS
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        className={`w-full py-4 tracking-widest font-bold ${sentSuccess ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : ''}`}
                                        disabled={waypoints.length === 0 || isSending || sentSuccess || eStopActive}
                                        onClick={sendMission}
                                        icon={sentSuccess ? CheckCircle2 : Send}
                                    >
                                        {eStopActive ? 'E-STOP ACTIVE' : sentSuccess ? 'TELEMETRY CONFIRMED' : isSending ? 'TRANSMITTING...' : 'INITIATE NAVIGATION'}
                                    </Button>

                                    {/* Direct Nav2 dispatch — POST /nav_goal → NavigateThroughPoses,
                                        bypasses the Hive route planner entirely. Deliberately a
                                        lighter-weight outline button, not styled to compete with
                                        INITIATE NAVIGATION above — this is the "send it straight to
                                        Nav2" escape hatch, not the primary action. */}
                                    <Button
                                        variant="outline"
                                        className={`w-full py-3 tracking-widest font-bold text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10 ${goalSentSuccess ? 'bg-blue-500/10 border-blue-500/60' : ''}`}
                                        disabled={waypoints.length === 0 || isSendingGoal || eStopActive}
                                        onClick={sendGoal}
                                        icon={goalSentSuccess ? CheckCircle2 : Navigation}
                                    >
                                        {eStopActive ? 'E-STOP ACTIVE' : goalSentSuccess ? 'GOAL PUBLISHED' : isSendingGoal ? 'PUBLISHING...' : 'SEND GOAL'}
                                    </Button>
                                    <p className="text-[9px] font-mono text-textMuted/70 text-center -mt-2">
                                        Direct Nav2 dispatch → NavigateThroughPoses (bypasses Hive route planner)
                                    </p>

                                    {/* POST /cancel_nav — stops whatever NavigateThroughPoses goal
                                        is active, from either SEND GOAL above or /tasks' own Nav2
                                        fallback. Real danger styling (variant="danger"), and
                                        deliberately NOT disabled by waypoints/eStop — a stop action
                                        should stay reachable regardless of map/e-stop state. */}
                                    <Button
                                        variant="danger"
                                        className="w-full py-3 tracking-widest font-bold text-xs"
                                        disabled={isCancelling}
                                        onClick={cancelNav}
                                        icon={XCircle}
                                    >
                                        {isCancelling ? 'CANCELLING...' : 'CANCEL NAV'}
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
