import { useState, useEffect, useRef } from 'react';
import { GATEWAY_URL } from '../lib/config';

export interface PlanPoint {
    x: number;   // map frame, metres
    y: number;
}

export interface PlanData {
    type: string;
    frame_id: string;
    age_s: number | null;
    points: PlanPoint[];   // empty = no active plan
}

function toWsUrl(base: string, path: string): string {
    return base.replace(/^http/, 'ws') + path;
}

export function usePlan() {
    const [connected, setConnected] = useState(false);
    const [plan, setPlan]           = useState<PlanData | null>(null);
    const wsRef             = useRef<WebSocket | null>(null);
    const reconnectTimeout  = useRef<number | null>(null);
    const reconnectDelay    = useRef(2000);

    useEffect(() => {
        const connect = () => {
            if (wsRef.current &&
                (wsRef.current.readyState === WebSocket.OPEN ||
                 wsRef.current.readyState === WebSocket.CONNECTING)) return;

            try {
                const ws = new WebSocket(toWsUrl(GATEWAY_URL, '/api/plan'));
                wsRef.current = ws;

                ws.onopen = () => {
                    setConnected(true);
                    reconnectDelay.current = 2000;
                };

                ws.onmessage = (event) => {
                    try {
                        const data: PlanData = JSON.parse(event.data);
                        if (data.type === 'plan') setPlan(data);
                    } catch { /* ignore malformed */ }
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

    return { connected, plan };
}
