# Hive Robot — Docker Setup & Startup Guide

---

## Architecture Overview

```
┌─────────────────────────────────┐   ┌──────────────────────────────┐
│       hive_live_robot_store     │   │         charlie_nav          │
│                                 │   │                              │
│  ┌─────────┐   ┌─────────────┐  │   │  ┌────────┐  ┌───────────┐  │
│  │   API   │   │  RobotStore │  │   │  │  NAV   │  │   AUTO    │  │
│  │ Gateway │   │    (BT)     │  │   │  │  +SLAM │  │ Localizer │  │
│  └─────────┘   └─────────────┘  │   │  └────────┘  └───────────┘  │
└─────────────────────────────────┘   └──────────────────────────────┘
```

| Container | Repo | Responsibility |
|-----------|------|----------------|
| API Gateway | `hive_live_robot_store` | HTTP → ROS 2 bridge (port 1717) |
| RobotStore (BT) | `hive_live_robot_store` | Behavior tree execution |
| Nav + SLAM | `charlie_nav` | Navigation stack and mapping |
| Auto Localizer | `charlie_nav` | Automatic localization |

---

## Repositories

| Repo | Contains |
|------|----------|
| `hive_live_robot_store` | API Gateway + RobotStore (BT) |
| `charlie_nav` | Nav + SLAM + Auto Localizer |

---

## Build

### hive_live_robot_store

```bash
# Build API
make run-build-api

# Build RobotStore (BT)
make run-build-robotstore
```

### charlie_nav

```bash
make run-build
```

---

## Run

### hive_live_robot_store

```bash
# Start API Gateway
make run-api

# Start RobotStore (BT)
make run-robotstore
```

### charlie_nav

```bash
# Start Nav + SLAM
make run-dev

# Start Auto Localizer
make run-auto
```

---

## Startup Order

Always start in this order to avoid dependency issues:

```
1. make run-dev          ← Nav + SLAM         (charlie_nav)
2. make run-auto         ← Auto Localizer     (charlie_nav)
3. make run-robotstore   ← RobotStore (BT)    (hive_live_robot_store)
4. make run-api          ← API Gateway        (hive_live_robot_store)
```

---

## Quick Reference

```bash
# ── charlie_nav ───────────────────────────────
make run-build      # Build Nav + SLAM
make run-dev        # Run Nav + SLAM
make run-auto       # Run Auto Localizer

# ── hive_live_robot_store ─────────────────────
make run-build-api          # Build API
make run-build-robotstore   # Build RobotStore (BT)
make run-api                # Run API Gateway
make run-robotstore         # Run RobotStore (BT)
```