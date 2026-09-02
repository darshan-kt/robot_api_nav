// src/components/vision/RobotSandbox2D.tsx
import { useEffect, useRef } from 'react';
import type { TwistCommand } from '../../lib/vision/types';

interface RobotSandbox2DProps {
  twist: TwistCommand;
  size?: number;
}

const SANDBOX_SCALE = 40; // px per (m/s * s), tuned only for a visually legible sandbox
const MARGIN = 20;

/**
 * A bounded 2D canvas that integrates a TwistCommand into a pose and draws
 * a rotating/translating icon — nothing else. Shares ZERO code with
 * RemoteControllerPage.tsx's real teleop HUD on purpose (see the plan's
 * Architecture Decision 4): that page has a real, safety-critical /cmd_vel
 * publish path to the actual robot, and this component must never share a
 * code surface with anything that could plausibly reach it, so "this never
 * controls real hardware" is true by inspection. Numbers in, pixels out.
 */
export function RobotSandbox2D({ twist, size = 240 }: RobotSandbox2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const twistRef = useRef(twist);
  twistRef.current = twist;
  const poseRef = useRef({ x: size / 2, y: size / 2, theta: -Math.PI / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000); // clamp to avoid a big jump after a tab switch
      lastTime = now;

      const t = twistRef.current;
      const pose = poseRef.current;
      pose.theta += t.angularZ * dt;
      pose.x += Math.cos(pose.theta) * t.linearX * SANDBOX_SCALE * dt;
      pose.y += Math.sin(pose.theta) * t.linearX * SANDBOX_SCALE * dt;

      // Wrap at the sandbox edges rather than letting the icon escape.
      if (pose.x < MARGIN) pose.x = size - MARGIN;
      if (pose.x > size - MARGIN) pose.x = MARGIN;
      if (pose.y < MARGIN) pose.y = size - MARGIN;
      if (pose.y > size - MARGIN) pose.y = MARGIN;

      ctx.clearRect(0, 0, size, size);

      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx <= size; gx += 20) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, size);
        ctx.stroke();
      }
      for (let gy = 0; gy <= size; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(size, gy);
        ctx.stroke();
      }

      const moving = t.linearX !== 0 || t.angularZ !== 0;
      ctx.save();
      ctx.translate(pose.x, pose.y);
      ctx.rotate(pose.theta);
      ctx.fillStyle = moving ? 'rgba(96, 165, 250, 0.9)' : 'rgba(148, 163, 184, 0.5)';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, 8);
      ctx.lineTo(-8, -8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [size]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        data-testid="robot-sandbox-2d"
        className="rounded-xl border border-border/50 bg-black/30 w-full"
      />
      <p data-testid="robot-sandbox-disclaimer" className="text-[10px] text-textDim mt-1.5 text-center leading-snug">
        A bounded visual sandbox — not connected to the real robot. No /cmd_vel is ever published anywhere by this
        app.
      </p>
    </div>
  );
}
