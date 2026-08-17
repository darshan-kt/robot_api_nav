# Real robot integration

The concrete "what do I edit, what do I run" checklist for moving `robotstore`
off `turtlebot_sim` onto real hardware. Rationale, safety checklist, and
network/security concerns live in
[aws_migration_execution.md](aws_migration_execution.md) §4 — read that once
before the first real drive. This doc is just the env + Makefile diff.

## Where things run changes; how you invoke them doesn't

| | Today (sim) | Real robot |
|---|---|---|
| `robotstore` runs on | your laptop | the robot's own onboard compute (e.g. Raspberry Pi 5) |
| Sensors come from | `turtlebot_sim` (Gazebo) | real LIDAR / wheel odometry / camera drivers |
| Commands | same `Makefile.aws` targets | same `Makefile.aws` targets, run on the robot's SBC instead |

AWS side (`hive_api`, `appstore`, `mqtt-broker`) doesn't change at all —
`robotstore` dials out to the same broker either way, it doesn't know or care
whether the topics it's bridging came from Gazebo or real hardware.

## `.env.robot` — edit on the robot's compute

Same file, same fields as the sim setup — only the values move from
placeholder/anonymous to real:

```bash
ROBOT_MQTT_HOST=13.51.74.241     # unchanged — still the AWS Elastic IP
ROBOT_MQTT_PORT=8883             # was 1883 (plain) — switch once the broker
                                  # has a TLS listener, see §2.4 below
MQTT_USERNAME=<real value>       # must match .env.aws on the AWS side EXACTLY
MQTT_PASSWORD=<real value>       # must match .env.aws on the AWS side EXACTLY
ROBOT_ID=robot-1                 # must match ROBOT_ID in .env.aws EXACTLY —
                                  # this is the MQTT topic namespace the two
                                  # sides rendezvous on; a mismatch doesn't
                                  # error, it just means silent radio silence
```

## `.env.aws` — edit on the EC2 side

Only the auth values need to match what you just put in `.env.robot`:

```bash
MQTT_USERNAME=<same value as .env.robot>
MQTT_PASSWORD=<same value as .env.robot>
```

`CORS_ALLOWED_ORIGINS` and `VITE_GATEWAY_URL` stay whatever you already have
them set to — those are about the browser↔gateway leg and don't change based
on which robot is talking to the broker.

## Camera topic (only if the real driver publishes elsewhere)

`CAMERA_TOPIC` defaults to `/camera/image_raw` (matches the sim's
`burger_cam` model) and today is **hardcoded directly in
`docker-compose.yml`**, not read from `.env.robot`:

```yaml
# robotstore service, environment:
- CAMERA_TOPIC=/camera/image_raw
```

If the real camera driver publishes under a different topic, edit that line
in `docker-compose.yml` directly (or parametrize it as
`${CAMERA_TOPIC:-/camera/image_raw}` and add `CAMERA_TOPIC=` to
`.env.robot` if you'd rather not touch compose per-robot).

## Make targets to run — on the robot's SBC

```bash
cd ~/appstore_mqtt

make -f Makefile.aws build_robot   # colcon build — first time, or after any
                                    # ROS 2 package change
make -f Makefile.aws run_robot     # start robotstore, pointed at the AWS broker
make -f Makefile.aws logs_robot    # confirm: "[mqtt] connected — subscribing
                                    # to cmd/task, cmd/velocity, cmd/goal,
                                    # cmd/cancel_nav, cmd/set_pose, cmd/webrtc_offer"
```

No more `make run_sim` (`turtlebot_mcp_ros2/`) — that was only ever the
stand-in for hardware.

**If the robot's compute is ARM** (Raspberry Pi 5) rather than the `amd64`
the sim ran on, set `ARCH_TAG` explicitly — `docker-compose.yml` already
supports it, it just hasn't been exercised outside `amd64` yet:

```bash
ARCH_TAG=arm64 make -f Makefile.aws build_robot
ARCH_TAG=arm64 make -f Makefile.aws run_robot
```

**AWS side doesn't need re-running** for any of the above — `aws_build` /
`aws_run` stay exactly what they already are, only re-run those if you change
`.env.aws`'s `MQTT_USERNAME`/`MQTT_PASSWORD`.

## Before the first real drive

Getting `.env.robot`/`.env.aws` filled in and `run_robot` connected only
means the robot is *reachable* — not that it's *safe* to command yet:

- Broker still anonymous/plain MQTT until you set the values above **and**
  actually enable auth + TLS on the broker itself (`.env` values alone don't
  turn it on — see README's "Broker authentication" section).
- EC2 security group's MQTT rule is scoped to your home IP by default; a
  roaming robot can't reach it until that's widened (with real broker auth as
  the actual gatekeeper at that point).
- Re-check `TASK_ACK_TIMEOUT_S` / `GOAL_ACK_TIMEOUT_S` / `CANCEL_ACK_TIMEOUT_S`
  (`backend/hive_api_gateway/app/config.py`) and the teleop watchdogs against
  real measured latency — same-network-as-your-laptop sim testing doesn't
  represent it.
- Run the physical checks before anything with mass and momentum moves
  unsupervised: e-stop button, MQTT-link-drops-mid-motion, browser-tab-closes-
  mid-drive.

Full detail on all of the above: `aws_migration_execution.md` §4.
