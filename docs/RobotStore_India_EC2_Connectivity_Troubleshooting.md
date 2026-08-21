# RobotStore --- India Robot ↔ Europe AWS EC2 Connectivity Troubleshooting

## 1. Overview

This document records the complete troubleshooting process used to
connect:

-   A **ROS 2 robot located in India**
-   An **AWS EC2 instance located in Europe**
-   A **RobotStore frontend/UI**
-   A **FastAPI/WebSocket backend**
-   A **HiveMQ MQTT broker**
-   A **LiDAR publishing ROS 2 `/scan` data**

The final working architecture is:

``` text
                         INTERNET
              ┌───────────────────────────┐
              │                           │
              │                           │
       🇮🇳 INDIA ROBOT                🇮🇳 INDIA UI
              │                           │
              │ MQTT :1883               │ WebSocket :1717
              │                           │
              ▼                           ▼
        ┌────────────────────────────────────────┐
        │         🇪🇺 AWS EC2 — Europe           │
        │                                        │
        │  HiveMQ Broker       :1883             │
        │  RobotStore API      :1717             │
        │  Frontend            :5174             │
        │                                        │
        └────────────────────────────────────────┘
```

The Denmark UI was initially working because the AWS Security Group
allowed only the Denmark public IP. The India robot and India UI were
therefore blocked.

------------------------------------------------------------------------

# 2. Initial EC2 Docker Architecture

The EC2 instance was running:

``` text
CONTAINER ID   IMAGE                     PORTS
6dd357a4d7e4   hive_api-api-arm         0.0.0.0:1717->1717/tcp
3306b434e7c4   robot_appstore-arm       0.0.0.0:5174->5174/tcp
c7adf9db68d2   hivemq/hivemq-ce:latest  0.0.0.0:1883->1883/tcp
```

Therefore:

  Service            EC2 Port Purpose
  ---------------- ---------- --------------------
  RobotStore API         1717 REST/WebSocket API
  Frontend               5174 Web UI
  HiveMQ                 1883 MQTT broker

The robot was running:

``` text
robotstore_cont-run-arm
```

with ROS 2 and the MQTT bridge inside the container.

------------------------------------------------------------------------

# 3. Problem 1 --- Frontend Worked in Denmark but Not India

## Symptom

The frontend URL was:

``` text
http://13.51.74.241:5174
```

From the Denmark machine:

``` bash
curl -I http://13.51.74.241:5174
```

returned:

``` text
HTTP/1.1 200 OK
Server: nginx/1.27.5
Content-Type: text/html
```

Therefore the frontend itself was healthy.

From India, however, connectivity was initially failing.

## Root Cause

The AWS Security Group contained:

``` text
5174 → 87.52.109.227/32
```

This allowed only the Denmark public IP.

The `/32` notation means exactly one IPv4 address.

Therefore:

``` text
🇩🇰 Denmark
87.52.109.227
        │
        │ allowed
        ▼
EC2 :5174

🇮🇳 India
different public IP
        │
        │ blocked
        ▼
EC2 :5174
```

## Fix

The frontend rule was changed to:

``` text
5174 → 0.0.0.0/0
```

This allowed IPv4 traffic to the frontend from anywhere.

------------------------------------------------------------------------

# 4. Problem 2 --- MQTT Robot Connection Failed

## Robot MQTT Configuration

The robot log showed:

``` text
[hive_mqtt_bridge]: [mqtt] connecting to 13.51.74.241:1883 as robot_id=robot-1 ...
```

The bridge subscribed to:

``` text
/amcl_pose
/plan
/global_costmap/costmap
/scan
/odom
```

However, initially there was no:

``` text
[mqtt] connected
```

## Initial Security Group Rule

MQTT was restricted to:

``` text
1883 → 87.52.109.227/32
```

Again, this allowed only the Denmark public IP.

The robot was in India, so its traffic was blocked.

## Connectivity Test

From the robot:

``` bash
timeout 5 bash -c '</dev/tcp/13.51.74.241/1883' && echo "MQTT OPEN" || echo "MQTT BLOCKED"
```

Initially:

``` text
MQTT BLOCKED
```

This confirmed that the robot could not establish a TCP connection to
the EC2 MQTT port.

## Fix

For testing, the AWS Security Group rule was changed to:

``` text
1883 → 0.0.0.0/0
```

After the change, the same test returned:

``` text
MQTT OPEN
```

## MQTT Application-Level Verification

The robot logs then showed:

``` text
[mqtt] connected — subscribing to cmd/task, cmd/velocity, cmd/goal,
cmd/cancel_nav, cmd/set_pose, cmd/webrtc_offer
```

