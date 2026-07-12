import { useState, useEffect, useRef } from 'react';
import { GATEWAY_URL } from '../lib/config';

export interface TelemetryPayload {
    type: 'telemetry' | 'status' | 'feedback';
    x?: number;
    y?: number;
    theta?: number;
    status?: string;
    message?: string;
    distance_remaining?: number;
    mission_id?: string;
}

// Derive WebSocket URL from the HTTP GATEWAY_URL
function toWsUrl(base: string, path: string): string {
    return base.replace(/^http/, 'ws') + path;
}

export function useTelemetry() {
    const [connected, setConnected]   = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [robotState, setRobotState] = useState<TelemetryPayload | null>(null);
    const [error, setError]           = useState<string | null>(null);

    const wsRef              = useRef<WebSocket | null>(null);
    const reconnectTimeout   = useRef<number | null>(null);
    const reconnectDelay     = useRef(2000);

    useEffect(() => {
        const connect = () => {
            if (wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                 wsRef.current.readyState === WebSocket.CONNECTING)) return;

            setConnecting(true);
            setError(null);

            try {
                const ws = new WebSocket(toWsUrl(GATEWAY_URL, '/api/telemetry'));
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnected(true);
                    setConnecting(false);
                    reconnectDelay.current = 2000;
                };

                ws.onmessage = (event) => {
                    try {
                        const data: TelemetryPayload = JSON.parse(event.data);
                        setRobotState(prev => {
                            if (data.type === 'telemetry') return data;
                            return { ...prev, ...data, x: prev?.x, y: prev?.y, theta: prev?.theta };
                        });
                    } catch {
                        // ignore malformed frames
                    }
                };

                ws.onerror = () => setError('WebSocket error');

                ws.onclose = () => {
                    setConnected(false);
                    setConnecting(false);
                    wsRef.current = null;
                    reconnectTimeout.current = window.setTimeout(() => {
                        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
                        connect();
                    }, reconnectDelay.current);
                };
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to open WebSocket');
                setConnecting(false);
            }
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

    return { connected, connecting, robotState, error };
}
