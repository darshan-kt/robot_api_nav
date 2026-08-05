# Build Prompt: ROBOSTORE — Robot Operations Console (Frontend Only)

**Purpose of this document:** a self-contained, step-by-step specification for rebuilding this application's frontend in a new codebase, independent of its current backend. Hand this to a developer or an AI coding agent as the build brief. It captures the design system, architecture, data contracts, and page-by-page behavior extracted from the source at `/home/darshan/appstore_arm/src`.

---

## 0. Mission brief

Build **ROBOSTORE**: a single-page React application that acts as an operator console for a mobile robot — an app-launcher "mission deck" leading to four tools: a live dashboard, an emergency-stop safety system, a manual teleoperation controller, and a route planner. Dark, data-dense, "mission control" aesthetic — monospace-heavy, live status pills, animated connection indicators.

**Architecture headline, read this before writing code:** there are two entirely separate data layers, and the migration plan differs for each.

1. **Application data** (robot profile, sensors, missions, maps, safety zones, schedules, conversation history) has **no backend today** — it lives entirely in the browser via IndexedDB, behind a repository module (`localDb`). Auth is a static stub (`{ id: 'local-user', email: 'admin@robot.local' }`, always "logged in" after a 100 ms fake delay). This is the layer you'll most likely want to point at a real backend during migration — see §6.
2. **Live robot data** (position, LIDAR scan, localisation, path plan, teleop commands) comes from a **real-time gateway** over REST + WebSocket. This is the layer that's coupled to the specific robot stack underneath — see §7 for the exact contracts to preserve or re-implement.

Keep that separation in the new codebase: it's what makes this UI portable in the first place.

---

## 1. Tech stack

Install exactly this stack — the design and animation code below assumes it:

| Concern | Choice |
|---|---|
| Build tool | **Vite** |
| Framework | **React 19** + **TypeScript** |
| Routing | **react-router-dom v7** (`BrowserRouter`) |
| Styling | **Tailwind CSS v3** + PostCSS + Autoprefixer |
| Icons | **lucide-react** |
| Lint | ESLint + typescript-eslint |
| State | No external state library — local component state + custom hooks + React Context (Toast only) |

No test framework, no CI config, and no server-side rendering in the source app — decide independently whether to add these in the new codebase.

---

## 2. Design tokens

### 2.1 Color palette (`tailwind.config.ts` → `theme.extend.colors`)

```ts
colors: {
  background: '#0a1b20',   // deep ocean teal — page background
  surface:    '#102830',   // panel/card background
  card:       '#132e38',   // slightly lighter card variant
  border:     '#2b4d58',
  accent:     '#00e5a0',   // primary brand — mint/emerald
  info:       '#38bdf8',
  warning:    '#ffb020',
  danger:     '#ff4d6a',
  text:       '#e8ecf4',
  textMuted:  '#8892a8',
  textDim:    '#5a6580',
}
```

Dark theme only — there is no light-mode toggle anywhere in the source app. Beyond the custom palette above, the UI leans heavily on **Tailwind's stock palette** applied directly as semantic/state color, always at reduced opacity for fills (`/10`, `/20`) with a solid border at `/20–/50`:

- **emerald** — success, primary/core, "online"
- **rose** — danger, E-Stop, "offline"
- **amber** — warning, planning
- **blue** — info, secondary actions
- **purple** — manual/teleop theme
- **pink**, **teal** — available accent themes for future app cards (defined in the `Card`/`Badge` components but not currently assigned to a page)

### 2.2 Typography

```ts
fontFamily: {
  mono: ['"JetBrains Mono"', 'monospace'],
  sans: ['"DM Sans"', 'sans-serif'],
}
```

**Mono is the dominant voice** — used for headings, badges, status pills, technical labels, numeric readouts, and anything that should read as "instrument panel." Sans is reserved for longer body copy (descriptions, help text). This ratio (mono-first) is a deliberate, distinguishing choice — don't default to sans for headings.

### 2.3 Global styles & motion system (`index.css`)

Implement these as reusable utility classes — every page draws on them:

- **Aurora background** — a fixed, full-viewport `body::before` layer with four radial gradients (teal, emerald, cyan, violet, all low-opacity) that slowly drifts and hue-rotates on a 36 s `alternate` loop. Sits behind all content (`z-index: -1`), `pointer-events: none`.
- **`animate-pulse-status`** — 2 s scale+opacity pulse, used on every "live" indicator dot (connection badges, E-Stop light).
- **`animate-fade-up`** / **`animate-fade-in`** — entrance animations, paired with `.stagger-1` … `.stagger-5` (100 ms increments) for staggering lists/grids on mount.
- **`animate-spin-slow`** (12 s linear spin) and **`animate-pulse-gentle`** (3 s scale+opacity) — used for decorative background elements and loading rings.
- **Hub page effects** (`AppStorePage` only, prefixed `hub-`): a perspective-transformed scrolling grid floor (Tron-style), a gradient-panning multi-hue headline (`background-clip: text`), a blinking text cursor, an infinite horizontal status ticker (pauses on hover), and per-card 3D tilt + cursor-tracked radial spotlight + rotating conic-gradient border beam (driven by a `--glow` CSS custom property set per card theme, and `--mx`/`--my` set on `mousemove`).
- **`prefers-reduced-motion: reduce`** — every animation above must be disabled under this media query. Non-negotiable, already enforced twice in the source (base layer + hub utilities).
- Custom thin scrollbar (`::-webkit-scrollbar`, 8px, colored to match theme tokens).

---

## 3. Project structure