This confirmed that:

1.  TCP connectivity worked.
2.  HiveMQ was reachable.
3.  The MQTT client successfully authenticated/connected according to
    its configured behavior.
4.  MQTT subscriptions were successfully established.

The logs also showed:

``` text
[mqtt] disconnected (reason=Unspecified error) — paho will auto-reconnect
```

followed by:

``` text
[mqtt] connected
```

This confirmed that the Paho MQTT client was successfully
auto-reconnecting.

------------------------------------------------------------------------

# 5. Problem 3 --- LiDAR `/scan`

The robot runs ROS 2 LiDAR publishing:

``` text
/scan
```

The MQTT bridge explicitly subscribed to:

``` text
/scan
```

The ROS 2 pipeline should therefore be:

``` text
LiDAR
  ↓
ROS 2 driver
  ↓
/scan
  ↓
hive_mqtt_bridge
  ↓
MQTT
  ↓
HiveMQ
  ↓
EC2 applications/UI
```

## Recommended ROS 2 Verification

Enter the robot container:

``` bash
docker exec -it robotstore_cont-run-arm bash
```

Check that `/scan` exists:

``` bash
ros2 topic list | grep scan
```

Check the topic:

``` bash
ros2 topic info /scan
```

Expected type:

``` text
sensor_msgs/msg/LaserScan
```

Check publishing frequency:

``` bash
ros2 topic hz /scan
```

Inspect one message:

``` bash
ros2 topic echo /scan --once
```

A valid message should contain fields such as:

``` text
header:
  frame_id: ...
angle_min: ...
angle_max: ...
angle_increment: ...
range_min: ...
range_max: ...
ranges:
  - ...
```

These checks distinguish a LiDAR/ROS problem from an MQTT/network
problem.

------------------------------------------------------------------------

# 6. Problem 4 --- India UI Could Not See LiDAR

After MQTT connectivity was fixed, the Denmark UI could see LiDAR data
but the India UI could not.

This was an important diagnostic distinction:

-   Robot → MQTT was working.
-   Denmark UI → API was working.
-   India UI → API/WebSocket was failing.

## Browser Error

Firefox on the India machine reported:

``` text
Firefox can’t establish a connection to the server at
ws://13.51.74.241:1717/api/telemetry
```

and:

``` text
ws://13.51.74.241:1717/api/scan
```

and:

``` text
ws://13.51.74.241:1717/api/velocity_ctrl
```

This immediately identified that the UI was using **WebSockets on port
1717**.

## Root Cause

The AWS Security Group originally contained:

``` text
1717 → 87.52.109.227/32
```

Therefore:

``` text
🇩🇰 Denmark UI
        │
        │ WebSocket :1717
        ▼
      EC2
        │
        │ allowed
        ▼
      API

🇮🇳 India UI
        │
        │ WebSocket :1717
        ▼
      EC2
        │
        │ blocked
        X
```

The backend Docker container itself was healthy because:

``` text
0.0.0.0:1717->1717/tcp
```

was already published.

## Fix

The Security Group rule was changed to:

``` text
1717 → 0.0.0.0/0
```

After that, the India UI worked and could receive the LiDAR data.

------------------------------------------------------------------------

# 7. Final Working Security Group Configuration

The final tested configuration was:

    Port Service                    Source
  ------ -------------------------- -------------------------------------------------
    1717 RobotStore API/WebSocket   `0.0.0.0/0`
    1883 MQTT / HiveMQ              `0.0.0.0/0`
    5174 Frontend                   `0.0.0.0/0`
      22 SSH                        **Should be restricted to administrator IP(s)**

## IMPORTANT --- SSH Security

During the troubleshooting process, the SSH rule was shown as:

``` text
22 → 0.0.0.0/0
```

This is **not recommended**.

SSH should normally remain restricted, for example:

``` text
22 → <trusted-public-IP>/32
```

If the administrator's public IP changes, update the rule rather than
exposing SSH globally.

Do not leave:

``` text
22 → 0.0.0.0/0
```

unless there is a deliberate, secured reason to do so.

------------------------------------------------------------------------

# 8. Final End-to-End Architecture

The complete working data flow is:

``` text
                         🇮🇳 INDIA
┌──────────────────────────────────────────────────┐
│                                                  │
│                    ROBOT                         │
│                                                  │
│   LiDAR                                          │
│     │                                            │
│     ▼                                            │
│   ROS 2                                          │
│     │                                            │
│     ├────────────── /scan                        │
│     │                                            │
│     ▼                                            │
│ hive_mqtt_bridge                                 │
│     │                                            │
│     │ MQTT :1883                                 │
└─────┼────────────────────────────────────────────┘
      │
      │ Internet
      │
      ▼
                         🇪🇺 EUROPE
┌──────────────────────────────────────────────────┐
│                    AWS EC2                       │
│                                                  │
│                 HiveMQ :1883                     │
│                     │                            │
│                     ▼                            │
│              RobotStore Backend                  │
│                    :1717                         │
│                     │                            │
│          ┌──────────┴──────────┐                 │
│          │                     │                 │
│      /api/scan           /api/telemetry          │
│          │                     │                 │
│          └──────────┬──────────┘                 │
│                     │                            │
│                Frontend :5174                    │
└─────────────────────┼────────────────────────────┘
                      │
                      │ Internet
                      ▼
                 🇮🇳 INDIA UI
```

------------------------------------------------------------------------

# 9. Diagnostic Method That Worked

The key lesson was to troubleshoot layer by layer rather than changing
the application.

## Layer 1 --- Application

Check whether the service is actually running:

``` bash
docker ps
```

For example:

``` text
0.0.0.0:1717->1717/tcp
0.0.0.0:5174->5174/tcp
0.0.0.0:1883->1883/tcp
```

## Layer 2 --- Local Service

Check listening ports:

``` bash
sudo ss -lntp | grep 1883
sudo ss -lntp | grep 1717
sudo ss -lntp | grep 5174
```

## Layer 3 --- AWS Security Group

Check whether the required source IP is allowed.

A rule such as:

``` text
87.52.109.227/32
```

means only that specific IP can connect.

A rule such as:

``` text
0.0.0.0/0
```

allows all IPv4 addresses.

## Layer 4 --- TCP Connectivity

From the remote machine:

``` bash
timeout 5 bash -c '</dev/tcp/<EC2-IP>/<PORT>' && echo "OPEN" || echo "BLOCKED"
```

This was especially useful for MQTT:

``` bash
timeout 5 bash -c '</dev/tcp/13.51.74.241/1883' && echo "MQTT OPEN" || echo "MQTT BLOCKED"
```

## Layer 5 --- Application Protocol

TCP being open does not necessarily mean the application works.

For MQTT, verify:

``` text
[mqtt] connected
```

For WebSockets, inspect the browser:

``` text
F12 → Network → WS
F12 → Console
```

## Layer 6 --- Data Flow

Finally verify the actual data:

``` text
LiDAR
 ↓
/scan
 ↓
MQTT
 ↓
HiveMQ
 ↓
Backend
 ↓
WebSocket
 ↓
UI
```

This prevents confusing:

-   network connectivity,
-   MQTT connectivity,
-   ROS topic availability,
-   WebSocket connectivity,
-   and UI rendering

as the same problem.

------------------------------------------------------------------------

# 10. Useful Commands

## EC2

### List running containers

``` bash
docker ps
```

### Check MQTT logs

``` bash
docker logs -f hive_mqtt_broker-arm
```

### Check API logs

``` bash
docker logs -f hive_api-api-arm
```

### Check frontend logs

``` bash
docker logs -f robot_appstore-arm
```

### Check listening ports

``` bash
sudo ss -lntp
```

### Check MQTT port

``` bash
sudo ss -lntp | grep 1883
```

------------------------------------------------------------------------

# 11. Robot

### Enter RobotStore container

``` bash
docker exec -it robotstore_cont-run-arm bash
```

### Check ROS topics

``` bash
ros2 topic list
```

### Check `/scan`

``` bash
ros2 topic info /scan
```

### Check LiDAR frequency

``` bash
ros2 topic hz /scan
```

### Inspect LiDAR data

``` bash
ros2 topic echo /scan --once
```

### Check MQTT connectivity

``` bash
timeout 5 bash -c '</dev/tcp/13.51.74.241/1883' && echo "MQTT OPEN" || echo "MQTT BLOCKED"
```

### Check RobotStore logs

``` bash
docker logs -f robotstore_cont-run-arm
```

------------------------------------------------------------------------

# 12. Browser Debugging

When the UI works on one network but not another, always check browser
WebSocket errors.

Firefox/Chrome:

``` text
F12
 ├── Console
 └── Network
      └── WS
```

In this case the critical discovery was:

``` text
ws://13.51.74.241:1717/api/scan
ws://13.51.74.241:1717/api/telemetry
ws://13.51.74.241:1717/api/velocity_ctrl
```

That immediately identified **port 1717** as the required network path
for the UI.

