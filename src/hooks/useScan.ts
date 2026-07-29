import { useState, useEffect, useRef } from 'react';
import { GATEWAY_URL } from '../lib/config';

export interface ScanData {
    type: string;
    frame_id: string;
    angle_min: number;
    angle_max: number;
    angle_increment: number;
    range_min: number;
    range_max: number;
    ranges: (number | null)[];
}

function toWsUrl(base: string, path: string): string {
    return base.replace(/^http/, 'ws') + path;
}

/**
 * Subscribes to /api/scan. Building a scan frame server-side costs an O(n)
 * pass over every LIDAR beam, so the backend only does it while a client has
 * explicitly opted in — pass `liveEnabled=false` (the recommended default)
 * to leave live updates off until the user turns them on, e.g. via a
 * "Scan Update" toggle in the UI.
 */
export function useScan(liveEnabled: boolean) {
    const [connected, setConnected] = useState(false);
    const [scan, setScan]           = useState<ScanData | null>(null);
    const wsRef             = useRef<WebSocket | null>(null);
    const reconnectTimeout  = useRef<number | null>(null);
    const reconnectDelay    = useRef(2000);
    const liveEnabledRef    = useRef(liveEnabled);
    liveEnabledRef.current  = liveEnabled;

    const sendToggle = (ws: WebSocket, enabled: boolean) => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'scan_toggle', enabled }));
        }
    };

    useEffect(() => {
        const connect = () => {
            if (wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                 wsRef.current.readyState === WebSocket.CONNECTING)) return;

            try {
                const ws = new WebSocket(toWsUrl(GATEWAY_URL, '/api/scan'));
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnected(true);
                    reconnectDelay.current = 2000;
                    sendToggle(ws, liveEnabledRef.current);
                };

                ws.onmessage = (event) => {
                    try {
                        const data: ScanData = JSON.parse(event.data);
                        if (data.type === 'scan') setScan(data);
                    } catch { /* ignore malformed */ }
                };

                ws.onerror = () => {};

                ws.onclose = () => {
                    setConnected(false);
                    wsRef.current = null;
                    setScan(null);
                    reconnectTimeout.current = window.setTimeout(() => {
                        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
                        connect();
                    }, reconnectDelay.current);
                };
            } catch { /* ignore open errors */ }
        };

        connect();

        return () => {
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, []);

    // Toggle live updates on the already-open socket without reconnecting.
    useEffect(() => {
        const ws = wsRef.current;
        if (ws) sendToggle(ws, liveEnabled);
        if (!liveEnabled) setScan(null);   // drop stale frame once paused
    }, [liveEnabled]);

    return { connected, scan };
}