```
src/
  components/
    layout/
      Header.tsx            # top bar: back nav, page title/icon, E-Stop pill, connection pill, sign out
      ProtectedRoute.tsx     # auth guard wrapper
    ui/
      Layout.tsx             # Card, Badge, Button, Skeleton, EmptyState — the shared kit
      Toast.tsx               # ToastProvider (Context) + useToast()
  hooks/
    useAuth.ts               # stub session
    useScan.ts                # /api/scan — toggle-gated LIDAR stream
    useTelemetry.ts            # /api/telemetry — odometry
    useLocalisation.ts         # /api/localisation — AMCL pose
    usePlan.ts                 # /api/plan — active nav path
    useVelocityCtrl.ts          # /api/velocity_ctrl — teleop command channel
  lib/
    config.ts                 # GATEWAY_URL (env-overridable)
    idb.ts                     # generic Promise-based IndexedDB wrapper
    localDb.ts                  # app-data repository — THE migration seam, see §6
    pgmParser.ts                 # binary ROS .pgm map decoder → PNG data URL
    utils.ts                     # sanitizeInput, escapeHTML, validators
  pages/
    LoginPage.tsx
    AppStorePage.tsx           # the "/store" hub
    DashboardPage.tsx
    EmergencyStopPage.tsx
    RemoteControllerPage.tsx
    SimpleRoutePlannerPage.tsx
  types/index.ts               # all data model interfaces
  App.tsx                      # routes
  main.tsx                     # entry
  index.css
```

---

## 4. Build order

Follow this sequence — each step only depends on the ones before it.

### Step 1 — Scaffold
`npm create vite@latest -- --template react-ts`, then add Tailwind (`tailwindcss`, `postcss`, `autoprefixer`), `react-router-dom`, `lucide-react`. Apply the palette and fonts from §2.1–2.2 in `tailwind.config.ts`. Self-host both fonts (variable woff2, e.g. via `@fontsource/jetbrains-mono` + `@fontsource/dm-sans`, or your own hosting) rather than a runtime Google Fonts request.

### Step 2 — Type definitions
Create `types/index.ts` with these interfaces (field names are the contract the rest of the app relies on):

- `Robot` — id, user_id, name, model, serial_number, firmware_version, ip_address, status, battery_level, uptime_hours, last_mission, max_speed, **max_linear_speed** (teleop cap, m/s, 0.1–0.8), **max_turn_rate** (teleop cap, rad/s, 0.1–1.0), obstacle_distance, navigation_mode, localization_method, path_planner, recovery_behavior, created_at, updated_at
- `EmergencyStop` — id, robot_id, user_id, is_active, triggered_at, released_at, triggered_by, reason, created_at
- `RobotSensor` — id, robot_id, name, model, status, frequency, temperature, created_at
- `MapData` — id, user_id, name, description, status, source, resolution, width, height, map_data (any), created_at, updated_at
- `SafetyZone` — id, map_id, name, zone_type, vertices ({x,y}[]), color, created_at
- `Waypoint` — x, y, theta?, order, label
- `Mission` — id, user_id, map_id, name, status, waypoints (Waypoint[]), created_at, updated_at
- `ScheduledRoute` — id, user_id, map_id, name, description, waypoints, schedule_type ('once'|'daily'|'weekly'|'custom'), schedule_date, schedule_time, recurrence_days, is_active, priority, estimated_duration, color, created_at, updated_at
- `ScheduleExecution` — id, scheduled_route_id, user_id, mission_id, scheduled_for, status ('pending'|'triggered'|'executing'|'completed'|'failed'|'skipped'|'cancelled'), started_at, completed_at, duration_seconds, error_message, waypoints_completed, waypoints_total, trigger_source ('automatic'|'manual'), created_at
- `Message` — role ('user'|'assistant'), content, timestamp, mode?
- `Conversation` — id, user_id, robot_id, mode, messages (Message[]), updated_at

Not every interface is used by every page today (`ScheduledRoute`/`ScheduleExecution`/`Conversation` are modeled but no current page reads/writes them) — carry them over anyway if you want feature parity headroom, or drop them if you're deliberately trimming scope.

### Step 3 — Data layer (`lib/idb.ts` + `lib/localDb.ts`)

Build a tiny generic IndexedDB wrapper (`idb.ts`): one database (`robot_store`, version 1), one object store per collection (`maps`, `robots`, `sensors`, `emergency_stops`, `missions`, `safety_zones`, `schedules`, `executions`, `conversations`, `meta`), four Promise-wrapped ops: `get`, `getAll`, `put`, `deleteEntry`.

On top of that, build `localDb.ts` as a **repository object** — this is the module every page imports, and it's the seam you'll cut at for migration (§6). It stores each collection as a single array value under one key (not one IDB record per item — simple, adequate for this data volume). Implement one function pair per collection:

- `getRobot()` / `updateRobot(id, updates)` — auto-seeds a default robot record (`AMR-X200`, battery 78%, etc.) on first read if none exists.
- `getSensors(robotId)` — auto-seeds 6 example sensors (LiDAR, IMU, two cameras, ultrasonic, wheel encoder) on first read.
- `getEmergencyStops(limit=10)` / `triggerEmergencyStop(robotId, isActive, reason)` — the latter also dispatches a `window` CustomEvent (`localdb-estop-updated`) so the persistent header badge updates without prop drilling.
- `getMaps()` / `saveMap(data)`
- `getSafetyZones(mapId)` / `saveSafetyZone(data)` / `deleteSafetyZone(id)`
- `getMissions()` / `saveMission(data)` / `updateMissionStatus(id, status)`
- `getSchedules()` / `saveSchedule(data)` / `deleteSchedule(id)`
- `getExecutions()` / `saveExecution(data)`
- `getConversation(userId)` / `saveConversation(data)`