------------------------------------------------------------------------

# 13. Troubleshooting Decision Tree

``` text
UI cannot see LiDAR
        │
        ▼
Does UI load?
        │
    ┌───┴───┐
    NO      YES
    │        │
    ▼        ▼
Check 5174   Check browser console
             │
             ▼
        WebSocket error?
             │
             ▼
       Which port?
             │
             └── :1717
                    │
                    ▼
          Check Security Group
                    │
                    ▼
              Test TCP 1717
                    │
                    ▼
              API reachable?
                    │
                    ▼
          Check WebSocket endpoint
                    │
                    ▼
              Check data flow
                    │
                    ▼
              /scan available?
                    │
                    ▼
             MQTT connected?
```

For robot MQTT problems:

``` text
Robot MQTT not connected
        │
        ▼
Check robot logs
        │
        ▼
"connecting to ...:1883"?
        │
        ▼
Test TCP 1883
        │
        ├── BLOCKED → Security Group / firewall / routing
        │
        └── OPEN
             │
             ▼
       Check HiveMQ
             │
             ▼
       "[mqtt] connected"
             │
             ▼
       Check MQTT topics/data
```

------------------------------------------------------------------------

# 14. Production Security Recommendations

The final troubleshooting configuration opened:

``` text
1717 → 0.0.0.0/0
1883 → 0.0.0.0/0
5174 → 0.0.0.0/0
```

This is useful for diagnosis and initial deployment, but it should not
automatically be considered a production security configuration.

## Recommended future architecture

Use:

``` text
Internet
   │
   ▼
HTTPS / WSS
443
   │
   ▼
Nginx / Reverse Proxy
   │
   ├── Frontend
   │
   ├── API/WebSockets
   │
   └── MQTT/WebSocket gateway
```

Prefer:

``` text
443 → public
22  → trusted administrator IP only
1717 → private
1883 → private or tightly restricted
5174 → preferably served through 443
```

For MQTT, use:

-   MQTT authentication
-   TLS
-   preferably MQTT over TLS (`8883`) or secure WebSockets where
    appropriate
-   unique robot credentials
-   topic-level authorization
-   no anonymous public publishing/subscribing

For the robot control WebSocket:

``` text
/api/velocity_ctrl
```

authentication and authorization are particularly important because this
endpoint may control robot motion.

------------------------------------------------------------------------

# 15. Final Lessons

### Lesson 1 --- A working service does not mean it is reachable

Docker can show:

``` text
0.0.0.0:1717->1717/tcp
```

while AWS Security Groups still block external traffic.

### Lesson 2 --- `/32` is a single IP

``` text
87.52.109.227/32
```

does not mean Denmark.

It means exactly one IPv4 address.

### Lesson 3 --- Different application components use different ports

In this system:

``` text
5174 → Frontend
1717 → API/WebSockets
1883 → MQTT
```

Fixing one does not automatically fix the others.

### Lesson 4 --- Browser console errors are extremely valuable

The India browser explicitly revealed:

``` text
ws://13.51.74.241:1717/api/scan
```

which led directly to the blocked `1717` Security Group rule.

### Lesson 5 --- Test connectivity from the actual failing machine

Testing from Denmark could not prove that India could connect.

The most useful tests were performed directly from the Indian robot:

``` bash
timeout 5 bash -c '</dev/tcp/13.51.74.241/1883'
```

### Lesson 6 --- Validate the entire pipeline

The final validation should always cover:

``` text
Sensor
  ↓
ROS 2
  ↓
Bridge
  ↓
Network
  ↓
MQTT
  ↓
Backend
  ↓
WebSocket
  ↓
UI
```

Only when every layer is confirmed can the system be considered
end-to-end operational.

------------------------------------------------------------------------

# 16. Final Working Status

At the end of troubleshooting:

``` text
🇮🇳 Robot
    │
    ├── ROS 2 /scan                  ✅
    │
    ├── MQTT connection              ✅
    │
    └── Internet → EC2               ✅

🇪🇺 AWS EC2
    │
    ├── HiveMQ :1883                 ✅
    ├── RobotStore API :1717         ✅
    └── Frontend :5174               ✅

🇮🇳 India UI
    │
    ├── Frontend                      ✅
    ├── WebSocket /api/scan           ✅
    ├── WebSocket /api/telemetry      ✅
    ├── WebSocket /api/velocity_ctrl  ✅
    └── LiDAR visualization           ✅
```

The core issue was **AWS Security Group source-IP restrictions**, not
ROS 2, LiDAR, MQTT, Docker, or the frontend application.
