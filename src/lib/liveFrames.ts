/**
 * Frame generators for the sensor pages' live panels.
 *
 * Every function is PURE and deterministic in (index, tick) — no random(),
 * no Date.now(). That is what lets the panel pause, step and replay the same
 * sequence, and what makes these unit-testable without a clock.
 *
 * The lidar and depth generators are the Hardware & Sensors Lab's own, reused
 * rather than reimplemented: one room model, one depth scene, so the reference
 * page and the lab cannot drift into describing different rooms.
 */
import {
    computeRoomRangeM,
    buildDepthGrid,
    computeRegistrationOffset,
    ASTRA_SCENE_SHAPES,
} from './sensors/MockSensorSource';

/** One /scan frame. Reuses the lab's room raycast. */
export function liveScanRanges(tick: number, beams: number): (number | null)[] {
    const out: (number | null)[] = [];
    for (let i = 0; i < beams; i++) {
        const a = (i / beams) * Math.PI * 2;
        out.push(computeRoomRangeM(a, i, tick));
    }
    return out;
}

/** One depth grid. The scene drifts slowly so the view is not static. */
export function liveDepthGrid(tick: number, registered: boolean, cols = 16, rows = 12): number[][] {
    const drift = Math.sin(tick / 9) * 0.06;
    const shapes = ASTRA_SCENE_SHAPES.map((s, i) => ({
        ...s,
        x: Math.min(0.95, Math.max(0.05, s.x + drift * (i % 2 === 0 ? 1 : -1))),
    }));
    return buildDepthGrid(shapes, cols, rows, computeRegistrationOffset(registered));
}

/**
 * IMU at rest. Gravity on z, gyro near zero with bias, magnetometer steady —
 * plus a small deterministic tremor so the view reads as a live instrument
 * rather than a frozen table.
 */
export function liveImu(tick: number): {
    accel: [number, number, number];
    gyro: [number, number, number];
    mag: [number, number, number];
} {
    const w = (k: number, amp: number) => Math.sin(tick / 3.1 + k) * amp;
    return {
        accel: [+(0.04 + w(0, 0.03)).toFixed(3), +(-0.02 + w(1.7, 0.03)).toFixed(3), +(9.79 + w(3.1, 0.02)).toFixed(3)],
        gyro: [+(0.001 + w(0.4, 0.0012)).toFixed(4), +(-0.002 + w(2.2, 0.0012)).toFixed(4), +(w(4.0, 0.0008)).toFixed(4)],
        mag: [+(21.3 + w(1.1, 0.35)).toFixed(2), +(2.4 + w(2.9, 0.3)).toFixed(2), +(-43.1 + w(0.6, 0.4)).toFixed(2)],
    };
}

/**
 * Four HC-SR04 echoes. The centre-right unit stays silent on purpose: a
 * transducer with no return must render as an absence, never as a ceiling
 * value, because a stale maximum reads as "clear".
 */
export function liveRanges(tick: number): (number | null)[] {
    const w = (k: number, amp: number) => Math.sin(tick / 4.3 + k) * amp;
    return [
        +(0.62 + w(0, 0.05)).toFixed(3),
        +(1.85 + w(1.4, 0.12)).toFixed(3),
        null,
        +(0.41 + w(2.8, 0.04)).toFixed(3),
    ];
}

// =============================================================================
// Project telemetry — what each behaviour would be publishing right now
// =============================================================================

/** Line follower: cross-track error in mm, plus the detected line centroid. */
export function liveLine(tick: number) {
    const corner = Math.sin(tick / 11) > 0.86;           // periodic 90-degree turn
    const err = Math.sin(tick / 5.5) * 14 + (corner ? Math.sin(tick) * 38 : 0);
    return {
        errMm: +err.toFixed(1),
        centroidX: +(0.5 + err / 900).toFixed(3),        // 0..1 across the crop
        yawRate: +(-err * 0.0042).toFixed(4),
        locked: Math.abs(err) < 70,
    };
}

/** Object tracker: bearing to the blob, its area, and whether the lock holds. */
export function liveTrack(tick: number) {
    const bearing = Math.sin(tick / 6.2) * 7.5;
    const area = 12800 + Math.sin(tick / 4.1) * 1600;
    return {
        bearingDeg: +bearing.toFixed(2),
        areaPx: Math.round(area),
        objectX: +(0.5 + bearing / 60).toFixed(3),
        locked: Math.abs(bearing) < 12,
    };
}

/** Human follower: standoff distance and lock state. */
export function liveFollow(tick: number) {
    const corner = Math.sin(tick / 13) > 0.92;
    const standoff = 1.4 + Math.sin(tick / 7) * 0.09 + (corner ? 0.34 : 0);
    return {
        standoffM: +standoff.toFixed(2),
        errM: +(standoff - 1.4).toFixed(2),
        locked: true,
        inDeadband: Math.abs(standoff - 1.4) <= 0.15,
    };
}

/** Patrol: which waypoint is active and how the loop is progressing. */
export function livePatrol(tick: number, stops = 6) {
    const idx = Math.floor(tick / 6) % stops;
    const progress = (tick % 6) / 6;
    return {
        waypoint: idx + 1,
        stops,
        progress: +progress.toFixed(2),
        lap: Math.floor(tick / (6 * stops)) + 1,
        etaS: +((1 - progress) * 41.7).toFixed(1),
    };
}
