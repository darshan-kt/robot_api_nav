# AWS Migration — Execution Log & Runbook

What we actually did to split this stack across AWS (frontend + gateway +
broker) and the robot (ROS 2 + Nav2 + sim/real hardware), the configuration
that makes it work, how to run it from scratch, and what's still needed
before a real robot (not `turtlebot_sim`) goes on the other end.

Companion to the main [README.md](README.md)'s "☁️ Deploying to AWS"
section — that section explains the *design*; this document is the
*execution record* plus a condensed runbook.

---

## 1. Architecture (what ended up where)

```
┌─────────────────────────── AWS EC2 (eu-north-1, t3.micro) ───────────────────────────┐
│  Elastic IP: 13.51.74.241  (was a plain public IP, changed once, now stable)          │
│                                                                                         │
│   ┌────────────┐      ┌────────────┐      ┌──────────────┐                           │
│   │  appstore   │ HTTP │  hive_api   │ MQTT │  mqtt-broker  │                           │
│   │ (nginx,     │◄────►│ (FastAPI    │◄────►│  (HiveMQ CE)  │                           │
│   │  React UI)  │      │  gateway)   │      │               │                           │
│   │  :5174      │      │  :1717      │      │  :1883        │                           │
│   └────────────┘      └────────────┘      └───────┬──────┘                           │
└──────────────────────────────────────────────────────┼────────────────────────────────┘
                                                          │ MQTT over the public internet
                                    ┌─────────────────────┴─────────────────────┐
                                    │           "the robot" (today: your laptop) │
                                    │                                              │
                                    │  ┌────────────┐   ┌───────────────────┐    │
                                    │  │ robotstore  │   │   turtlebot_sim     │    │
                                    │  │ (hive_mqtt_ │◄─►│   (Gazebo, ROS 2   │    │
                                    │  │  bridge +   │DDS│    DDS, same host) │    │
                                    │  │  hive_camera│   │                     │    │
                                    │  │  _bridge +  │   └───────────────────┘    │
                                    │  │  bt_runner) │                              │
                                    │  └────────────┘                              │
                                    └──────────────────────────────────────────────┘
```

Nothing ROS-related runs on AWS. The only thing crossing the public
internet is MQTT (commands/telemetry) plus one WebRTC signaling exchange
per camera session — the video itself flows browser↔robot directly once
that handshake completes.

---

## 2. What we changed (in the order we hit it)

1. **`Makefile.aws`** (new file, `include`s the main `Makefile`) — split
   `make build`/`make run` into an AWS half and a robot half so one command
   never accidentally builds/starts the wrong side:
   - `aws_build` / `aws_run` / `aws_stop` / `aws_logs` / `aws_check` — AWS side
   - `build_robot` / `run_robot` / `stop_robot` / `logs_robot` — robot side
   - `run_robot` critically uses `docker compose ... up -d --no-deps robotstore`
     — without `--no-deps`, `robotstore`'s `depends_on: mqtt-broker` would
     spin up a second, unwanted **local** broker instead of using AWS's.

2. **`.env.aws` / `.env.robot`** (real files, gitignored — `.example`
   templates are tracked) — the only things that differ between the two
   sides:
   - `.env.aws`: `MQTT_USERNAME`/`PASSWORD` (blank = anonymous, dev-mode
     only), `CORS_ALLOWED_ORIGINS`, `ROBOT_ID`, `VITE_GATEWAY_URL`
   - `.env.robot`: `ROBOT_MQTT_HOST`/`PORT`, `MQTT_USERNAME`/`PASSWORD`
     (must match `.env.aws` exactly), `ROBOT_ID` (must match exactly)

3. **`docker-compose.yml`** parameterized so unset vars fall back to the
   original single-host defaults (nothing breaks for local dev):
   `robotstore`'s `MQTT_HOST`/`MQTT_PORT` read `ROBOT_MQTT_HOST`/
   `ROBOT_MQTT_PORT` (deliberately different var names from `hive_api`'s,
   which stays hardcoded to the co-located `mqtt-broker` — one side is
   always local, one might not be).