Every write function follows the same shape: generate an id if missing (`<prefix>-${Date.now()}`), stamp `created_at`/`updated_at`, upsert into the array, persist. Include the one-time `migrateLegacyData()` guard (checks a `meta.migrated` flag, ports any pre-existing `localStorage` keys prefixed `robot_store_*` into IndexedDB) — safe to drop entirely in a fresh project with no legacy users.

### Step 4 — Gateway config + real-time hooks

`lib/config.ts`:
```ts
export const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:1717';
```

Every real-time hook (`useTelemetry`, `useLocalisation`, `usePlan`, `useScan`, `useVelocityCtrl`) shares one pattern — implement it once conceptually, then repeat per-endpoint:

1. `useRef<WebSocket | null>` for the socket, a ref for a reconnect timeout handle, a ref for the current backoff delay (starts at 2000 ms).
2. `toWsUrl(base, path)` — swaps `http`→`ws` in the base URL and appends the path.
3. On mount: open the socket; guard against double-connect if one's already `OPEN`/`CONNECTING`.
4. `onopen` → `connected = true`, reset backoff to 2000 ms.
5. `onmessage` → `JSON.parse`, discard silently on malformed frames, update state only when `data.type` matches the expected discriminant.
6. `onclose` → `connected = false`, clear the ref, schedule a reconnect after the current backoff, then grow the backoff by ×1.5 capped at 10000 ms.
7. Cleanup on unmount: clear the timeout, null out `onclose` (so the reconnect loop doesn't fire after unmount), close the socket.

Full endpoint contracts — **this is what a new backend has to implement to be a drop-in replacement**:

| Hook | Path | Direction | Rate | Payload |
|---|---|---|---|---|
| `useTelemetry` | `/api/telemetry` | server→client | 1 Hz | `{type:'telemetry', x, y, theta}` (odometry; theta = yaw radians) |
| `useLocalisation` | `/api/localisation` | server→client | 1 Hz | `{type:'localisation', x, y, yaw, frame_id, age_s}` (only sent when a fresh pose exists) |
| `usePlan` | `/api/plan` | server→client | 2 Hz | `{type:'plan', frame_id, age_s, points:[{x,y}]}` (empty `points` = no active plan) |
| `useScan` | `/api/scan` | bidirectional | ~1 Hz, **opt-in** | Client → `{type:'scan_toggle', enabled: boolean}` (default **off** — send this on connect and whenever the toggle flips). Server → `{type:'scan', frame_id, angle_min, angle_max, angle_increment, range_min, range_max, ranges: (number\|null)[]}` only while enabled. |
| `useVelocityCtrl` | `/api/velocity_ctrl` | client→server | ~10 Hz while active | `{type:'cmd_vel', linear, angular}`. Caller owns cadence: stream while an input is held, send exactly one final zero frame on release, then go quiet. Server-side expects a ~400 ms deadman — if the stream dies mid-drive it should zero the robot itself. |

Plus two plain REST calls used outside the hooks:
- `GET {GATEWAY_URL}/health` → `{ros_ready, robot_alive, topics: {...}}` — polled every 5 s by the `Header` component to drive the "Connected/Not Connected" pill.
- Map image endpoints if you carry over the route planner's map display (see §7's `SimpleRoutePlannerPage` notes).

### Step 5 — Shared UI kit (`components/ui/Layout.tsx`, `Toast.tsx`)

Build these primitives — every page composes from them, don't let pages hand-roll their own buttons/cards:

- **`Card`** — `bg-surface border border-border/50 rounded-2xl`, optional hover lift (`-translate-y-1` + theme-colored shadow) and a 3px top gradient bar in one of 7 theme colors (emerald/blue/amber/rose/purple/pink/teal).
- **`Badge`** — small uppercase mono pill, same 7 themes + `muted`.
- **`Button`** — variants `primary`/`secondary`/`outline`/`ghost`/`danger` × sizes `sm`/`md`/`lg`, optional leading icon, focus ring, disabled state.
- **`Skeleton`** — pulsing gray block for loading placeholders.
- **`EmptyState`** — centered icon + title + description + optional action, for empty lists.
- **`ToastProvider`/`useToast()`** — Context-based, fixed bottom-right stack, 3 types (success/error/info) with matching icon+border color, auto-dismiss after 4 s, manual close button, slide-up entrance animation.

### Step 6 — App shell: `Header`, `ProtectedRoute`, routing

**`ProtectedRoute`** — reads `{session, loading}` from `useAuth()`. Shows a centered spinner while loading; redirects to `/login` (carrying a `state.message`) if no session; otherwise renders children.

**`Header`** — sticky, blurred-backdrop top bar, reused on every page except Login:
- Left: back-arrow button (if `showBack`) OR the ROBOSTORE logo/home link, a vertical divider, then the page's icon + title.
- Right (only when authenticated): an **E-Stop pill** (polls `localDb.getEmergencyStops()` on mount and listens for the `localdb-estop-updated` window event — no polling loop needed for this one, event-driven), a **gateway connection pill** (polls `GET /health` every 5 s), the user's email, and a sign-out button.
- Props: `showBack`, `backTo` (default `/store`), `onBack`, `title`, `icon`, `iconColor`.

**`App.tsx`** — `BrowserRouter` with routes: `/login` (public), `/store`, `/dashboard`, `/emergency-stop`, `/remote-controller`, `/simple-route-planner` (all wrapped in `ProtectedRoute`), and a catch-all redirecting to `/store`. Wrap the whole tree in `ToastProvider`.

