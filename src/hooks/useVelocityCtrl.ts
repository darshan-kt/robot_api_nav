import { useState, useEffect, useRef, useCallback } from 'react';
import { GATEWAY_URL } from '../lib/config';

function toWsUrl(base: string, path: string): string {
    return base.replace(/^http/, 'ws') + path;
}

/**
 * Teleop command channel → gateway /api/velocity_ctrl → ROS /cmd_vel.
 *
 * sendVelocity(linear, angular) sends one {"type":"cmd_vel"} frame if the
 * socket is open. The CALLER owns the cadence contract:
 *   - stream at ~10 Hz while an input is active
 *   - send one final (0, 0) on release, then go quiet
 * The backend has a 400 ms deadman that zeros the robot if the stream dies.
 */
export function useVelocityCtrl() {
    const [connected, setConnected] = useState(false);
    const wsRef             = useRef<WebSocket | null>(null);
    const reconnectTimeout  = useRef<number | null>(null);
    const reconnectDelay    = useRef(2000);

    useEffect(() => {
        const connect = () => {
            if (wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                 wsRef.current.readyState === WebSocket.CONNECTING)) return;

            try {
                const ws = new WebSocket(toWsUrl(GATEWAY_URL, '/api/velocity_ctrl'));
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnected(true);
                    reconnectDelay.current = 2000;
                };

                ws.onerror = () => {};

                ws.onclose = () => {
                    setConnected(false);
                    wsRef.current = null;
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

    const sendVelocity = useCallback((linear: number, angular: number) => {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'cmd_vel', linear, angular }));
        }
    }, []);

    return { connected, sendVelocity };
}