4. **`VITE_GATEWAY_URL` build-time wiring** (the first real bug we hit) —
   Vite bakes `import.meta.env.VITE_*` into the static JS bundle **at
   build time**; there is no runtime env var for a built Vite app. Added:
   - `ARG`/`ENV VITE_GATEWAY_URL` in `docker/Dockerfile`
   - `build.args.VITE_GATEWAY_URL` in `docker-compose.yml`'s `appstore`
     service, sourced from `.env.aws`

   Symptom when this is wrong: the UI loads fine, but every API call
   silently tries to reach `localhost` on the *visitor's own machine*.
   **Changing this always requires `aws_build` again, never just a
   restart.**

5. **`CORS_ALLOWED_ORIGINS`** (the second real bug) — `.env.aws.example`
   ships a placeholder domain; if it's never overwritten with the real
   frontend origin, the browser's CORS preflight is rejected with
   `400 Disallowed CORS origin`, and every `fetch()` call fails with the
   generic, misleading `TypeError: Failed to fetch` — which looks
   identical to "server unreachable" from the frontend's error handling.
   **Must be `http://<ec2-ip-or-domain>:5174` exactly** (scheme + host +
   port, no trailing slash).

6. **EC2 security group** — had to open four inbound TCP ports, each as
   its own rule (editing an existing rule in place *replaces* it rather
   than adding a new one — we did this by accident and briefly locked
   ourselves out of SSH):
   | Port | For |
   |---|---|
   | 22 | SSH |
   | 1883 | MQTT broker |
   | 1717 | `hive_api` gateway (REST/WS, called directly from the browser) |
   | 5174 | frontend UI |

   All four scoped to a specific source IP ("My IP") rather than
   `0.0.0.0/0` — tighter, but means **the rule needs updating if that IP
   ever changes** (see §7 below — this bit us once already).

