/**
 * Deterministic room ray-cast for the scanner figure.
 *
 * Lives outside the component module so Viz.tsx exports components only —
 * mixing a plain function in there breaks fast refresh for the whole file.
 */
/**
 * Ray-casts a room so the returned shape is a room a reader recognises.
 * Random noise looks plausible at a glance and teaches nothing; a real
 * rectangle with a doorway and a pillar lets the caption point at features.
 *
 * Room is 6.0 x 4.0 m, scanner at (2.2, 2.0), a 0.9 m doorway in the north
 * wall and a 0.30 m radius pillar at (4.3, 1.2).
 */
export function castRoom(beams: number): { angle: number; range: number | null }[] {
    const W = 6.0, H = 4.0, sx = 2.2, sy = 2.0;
    const DOOR_X0 = 3.1, DOOR_X1 = 4.0;      // gap in the north wall (y = H)
    const PIL = { x: 4.3, y: 1.2, r: 0.3 };
    const RANGE_MAX = 12.0;

    const out: { angle: number; range: number | null }[] = [];
    for (let i = 0; i < beams; i++) {
        const a = (i / beams) * Math.PI * 2;
        // Scanner frame, REP-103: 0 rad is robot-forward (+y here) and angle
        // grows counter-clockwise. This must match how PolarScan projects to
        // screen or the room comes out rotated 90° — which renders a 6.0 x 4.0
        // room as 4.0 x 6.0 and silently contradicts the caption.
        const dx = -Math.sin(a), dy = Math.cos(a);
        let best = Infinity;

        // axis-aligned walls
        const hits: { t: number; x: number; y: number; wall: 'n' | 's' | 'e' | 'w' }[] = [];
        if (dx > 1e-9) hits.push({ t: (W - sx) / dx, x: W, y: sy + ((W - sx) / dx) * dy, wall: 'e' });
        if (dx < -1e-9) hits.push({ t: (0 - sx) / dx, x: 0, y: sy + ((0 - sx) / dx) * dy, wall: 'w' });
        if (dy > 1e-9) hits.push({ t: (H - sy) / dy, x: sx + ((H - sy) / dy) * dx, y: H, wall: 'n' });
        if (dy < -1e-9) hits.push({ t: (0 - sy) / dy, x: sx + ((0 - sy) / dy) * dx, y: 0, wall: 's' });

        for (const h of hits) {
            if (h.t <= 0) continue;
            if (h.x < -1e-6 || h.x > W + 1e-6 || h.y < -1e-6 || h.y > H + 1e-6) continue;
            // the doorway is a gap: the beam leaves the room and never returns
            if (h.wall === 'n' && h.x > DOOR_X0 && h.x < DOOR_X1) continue;
            best = Math.min(best, h.t);
        }

        // pillar (ray-circle)
        const ox = sx - PIL.x, oy = sy - PIL.y;
        const b = ox * dx + oy * dy;
        const c = ox * ox + oy * oy - PIL.r * PIL.r;
        const disc = b * b - c;
        if (disc > 0) {
            const t = -b - Math.sqrt(disc);
            if (t > 0) best = Math.min(best, t);
        }

        if (!isFinite(best) || best > RANGE_MAX) { out.push({ angle: a, range: null }); continue; }
        // deterministic jitter — a fixed function of the index, never random()
        const jitter = Math.sin(i * 12.9898) * 0.006;
        out.push({ angle: a, range: best + jitter });
    }
    return out;
}
