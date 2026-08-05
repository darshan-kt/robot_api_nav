import { useState, useEffect, useRef } from 'react';
import { GATEWAY_URL } from '../lib/config';

/**
 * Live camera feed over WebRTC.
 *
 * Unlike every other hook in this folder, the video itself does NOT flow
 * through the gateway's WebSocket relay. It POSTs one SDP offer to
 * `${GATEWAY_URL}/webrtc/offer` (proxied to hive_camera_bridge — see that
 * module's docstring), gets back an SDP answer, and from then on the
 * browser and the robot exchange RTP directly over an ICE-negotiated path.
 * That's inherent to WebRTC, not a shortcut taken here — only the one-time
 * signaling handshake goes through the gateway.
 *
 * Off by default, same "Scan Update" convention as useScan: encoding video
 * on the robot side costs real CPU, so nothing runs until the operator
 * explicitly enables it. Attach the returned `videoRef` to a <video> tag.
 */
export function useCameraStream(enabled: boolean) {
    const [connected, setConnected]   = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [error, setError]           = useState<string | null>(null);

    const videoRef          = useRef<HTMLVideoElement>(null);
    const pcRef              = useRef<RTCPeerConnection | null>(null);
    const reconnectTimeout   = useRef<number | null>(null);
    const reconnectDelay     = useRef(2000);
    const stoppedRef         = useRef(false);   // true once cleanup has run — blocks late reconnects

    useEffect(() => {
        if (!enabled) return;
        stoppedRef.current = false;

        const cleanupPeer = () => {
            if (pcRef.current) {
                pcRef.current.onconnectionstatechange = null;
                pcRef.current.ontrack = null;
                pcRef.current.close();
                pcRef.current = null;
            }
        };

        const scheduleReconnect = () => {
            if (stoppedRef.current) return;
            reconnectTimeout.current = window.setTimeout(() => {
                reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
                cleanupPeer();
                connect();
            }, reconnectDelay.current);
        };

        const connect = async () => {
            setConnecting(true);
            setError(null);

            // Same LAN today — no STUN/TURN server needed. If the robot and
            // browser are ever on different networks (e.g. the gateway
            // moves to AWS but the robot stays on-site), a TURN relay goes
            // here; MQTT's broker-relay trick doesn't apply to bulk media.
            const pc = new RTCPeerConnection({ iceServers: [] });
            pcRef.current = pc;

            pc.addTransceiver('video', { direction: 'recvonly' });

            pc.ontrack = (event) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = event.streams[0];
                }
            };

            pc.onconnectionstatechange = () => {
                if (pc.connectionState === 'connected') {
                    setConnected(true);
                    setConnecting(false);
                    reconnectDelay.current = 2000;
                } else if (
                    pc.connectionState === 'failed' ||
                    pc.connectionState === 'disconnected' ||
                    pc.connectionState === 'closed'
                ) {
                    setConnected(false);
                    scheduleReconnect();
                }
            };

            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                const resp = await fetch(`${GATEWAY_URL}/webrtc/offer`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sdp: offer.sdp, type: offer.type }),
                });

                if (!resp.ok) {
                    const body = await resp.json().catch(() => ({}));
                    throw new Error(body.detail ?? `Gateway returned ${resp.status}`);
                }

                const answer = await resp.json();
                await pc.setRemoteDescription(answer);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to negotiate camera stream');
                setConnecting(false);
                setConnected(false);
                scheduleReconnect();
            }
        };

        connect();

        const videoEl = videoRef.current;
        return () => {
            stoppedRef.current = true;
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
            cleanupPeer();
            if (videoEl) videoEl.srcObject = null;
            setConnected(false);
            setConnecting(false);
        };
    }, [enabled]);

    return { videoRef, connected, connecting, error };
}
