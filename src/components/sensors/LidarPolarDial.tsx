// src/components/sensors/LidarPolarDial.tsx
import { useEffect, useRef } from 'react';
import type { LidarScanFrame } from '../../lib/sensors/types';

interface LidarPolarDialProps {
  frame: LidarScanFrame | null;
  size?: number;
  className?: string;
}

/**
 * Extracted and generalized from the LIDAR HUD math inline in
 * RemoteControllerPage.tsx (~line 385-470) — same ROS-angle-convention
 * rendering, generalized to take a `frame` prop instead of a page-local
 * ref. RemoteControllerPage.tsx is intentionally left untouched and keeps
 * its own inline copy (see the Hardware & Sensors Lab plan's Architecture
 * Decision 5) — a later, separate task can migrate it onto this component.
 *
 * Reads `frame` through a ref inside the requestAnimationFrame loop rather
 * than React state, preserving the "rAF must not re-render" rule the
 * original HUD already established.
 */
export function LidarPolarDial({ frame, size = 360, className = '' }: LidarPolarDialProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sweepAngle = 0;
    let animationId = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const maxR = canvas.width / 2 - 10;

      const s = frameRef.current;
      const displayMaxM = s ? Math.min(s.range_max, 5.0) : 4.0;
      const ppm = maxR / displayMaxM;

      // Background range rings with metre labels.
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

      // Crosshair.
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // Cosmetic rotating sweep line + glow.
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

      // Real (well — real-shaped) LIDAR returns. ROS angle convention:
      // angle = angle_min + i*angle_increment, CCW-positive, forward=up.
      if (s && s.ranges.length > 0) {
        for (let i = 0; i < s.ranges.length; i++) {
          const r = s.ranges[i];
          if (r === null || r < s.range_min) continue;
          const rPx = r * ppm;
          if (rPx > maxR) continue;

          const a = s.angle_min + i * s.angle_increment;
          const ox = cx - Math.sin(a) * rPx;
          const oy = cy - Math.cos(a) * rPx;

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
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO SCAN DATA', cx, cy);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      data-testid="lidar-polar-dial"
    />
  );
}