7. **Elastic IP** — the instance's plain public IP changed the moment we
   associated an Elastic IP, which silently broke everything already
   pointed at the old address (all four ports "reachable" one minute,
   totally dark the next — looked like the instance had died, it hadn't).
   Now fixed: `13.51.74.241` will not change again on stop/start/reboot.
   Every place the IP is baked in had to be updated once:
   `.env.robot` (`ROBOT_MQTT_HOST`), `.env.aws` (`VITE_GATEWAY_URL`,
   `CORS_ALLOWED_ORIGINS`) — followed by an `aws_build` (Vite bake) and
   `aws_run`/`run_robot` restart.

8. **WebRTC signaling rearchitected onto MQTT** (the last real bug) —
   `POST /webrtc/offer` used to have `hive_api` make a **direct outbound
   HTTP call to the robot** (`CAMERA_BRIDGE_URL=http://host.docker.internal:8766`).
   That only ever worked because both processes shared a host; once
   `hive_api` moved to AWS, that address just pointed at the AWS box
   itself, which has no camera bridge on it — every offer failed with
   `503 camera bridge unreachable`. Fixed by adding a new MQTT hop, same
   shape as `/nav_goal`/`/cancel_nav`/`/set_pose`:

   ```
   browser → POST /webrtc/offer → hive_api
           → publishes cmd/webrtc_offer over MQTT
           → hive_mqtt_bridge (on the robot) relays it to
             hive_camera_bridge via plain localhost HTTP
           → publishes webrtc/answer back over MQTT
           → hive_api resolves the pending request, returns the answer
   ```

   `CAMERA_BRIDGE_URL` and the `extra_hosts: host.docker.internal:host-gateway`
   mapping it needed are gone — nothing to configure anymore. The actual
   video (RTP) still never touches MQTT or the gateway; only the one-time
   SDP text exchange does. This is why the camera feed didn't work the
   first time you tried it after the AWS split, and does now.

9. **Redundant container port conflict** — a leftover `robotstore-build`
   container (started separately, its entrypoint both builds *and then
   launches* the full stack) was still running and, since `robotstore`
   uses `network_mode: host`, was holding host port 8766 — the *correct*
   `robotstore` container's camera bridge failed to bind on restart with
   `address already in use`. Stopped the stray container; not something
   to leave running long-term if you spin it up again.

---

## 3. Execution — running it from scratch

### A. AWS side (on the EC2 instance)

```bash
cd aws
ssh -i my_key.pem ubuntu@13.51.74.241
cd ~/robot_api_nav

# first time, or after any code/Dockerfile change:
make -f Makefile.aws aws_build

# start appstore + mqtt-broker + hive_api:
make -f Makefile.aws aws_run

# verify:
make -f Makefile.aws aws_check
#  -> {"ros_ready":true,"robot_alive":true,"mqtt_connected":true,...}

# logs / stop, as needed:
make -f Makefile.aws aws_logs
make -f Makefile.aws aws_stop
```

`aws_build`/`aws_run` both require `.env.aws` to exist (copy from
`.env.aws.example` and fill in — see §2.2 above for what's in it). Missing
the file fails fast with a clear message rather than silently using wrong
defaults.

### B. Robot side (today: your laptop, running `turtlebot_sim`)

Two independent things need to be running — `robotstore` (the bridge) and
the simulator — neither depends on the other's Makefile:

```bash
cd ~/appstore_mqtt

# first time, or after any ROS 2 package change:
make -f Makefile.aws build_robot

# start robotstore, pointed at the AWS broker (NOT a local one):
make -f Makefile.aws run_robot

# verify it actually reached AWS:
make -f Makefile.aws logs_robot
#  -> look for: [mqtt] connected — subscribing to cmd/task, cmd/velocity,
#               cmd/goal, cmd/cancel_nav, cmd/set_pose, cmd/webrtc_offer
```

```bash
# separately, the simulator itself:
cd ~/appstore_mqtt/turtlebot_mcp_ros2
make run_sim            # or run_sim_headless for no GUI
```

`run_robot` requires `.env.robot` (copy from `.env.robot.example`,
fill in `ROBOT_MQTT_HOST` = the AWS Elastic IP, `ROBOT_ID`/credentials
matching `.env.aws` exactly).

### C. Open the UI

```
http://13.51.74.241:5174
```

Bookmark this — it changes if the Elastic IP ever changes (it shouldn't
now, that's the point of an EIP, but if the instance is ever terminated
and recreated, a fresh EIP or re-association will need this document's §2
step 7 repeated).

### D. Smoke test

```bash
curl http://13.51.74.241:1717/health
```
Expect `ros_ready: true`, `robot_alive: true`, `mqtt_connected: true`.
Then in the UI: place a waypoint on Simple Route Planner → **SEND GOAL** →
**CANCEL NAV**; toggle the camera on Remote Controller.

---

## 4. Moving from `turtlebot_sim` to a real robot — what changes

Everything in §3 above stays the same shape — the robot dials out to the
same AWS broker either way. What's actually different:

1. **Where `robotstore` runs.** Today it's your laptop, alongside
   `turtlebot_sim`. On real hardware, `robotstore` runs on the robot's own
   onboard compute (e.g. a Raspberry Pi 5) instead — same container, same
   `make -f Makefile.aws build_robot && run_robot`, just executed on the
   robot's SBC. Check `ARCH_TAG` — `docker-compose.yml` already supports
   `ARCH_TAG=arm64` for this; the sim testing has been on `amd64`.

2. **No more Gazebo.** `/scan`, `/odom`, `/amcl_pose`,
   `/global_costmap/costmap`, `/camera/image_raw` all need to come from
   real drivers (LIDAR, wheel odometry, the real camera) instead of the
   simulated topics `turtlebot_sim` publishes today. If the real camera
   driver publishes under a different topic name, update `CAMERA_TOPIC`
   (env var, currently `/camera/image_raw` to match the sim's
   `burger_cam` model — see README Gotcha #12 on why that model choice
   mattered).

3. **Real internet uplink on the robot.** `turtlebot_sim` and your laptop
   share your home network's connection for free. A real, mobile robot
   needs its own WiFi/cellular connectivity to reach
   `13.51.74.241:1883` — plan for how it gets online before it's away
   from a known WiFi network, and expect **higher, more variable
   latency** than today's same-network test. Re-examine the ack timeouts
   (`TASK_ACK_TIMEOUT_S`, `GOAL_ACK_TIMEOUT_S`, `CANCEL_ACK_TIMEOUT_S` in
   `config.py`) and the teleop watchdogs (400ms gateway-side, 500ms
   bridge-side) against real measured latency before relying on them.

4. **Broker security — do this before, not after.** The broker currently
   runs anonymous (`HIVEMQ_ALLOW_ALL_CLIENTS=true`) on plain MQTT (1883).
   That was an acceptable shortcut for a sim test where the "robot" was
   trusted (your own laptop). A real robot represents actual physical
   consequences and money — set real `MQTT_USERNAME`/`PASSWORD` in both
   `.env.aws`/`.env.robot` (the plumbing already supports it, just unset
   today), and move to TLS on 8883 before anything with the credentials
   in the clear crosses the public internet regularly. See README's
   "Broker authentication" subsection for the concrete options (Mosquitto
   `password_file` or HiveMQ's file-RBAC extension).

5. **WebRTC media path, revisit under real network conditions.** Signaling
   is fixed (§2 step 8) regardless of sim vs. real. The actual video
   (RTP) still negotiates a direct browser↔robot path via ICE/STUN, which
   generally works when only one side is behind NAT — true for a robot on
   home WiFi, **not guaranteed** on a cellular connection or a
   restrictive network. If the picture doesn't come through even though
   signaling clearly succeeds (no more `[/webrtc/offer]` errors in
   `hive_api`'s logs), the fix is a TURN relay (e.g. `coturn`) for the
   media path specifically — not built yet, ask if the real robot's
   deployment needs it.

6. **Security group source IP.** Today's inbound rules are scoped to your
   home IP. A robot roaming outside that network can't reach 1883 through
   the current security group at all — either widen the MQTT rule's
   source (with real broker auth from item 4 as the actual gatekeeper at
   that point, not the IP restriction), or put the robot on a VPN that
   routes back to a fixed, already-allowed address.

7. **Physical safety validation.** The teleop clamps
   (`_TELEOP_MAX_LINEAR`/`_TELEOP_MAX_ANGULAR`, both gateway- and
   bridge-side) and the cmd_vel watchdogs are already in the code and
   already tested logically — but a real e-stop button, a real "MQTT link
   drops mid-motion" test, and a real "browser tab closes mid-drive" test
   should all be run physically before this steers anything with mass
   and momentum unsupervised.

### Step-by-step — bring a real robot online

The one thing worth understanding before touching any config: **the robot is
an outbound-only client.** It dials out to `13.51.74.241:1883`, same as your
laptop does today — nothing on AWS, and nothing on the public internet,
ever dials *into* the robot. That means:

- The robot does **not** need a static/public IP, a domain name, port
  forwarding, or any router/firewall configuration on whatever network it's
  on (home WiFi, phone hotspot, cellular) — outbound connections just work
  on virtually any consumer network with no setup.
- The **only** IP that matters to the running system is the one it's already
  pointed at: the AWS Elastic IP, `13.51.74.241`, in `ROBOT_MQTT_HOST`.
- The robot's *own* IP only matters for one unrelated reason: so **you** can
  SSH into its onboard compute to install/configure/run things. That's a
  one-time setup convenience, not something the robot advertises to AWS or
  anything else.

**0. Find the robot's IP** — only needed to SSH in and do the setup below.
Whatever's easiest for your hardware:
```bash
# on the robot's SBC itself, with a keyboard/monitor attached once:
hostname -I

# or from another machine on the same network:
ping raspberrypi.local          # mDNS hostname, works out of the box on
                                 # stock Raspberry Pi OS
# or check your router's DHCP client list / connected-devices page
```

**1. Install prerequisites on the robot's onboard compute** (e.g. Raspberry
Pi 5) — Docker + Docker Compose, then the repo itself:
```bash
ssh <robot-user>@<robot-ip-from-step-0>

curl -fsSL https://get.docker.com | sh      # if Docker isn't already installed
sudo usermod -aG docker $USER && newgrp docker

git clone https://github.com/darshan-kt/robot_api_nav.git ~/appstore_mqtt
cd ~/appstore_mqtt
git checkout mqtt
```

**2. Configure `.env.robot`** — on the robot, not your laptop:
```bash
cp .env.robot.example .env.robot
nano .env.robot
```
```bash
ROBOT_MQTT_HOST=13.51.74.241     # the AWS Elastic IP — the only address
                                  # that actually needs to be reachable
ROBOT_MQTT_PORT=1883             # or 8883 once broker TLS is on, see item 4 above
MQTT_USERNAME=<value>            # must match .env.aws on AWS EXACTLY
MQTT_PASSWORD=<value>            # must match .env.aws on AWS EXACTLY
ROBOT_ID=robot-1                 # must match ROBOT_ID in .env.aws EXACTLY
```

**3. Point sensor topics at real hardware, not Gazebo.** Bring up your
LIDAR, wheel odometry, and camera drivers however that hardware normally
launches (outside the scope of this repo — e.g. `rplidar_ros2` is already
vendored under `turtlebot_mcp_ros2/` if that's the LIDAR in use) so that
`/scan`, `/odom`, `/amcl_pose`, `/global_costmap/costmap` are being published
for real. If the camera driver's topic isn't `/camera/image_raw`, update
`CAMERA_TOPIC` in `docker-compose.yml`'s `robotstore` service (see item 2
above).

**4. Build and run `robotstore` on the robot:**
```bash
# if the SBC is ARM (Raspberry Pi), set this first — docker-compose.yml
# already supports it, sim testing so far has only exercised amd64:
export ARCH_TAG=arm64

make -f Makefile.aws build_robot
make -f Makefile.aws run_robot

make -f Makefile.aws logs_robot
#  -> look for: [mqtt] connected — subscribing to cmd/task, cmd/velocity,
#               cmd/goal, cmd/cancel_nav, cmd/set_pose, cmd/webrtc_offer
```
No `turtlebot_sim` step this time — real drivers are already publishing the
topics that used to come from Gazebo.

**5. Visualize and control it from AWS — from anywhere, not just the
robot's network.** Once `logs_robot` shows a connected MQTT session, open:
```
http://13.51.74.241:5174
```
from any device with internet access — your laptop, your phone, doesn't
need to be on the same WiFi as the robot. The browser only ever talks to
AWS; AWS only ever talks to the robot over the MQTT connection the robot
itself dialled out. Run the same smoke test as §3.D: `curl
http://13.51.74.241:1717/health` should show `robot_alive: true`, then place
a waypoint on Simple Route Planner → **SEND GOAL**, and toggle the camera on
Remote Controller.

---

## 5. Quick reference — what lives where

| File | Purpose |
|---|---|
| `Makefile.aws` | AWS-side and robot-side make targets |
| `.env.aws` (gitignored) | AWS-side secrets/config — copy from `.env.aws.example` |
| `.env.robot` (gitignored) | Robot-side secrets/config — copy from `.env.robot.example` |
| `docker-compose.yml` | All services, parameterized for both single-host and split deployment |
| `docker/Dockerfile` | Frontend build — note the `VITE_GATEWAY_URL` build arg |
| `backend/hive_api_gateway/` | AWS-side FastAPI gateway (no ROS 2 dependency) |
| `backend/hive_mqtt_bridge/` | Robot-side ROS 2 ↔ MQTT bridge (nav, teleop, webrtc relay) |
| `backend/hive_camera_bridge/` | Robot-side WebRTC video source |
| `turtlebot_mcp_ros2/` | Simulator — separate Makefile/compose project, unrelated to `Makefile.aws` |

For the full topic tree, endpoint list, and gotchas, see [README.md](README.md).

---

## 6. Quick setup — real robot (condensed)

Full explanation of each step above (§4) — this is just the checklist once
you already know why.

**On the robot side, modify `.env.robot`:**
```bash
ROBOT_MQTT_HOST=13.51.74.241     # the AWS Elastic IP — the only address
                                  # that actually needs to be reachable
ROBOT_MQTT_PORT=1883             # or 8883 once broker TLS is on, see item 4 above
MQTT_USERNAME=<value>            # must match .env.aws on AWS EXACTLY
MQTT_PASSWORD=<value>            # must match .env.aws on AWS EXACTLY
ROBOT_ID=robot-1
```

**On the robot side, verify these topics are actually being published:**
`/scan`, `/odom`, `/amcl_pose`, `/global_costmap/costmap`. If the camera
driver's topic isn't `/camera/image_raw`, update `CAMERA_TOPIC` in
`docker-compose.yml`'s `robotstore` service (see item 2 above) — change
whatever doesn't match before moving on.

**Final run:**
```bash
# if the SBC is ARM (Raspberry Pi), set this first — docker-compose.yml
# already supports it, sim testing so far has only exercised amd64:
export ARCH_TAG=arm64

make -f Makefile.aws build_robot
make -f Makefile.aws run_robot
```

**Smoke test, if any:**
```bash
make -f Makefile.aws logs_robot     # look for "[mqtt] connected"
curl http://13.51.74.241:1717/health   # expect robot_alive: true
```

**Run the UI, from anywhere:**
```
http://13.51.74.241:5174
```