### Step 7 — `LoginPage` (`/login`)

Centered card on a subtle dotted-grid + radial-glow background. Logo, "ROBO<span accent>STORE</span>" wordmark, tagline. Email + password fields (password visibility toggle), submit button with loading spinner state. **Client-side rate limiting**: track failed-attempt timestamps in state, lock out submissions for 30 s after 5 failures within a rolling 60 s window (countdown shown in the submit button). On success, redirect to `/store`. Footer copy: "Enter any email + 6-digit password to get started" — signals this auth is decorative in the source app; replace with real auth during migration if you're wiring a backend (§6).

### Step 8 — `AppStorePage` (`/store`) — the hub

This is the most visually distinctive page — invest the most design effort here.

- Ambient background: two large blurred color blobs (emerald top-left, purple bottom-right, both `animate-pulse-gentle` with offset delays), the Tron-grid floor utility, 10 floating motes at deterministic positions with staggered float animations.
- Hero: small mono eyebrow line ("● Mission deck · UTC `HH:MM:SS` · OPERATOR SESSION" — the clock ticks live via `setInterval(1000)`), a large gradient-panned headline with a blinking cursor, a one-line description.
- An infinite horizontal ticker of system-status strings (decorative — "ALL SYSTEMS NOMINAL", "ROS 2 HUMBLE", "DDS DOMAIN 0", etc.), duplicated once and animated via `translateX(-50%)`, paused on hover.
- A 4-card grid (1 col mobile → 2 → 4 at `xl`), one card per app:

  | App | Icon | Theme | Tag | Route |
  |---|---|---|---|---|
  | Dashboard | LayoutDashboard | emerald | Core | `/dashboard` |
  | Emergency Stop | OctagonX | rose | Safety | `/emergency-stop` |
  | Remote Controller | Smartphone | purple | Manual | `/remote-controller` |
  | Simple Route Planner | Route | amber | Planning | `/simple-route-planner` |

  Each card: skeleton placeholder for 800 ms on mount (purely cosmetic loading simulation), then fades/staggers in. On hover: 3D tilt following cursor position (`perspective` + `rotateX`/`rotateY` computed from pointer offset), a radial spotlight following the cursor (`--mx`/`--my` custom properties), a rotating conic-gradient border beam, and a large translucent index numeral (`01`, `02`…) in the corner. Card body: icon tile with an orbiting dot on hover, title + tag badge, description, version string, and a "LAUNCH →" affordance that shifts on hover. Fully keyboard-operable (`role="button"`, `tabIndex`, Enter/Space activate).

### Step 9 — `DashboardPage` (`/dashboard`)

Tabbed interface, 4 tabs: **Robot Info**, **Sensors**, **Configuration**, **System**. A persistent live-status strip sits above the tab content regardless of which tab is active.

**State:** `activeTab` ('Robot Info' default), `robot: Robot | null`, `sensors: RobotSensor[]`, `loading`, `error`, `editingKey: string | null` (which field is mid-edit, across both panels — only one at a time), `editValue: string` (the in-progress edit buffer). Live data comes from `useGatewayHealth()` (below), `useScan(true)` (**note: `true`, always-on** — unlike Remote Controller/Route Planner where it's user-toggled, because this page only reads `scan.ranges.length` for a stat count, not rendering a HUD), `useTelemetry()`, `useLocalisation()`, `usePlan()`. `missionActive = !!(plan && plan.points.length > 0)`.

**`useGatewayHealth(intervalMs = 3000)`** — a page-local hook, not shared with other pages. Polls `GET {GATEWAY_URL}/health`, measuring round-trip latency itself via `performance.now()` before/after the fetch (the gateway's response doesn't carry a timestamp — latency is purely client-measured wall-clock). On success: `{ok: true, robotAlive: !!d.robot_alive, latencyMs, topics: d.topics ?? {}}`. On any fetch failure: `{ok: false, robotAlive: false, latencyMs: null, topics: {}}`. Also appends `1`/`0` to a `history` array on every poll, kept to the last 40 entries (`h.slice(-40)`) — this feeds the heartbeat sparkline.

**Live status strip** (always visible, all 4 tabs): 4 `LiveStat` items (colored dot + label + value) — ROBOT (alive/offline), GATEWAY (latency ms or DOWN; tone is emerald if `<100ms`, amber if slower, rose if down), POSE (`localisation.x, y` to 2 decimals or `—`), MISSION (`ACTIVE · N pts` or `IDLE`) — plus a `HeartbeatSpark` SVG on large screens (`hidden lg:block`).

**`HeartbeatSpark`** — a hand-drawn SVG heartbeat/ECG line, not a charting library. Builds a single `<path d="...">` string: for each of the last 20 history samples, if the sample is `1` (alive) it draws a small zigzag spike (down-up-down through 4 points at 30%/45%/60%/75% of the segment width, amplitudes ±0.42×/±0.24×height) then returns to the midline; if `0`, it just draws a flat segment. Stroke color: `#34d399` (emerald) if the most recent sample is alive, `#f43f5e` (rose) otherwise. `viewBox="0 0 160 28"`.

**Robot Info tab** — 4 `MetricCard`s (Status/Battery/Uptime/Comm — Battery includes an SVG progress ring computed from `battery_level`, drawn as a `stroke-dasharray` on a circle, `-rotate-90` so it starts at 12 o'clock) + a read-only spec table (Name/Model/Serial/Firmware/IP).

**Sensors tab** — 4 `SummaryTile`s (Modules Online = `active count/total`; Live Data Feeds = count of `[scan, robotState, localisation].filter(Boolean)`; Avg Module Temp = mean of all sensor temperatures; LIDAR Beams = valid/total from the live scan) then a card grid from `localDb.getSensors()`, **plus one synthesized virtual card that isn't in the database at all**: `{id:'virt-amcl', name:'AMCL Localisation Engine', status: localisation ? 'active' : 'standby', ...}`, rendered with `software={true}`. `SensorCard` picks an icon by regex-testing the sensor name (`sensorIcon()`: `/lidar/i`→Radar, `/imu/i`→Compass, `/camera/i`→Camera, `/ultrasonic/i`→Waves, `/encoder/i`→Cog, `/amcl|localis/i`→Crosshair, else Activity) and, for LIDAR/encoder sensors specifically, overlays a `live` one-line string built from the matching real-time stream (regex-matched against the sensor's own `name` field — this is how "hardware" cards get a live readout without a per-sensor data contract). Temperature renders as a 0–70°C bar (green/amber/rose at 40°C/50°C breakpoints).

**Configuration tab** — two side-by-side cards. "Motion & Safety Limits" iterates a fixed array of 4 numeric params (`max_speed` 0–3 m/s, `max_linear_speed` 0.1–0.8 m/s, `max_turn_rate` 0.1–1.0 rad/s, `obstacle_distance` 0–2 m), each rendered by `NumericParam`: a labeled progress bar (`pct = (value-min)/(max-min)*100`) with an edit-pencil icon that appears on hover (`opacity-0 group-hover/param:opacity-100`) and swaps the value for an `autoFocus` text input (Enter key = save) with inline check/cancel buttons. "Navigation Stack" does the same for 4 text params (`navigation_mode`, `localization_method`, `path_planner`, `recovery_behavior`) via `TextParam` (same edit affordance, renders the current value as a badge pill instead of a bar). **Validation happens in the page's `saveField(key)`, not in the sub-components**: `max_linear_speed` is rejected outside 0.1–0.8, `max_turn_rate` outside 0.1–1.0 (both show an error toast and abort the save); all 4 numeric keys are parsed with `parseFloat` and rejected if `NaN`. On success: `localDb.updateRobot()`, optimistic local state update, success toast, exit edit mode.

**System tab** — "ROS 2 Runtime — Live" card: 4 `TopicRow`s (`/global_costmap/costmap`, `/scan`, `/amcl_pose`, `/plan`), each showing "Xs ago" or "SILENT", green pulsing dot if `age < threshold` else amber (thresholds: 5s / 5s / 9999 "always fresh since AMCL only publishes on motion" / 15s), plus two stat tiles (Gateway RTT, Health Polls count). "Compute Resources" card: 4 `Gauge`s (CPU/Memory/vRAM/NVMe) — **these are not measuring anything real**. Each `Gauge` takes a static seed value (62/45/34/28) and then jitters it randomly every 2.5s (`val + (Math.random()-0.5)*10`, clamped 5–95) purely for visual liveliness — decide deliberately whether to carry this over or wire real metrics in the migration. "Environment Details" card: a static table of OS/middleware/DDS/SoC/memory/kernel/accelerator strings — also hardcoded, not queried from anywhere.

### Step 10 — `EmergencyStopPage` (`/emergency-stop`)

Two-column layout (stacks on mobile): a big circular E-Stop button on the left, a history log on the right.

- The button: 224px circle, two concentric dashed rings (the outer one spins when active), color/label/icon flip between armed (emerald, "STOP ENGAGED") and active (rose, "STOP RELEASED", pulsing ring). Clicking toggles state via `localDb.triggerEmergencyStop()` and fires the `localdb-estop-updated` window event so the `Header` badge updates instantly everywhere.
- **Global spacebar shortcut**: a `keydown` listener on `window` (only while this page is mounted) triggers the stop (not the release) on `Space`, with `preventDefault` to stop page scroll. Documented in a small "Keyboard Override Active" info card.
- When active, the whole page gets a full-viewport pulsing rose overlay behind the content.
- History log: reverse-chronological list of every trigger/release event with timestamp and reason, empty state when there's no history yet, skeleton rows while loading.
- Optimistic UI: button state flips immediately on click, reverts with an error toast if the persist call fails.

### Step 11 — `RemoteControllerPage` (`/remote-controller`)

Two-column layout: LIDAR HUD + velocity readout on the left, driving controls on the right.

<blockquote>

**Two deliberate deviations from the rest of the app — decide whether to preserve or fix these in migration, don't reproduce them by accident:**

1. **This page does not use the shared `useTelemetry` hook.** It hand-rolls its own `/api/telemetry` WebSocket connection inline (its own `useEffect`, its own reconnect-on-close-after-3s logic — no exponential backoff, just a flat 3s retry) with a **custom ping/pong latency probe layered on top of the same socket**: on open it sends the literal text frame `'ping'` every 3s and expects a literal text frame `'pong'` back, measuring latency as `Date.now() - pingTime`. No other page/hook in the app does this — `useTelemetry` elsewhere just consumes JSON telemetry frames with no latency measurement at all. If your new backend doesn't echo a bare `'pong'` string on receiving `'ping'`, this page's latency badge will simply never populate (harmless — just always blank — but worth knowing).
2. **The "EMERGENCY STOP (E-STOP)" button on this page is cosmetic and disconnected from the app's real E-Stop system.** `triggerEStop()` only sends a zero-velocity command and shows a toast — it does **not** call `localDb.triggerEmergencyStop()` and does **not** fire the `localdb-estop-updated` event. So pressing it here does *not* light up the header's E-Stop badge, does *not* appear in the Emergency Stop page's history log, and doesn't block the Route Planner's "INITIATE NAVIGATION" button the way the real E-Stop page's button does. Whether this is an intentional "local safety cutoff, separate from the global E-Stop registry" or a bug is genuinely ambiguous from the code alone — pick one deliberately when you rebuild it rather than copying the ambiguity forward.

</blockquote>

**State:** `scanUpdateOn` (bool, default false — drives `useScan`), `connected`/`latency`/`robotState` (from the page's own inline WS, see above — `robotState` shape: `{x, y, theta, battery: 78 /* hardcoded */, status}`), `maxLinearSpeed`/`maxAngularSpeed` (seeded from `localDb.getRobot()` on mount, clamped to 0.1–0.8 / 0.1–1.0 even if the stored value is out of range), `linearVel`/`angularVel` (the currently-commanded velocity), `keysPressed` (map of `w/a/s/d/ArrowUp/ArrowDown/ArrowLeft/ArrowRight` → bool), `liftLevel` (0–100), `isLifting` (`'raising'|'lowering'|null`), `isDragging`/`joystickPos` (joystick drag state).

**Teleop transmit loop** — a `setInterval(100)` (10 Hz), independent of input source: each tick, if `linearVel !== 0 || angularVel !== 0`, call `sendVelocity(linearVel, angularVel)` and set `wasDrivingRef.current = true`; else if `wasDrivingRef.current` was true, send exactly one `(0, 0)` frame and flip the ref false. This is what makes the channel "quiet while idle" — nothing is sent at all unless the robot was just commanded to move or just stopped.

**Keyboard + on-screen keys → velocity** (`updateVelocityFromKeys`, shared by both input methods via `setKeyState`): `w`/`ArrowUp` → `linear = +maxLinearSpeed`; `s`/`ArrowDown` → `linear = -maxLinearSpeed`; `a`/`ArrowLeft` → `angular = +maxAngularSpeed`; `d`/`ArrowRight` → `angular = -maxAngularSpeed`. No diagonal blending for keyboard — it's a simple last-write-wins per axis. The on-screen `KeyTile` buttons call the identical `setKeyState` on press/release (mouse down/up, touch start/end, and `onMouseLeave` while pressed — so dragging off a held button releases it, same as lifting the mouse).

**Joystick math** (`handleJoystickMove`) — pointer offset from the pad's center (`rx, ry`), clamped to a max radius (`rect.width/2 - 20`). Below 25% of that radius (`mag < 0.25`) → no command (deadzone). Above it, the stick angle (`atan2(-ry, rx)`, degrees, 0°=right/90°=front/180°=left/270°=back — screen Y is inverted hence `-ry`) is bucketed into 8 sectors, each ±10° tolerance at the cardinal points and a ±35°-ish wedge at the diagonals:

| Sector | Command |
|---|---|
| FRONT (90°) | `linear = +max` |
| BACK (270°) | `linear = -max` (reverse) |
| LEFT (180°) | `angular = +max` (rotate in place) |
| RIGHT (0°) | `angular = -max` |
| FRONT-RIGHT (10°–80°) | `linear = +0.5·max`, `angular = -0.5·max` |
| FRONT-LEFT (100°–170°) | `linear = +0.5·max`, `angular = +0.5·max` |
| BACK-LEFT (190°–260°) | `linear = -0.5·max`, `angular = -0.5·max` |
| BACK-RIGHT (280°–350°) | `linear = -0.5·max`, `angular = +0.5·max` |

On release (`handleJoystickEnd`): snap the knob back to center, zero both velocities, and send the zero frame **immediately** rather than waiting for the next 10 Hz tick.

**LIDAR HUD canvas** — a `requestAnimationFrame` loop (not tied to data arrival) reading the latest scan off a ref (`scanRef.current`, kept in sync by an assignment on every render — not state, specifically to avoid the 60fps redraw depending on/fighting the ~1Hz data updates). Per frame, in order: clear; draw range rings (1 per meter up to `min(range_max, 5.0)`, labeled) + crosshairs; advance a cosmetic sweep angle by 0.04 rad/frame and draw both a radial-gradient wedge and a solid sweep line; plot every valid scan point (`r !== null && r >= range_min`) converted to screen space via `dx = -sin(a)*r, dy = -cos(a)*r` (ROS CCW-positive angle convention, robot-forward = screen-up), with per-point alpha boosted the closer the point's screen-angle is to the current sweep line; if there's no scan yet, show "WAITING FOR /scan …" centered in the dial instead; finally draw a fixed robot node (green circle, white outline) and a forward-facing triangle indicator at top-center — these two are always drawn regardless of data.

**Lift simulation** — `handleRaiseLift`/`handleLowerLift` run a `setInterval(150)` stepping `liftLevel` by ±5 until it hits 0 or 100, with a toast on start and on completion; both are no-ops while `isLifting !== null` (mutually exclusive) or already at the relevant bound.

**Layout**: `grid-cols-[1fr_400px]` at `lg`+ (HUD column flexes, control column fixed 400px). Right column, top to bottom: Drive Limit Controls (2 range sliders), Steering Interface (WASD tile grid + virtual joystick side by side, `CTRL LINK`/`CTRL OFFLINE` badge from `useVelocityCtrl`'s `connected`), Robotic Actuators (lift bar + raise/lower buttons, divider, Go Home / Dock Robot buttons — both no-ops that just show an info toast — then the E-Stop button described above).

### Step 12 — `SimpleRoutePlannerPage` (`/simple-route-planner`)

Two-column layout (`grid-cols-[1fr_360px]` at `lg`+): map canvas on the left, a telemetry/scan/navigation sidebar on the right. This is the most state-heavy page in the app — read the coordinate-system note below carefully, it's the single easiest thing to get subtly wrong in a rebuild.

<blockquote>

**Three coordinate systems are in play simultaneously, and two live entities use different ones on the same canvas:**

- **Waypoint markers** and the **AMCL localisation marker** are stored/converted through *map-frame meters* (`mapMeta.resolution`/`origin_x`/`origin_y`) → *image pixels* → *canvas pixels* (the image is drawn scaled+centered into a fixed 900×600 canvas, so there's a `scale`/`drawX`/`drawY` remap on top).
- **The live robot marker** (`robotState.x/y` from `useTelemetry`) is drawn using those numbers **directly as canvas pixel coordinates** — no conversion at all. In the current gateway, `/api/telemetry`'s `x`/`y` happen to already arrive pre-mapped into canvas-pixel space upstream; if your new backend instead sends odometry in real map-frame meters (the more conventional choice), you must add the same meters→pixels conversion used for AMCL before plotting the robot marker, or it will render in the wrong place.
- **The Nav2 global plan** (`usePlan`) is real map-frame meters and goes through the full `toCanvas()` conversion, same as AMCL.

</blockquote>

**State:** `maps`/`selectedMap` (from `localDb`), `loading`, `waypoints: Waypoint[]`, `drawMode` (bool), `missionId` (the draft `Mission` this session writes into), `isSending`/`isUploading`/`sentSuccess`, `mapImage: HTMLImageElement | null`, `mapMeta` (`{resolution, origin_x, origin_y}`, default `{0.05, -10.0, -10.0}` until `/api/map/meta` responds), `pendingWaypoint`/`mousePos` (the in-progress two-click placement, see below), `eStopActive` (mirrors the header's E-Stop state — **this page wires it correctly**, unlike Remote Controller's button: it reads `localDb.getEmergencyStops()` on mount and listens for `localdb-estop-updated`, then uses it to disable the send button and relabel it `E-STOP ACTIVE`).

**Map loading has three sources with a specific precedence, guarded by a ref (`robotMapLoadedRef`) so they can't race:**
1. On mount, `fetch('/map.pgm')` (a static file expected at the web root) → `pgmParser.ts` → `Image`. If this succeeds, `robotMapLoadedRef.current = true` and **no other map source is allowed to override `mapImage` afterward**.
2. `localDb.getMaps()`, filtered to `status ∈ {published, complete}`. If none exist yet, a default is seeded: a hand-authored inline SVG "Warehouse Floor A" (data URI, walls + 4 rooms + a center silo, literally embedded as a template string in the component) saved via `localDb.saveMap()`. Selecting a map also creates a fresh draft `Mission` (`status: 'draft'`) via `localDb.saveMission()` and stores its id.
3. User upload (`<input type="file" accept=".pgm,.png,.jpg,.jpeg">`) — `.pgm` goes through the same `pgmParser.ts`, everything else is read as a plain data URL via `FileReader`. Either way it's saved as a new `MapData` and immediately selected.

Also fetches `GET {GATEWAY_URL}/api/map/meta` once on mount for real `resolution`/`origin_x`/`origin_y` — silently keeps the hardcoded defaults if that call fails.

**Waypoint placement is two clicks, not one**: click #1 with `drawMode` on sets `pendingWaypoint` (position only); every subsequent mouse-move updates `mousePos`, which drives a live ghost-marker + direction arrow pointing from the pending point toward the cursor; click #2 computes `theta = atan2(click2.y - click1.y, click2.x - click1.x)`, finalizes the `Waypoint` (`{x, y, theta, order, label: 'WP-N'}` in **canvas pixel coordinates** — not converted to meters until send time), appends it, clears `pendingWaypoint`, and persists the full list via `localDb.saveMission({id: missionId, waypoints: updated})`. Removing a waypoint (`removeWaypoint`) re-numbers every remaining one's `order`/`label` to stay contiguous.

**Canvas render loop** (`requestAnimationFrame`, redraws every frame regardless of whether anything changed — not gated on a dirty flag) draws, in this exact order, each layer painted over the last: (1) the map image, scaled to fit and centered; (2) a faint 40px grid overlay; (3) the Nav2 global plan, if 2+ points — a wide low-alpha emerald "glow" stroke underneath a thinner animated-dash "core" stroke (`lineDashOffset` driven by `-((Date.now()/40) % 18)` so the dashes appear to flow toward the goal) — **the plan line is intentionally not connected to the user-placed waypoint markers; it's the planner's own computed path, a separate visual object**; (4) every placed waypoint (amber halo + numbered core + direction-arrow if `theta` is set); (5) the live robot marker (purple pulsing ring — radius oscillates via `14 + sin(Date.now()/150)*3` — plus heading arrow and white center dot); (6) the AMCL marker if `localisation` is present — the most elaborate element: two phase-shifted expanding "sonar ripple" rings (each cycles radius 8→38px and fades over 1.5s, gives the classic "GPS blink" look), a static accuracy halo, a heading "wedge" beam drawn with a radial gradient (Google-Maps-style directional cone, ±~25° arc), and a white-ringed blue core dot that breathes slightly (`6 + sin(Date.now()/300)*0.8` radius); (7) the pending-waypoint ghost preview, if mid-placement.

**Send flow** (`sendMission`) — no-ops if there are zero waypoints, no `missionId`, or `eStopActive`. Converts every waypoint from canvas pixels back through image pixels to real map-frame meters (inverse of the same `scale`/`drawX`/`drawY` used for rendering, using `mapMeta`), builds a `geometry_msgs/PoseStamped`-shaped object per waypoint with the orientation as a **yaw-only quaternion** (`z = sin(theta/2), w = cos(theta/2)`, `x = y = 0` — note `theta` is negated first since canvas Y-down needs flipping to ROS's Y-up convention), then `POST {GATEWAY_URL}/tasks` with a fixed envelope: `{id: 22, behavior_name: 'FollowRoute', task_id: missionId, note, poses}`. Error handling is deliberately three-way: a 503 response shows the gateway's own detail message (interpreted as "hive/nav2 not ready"); other non-OK statuses show `Gateway error {status}: {detail}`; a caught `TypeError` mentioning "fetch" (i.e. the request never reached a server at all) shows a distinct "Cannot reach gateway at {url} — is it running?" message rather than a generic failure.

**Scan Observation panel** — same default-off `useScan(scanUpdateOn)` toggle pattern as Remote Controller, but a simpler polar-plot canvas (not a full HUD): background fill, 4 concentric ring guides at 25/50/75/100% of `range_max`, crosshairs, then every valid beam plotted as a 2×2px dot at `(cos(angle)*r*scale, -sin(angle)*r*scale)` from center, plus a small green dot for the robot itself at dead-center. Below it: derived stats (valid/total beam count, `frame_id`, closest/farthest valid range) or a "Waiting for /scan data…" placeholder.

### Step 13 — Production build

`vite build` → static `dist/`. Serve with any static file server (this app used nginx with SPA fallback — `try_files $uri /index.html` — since `react-router-dom`'s `BrowserRouter` needs every path to resolve to `index.html` client-side). Content-hash your assets (Vite does this by default) and cache them aggressively (`Cache-Control: public, max-age=31536000, immutable`); don't cache `index.html` itself. Set `VITE_GATEWAY_URL` at build time to point at whatever backend you land on.

---

## 5. Non-obvious behaviors worth preserving

These are easy to lose in a rebuild because they're not visually obvious from a screenshot:

- **Deadman logic lives on both ends** — the client sends a final zero velocity on release, but the *real* safety net is a server-side timeout. Don't build a teleop client that assumes "stop sending = stops moving" without a server-side watchdog.
- **Scan streaming is opt-in everywhere it appears**, defaulting to off. This was a deliberate performance fix (building a LIDAR frame is expensive) — don't regress it to "always stream" for convenience.
- **The E-Stop badge in the header updates via a window `CustomEvent`, not polling or prop drilling.** Any component anywhere in the tree can dispatch `localdb-estop-updated` and the header (and any other listener) picks it up same-tick. Keep this pattern if you keep the header global; it's simpler than lifting state to a context for something this infrequent.
- **All three WebSocket-driven pages independently reconnect with the same exponential-backoff shape** (2 s → ×1.5 → capped 10 s). If you centralize the hooks in migration, keep the backoff — don't hammer a struggling backend with instant reconnects.
- **Rate limiting on login is client-side only** (5 attempts / 60 s → 30 s lockout) — this is UX, not security. If you wire real auth, this belongs server-side too.
- **`RemoteControllerPage` doesn't use the shared `useTelemetry` hook** — it has its own inline WebSocket + a custom `'ping'`/`'pong'` text-frame latency probe found nowhere else in the app. See Step 11's callout for the full detail. Decide deliberately whether to unify it with the shared hook (probably yes) or keep it special-cased.
- **`RemoteControllerPage`'s "EMERGENCY STOP" button doesn't touch the real E-Stop system** — no `localDb` write, no `localdb-estop-updated` event, so it's invisible to the header badge, the Emergency Stop page's log, and the Route Planner's dispatch guard. `SimpleRoutePlannerPage`'s E-Stop integration (§Step 12) is the one that's correctly wired to the shared system — use that as the reference implementation, not the button on the controller page. See Step 11's callout.

---

## 6. Migrating the data layer (§Step 3) to a real backend

`localDb`'s function signatures **are** your API contract — that's the point of the repository pattern here. To swap IndexedDB for a real backend:

1. Keep every exported function's name and signature identical (`getRobot(): Promise<Robot | null>`, `saveMission(data: Partial<Mission>): Promise<Mission>`, etc.).
2. Replace each function body with a `fetch()` call to your new API instead of `idb` calls.
3. Every page, hook, and component that currently imports `localDb` needs zero changes.
4. Decide what happens to the auto-seeded defaults (`getRobot()` inventing a robot record, `getSensors()` inventing 6 sensors) — that's demo/first-run behavior you may or may not want server-side.
5. Replace `useAuth.ts`'s stub with real session handling (it currently has no real `signIn`/`signUp` logic at all — every call trivially succeeds).

---

## 7. What's tightly coupled vs. freely portable

**Freely portable as-is** (no backend assumptions): design tokens, global CSS/animation system, the entire `components/ui` kit, `Toast`, `App.tsx`/routing shell, `LoginPage`'s UI (behind real auth), `AppStorePage` in full.

**Coupled to the current gateway, needs a contract match or a rewrite** (§4's table is the spec to satisfy): the five WebSocket hooks, `Header`'s `/health` poll, `RemoteControllerPage`'s teleop send loop, `SimpleRoutePlannerPage`'s map-fetch + task-dispatch calls.

**Coupled to IndexedDB specifically, portable via §6**: everything routed through `localDb` — `DashboardPage`'s config tab, `EmergencyStopPage`'s history, `SimpleRoutePlannerPage`'s saved maps.
