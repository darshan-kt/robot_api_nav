# 🚀 Nav2 MCP Server Tutorial

### Installation + Cursor Integration (ROS 2 Humble)

Welcome! This tutorial will guide you through installing and running the **Nav2 MCP Server** and connecting it to **Cursor MCP**, so you can use Cursor’s AI chat to interact with a live **ROS 2 + Nav2 system**.

By the end, you will be able to ask Cursor questions like:

✅ *“What ROS 2 nodes are running?”*
✅ *“Which planner is configured in Nav2?”*
✅ *“Find obstacles using LaserScan data.”*

---

## ✅ What You Will Learn

In this tutorial, you will:

1. Install the Nav2 MCP Server (Docker OR Python virtual environment)
2. Set up Cursor to launch the MCP server automatically
3. Verify the connection is working
4. Try example prompts to explore ROS 2 data

---

## 🧰 Prerequisites

Before starting, make sure you have:

* ✅ **Docker installed & running**
* ✅ **ROS 2 Humble installed**
* ✅ **Cursor Editor installed**
* ✅ A working **ROS 2 + Nav2 system**

  * Simulation (Gazebo) OR real robot

---

# 🛠️ Part 1 — Install the Nav2 MCP Server

You can install the MCP server in **two ways**:

✅ **Option A:** Run using Docker (**recommended**)
✅ **Option B:** Install locally using Python virtual environment

---

## ✅ Option A — Install & Run with Docker

### Step 1 — Pull the Docker Image

Pull the pre-built image from GitHub Container Registry:

```bash
docker pull ghcr.io/ajtudela/nav2_mcp_server:latest
```

---

### Step 2 — Run the MCP Server Container

Run the container using **host networking**:

> ⚠️ **Important:**
> `--net=host` is required so the container can access ROS 2 topics/services running on your host machine.

```bash
docker run -it --rm --net=host ghcr.io/ajtudela/nav2_mcp_server:latest
```

✅ If the server starts successfully, keep this terminal open.

---

## ✅ Option B — Install Locally (Python Virtual Environment)

Use this if you want to run MCP server directly from source (not Docker).

### Step 1 — Go to the MCP Server Folder

```bash
cd ~/turtlebot_ws/src/turtlebot_mcp_ros2/nav2_mcp_server
```

---

### Step 2 — Create and Activate a Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
pip install -e .
```

## or With bash file
```bash
cd ~/turtlebot_ws
./src/turtlebot_mcp_ros2/bash_scripts/ setup_nav2_mcp_server.sh
```


✅ **What this does (for students):**

* Creates an isolated Python environment for running mcp-server(`.venv/`)
* Installs required packages **only inside that environment**
* Keeps your system Python clean

> ✅ You only need to do this **once**.
> The `.venv` folder stays permanently.

---

# 🖥️ Part 2 — Install Cursor

Download Cursor here:

🔗 [https://cursor.com/download](https://cursor.com/download)

### Installation Steps (Linux)

1. Click **Download for Linux**
2. Install using your system’s installer
3. Open Cursor once to confirm it runs

---

# 🔌 Part 3 — Connect Cursor MCP to Nav2 MCP Server

Cursor uses a config file to know how to launch and communicate with MCP servers.

---

## ✅ Step 1 — Fix the MCP JSON Configuration

A common issue: the MCP config file is missing the required root object.

### Instructions

1. Open **Cursor**
2. Go to:
      **File → Preferences→ Cursor Settings→Tools & MCP**

3. If there's an error, click **Open JSON**
4. **Replace the entire file** with this:

```json
{
  "mcpServers": {
    "nav2_mcp_server": {
      "command": "/usr/bin/env",
      "args": [
        "bash",
        "-lc",
        "source /opt/ros/humble/setup.bash && source $HOME/turtlebot_ws/install/setup.bash && cd $HOME/turtlebot_ws/src/turtlebot_mcp_ros2/nav2_mcp_server && .venv/bin/python -m nav2_mcp_server"
      ],
      "env": {
        "ROS_DOMAIN_ID": "0",
        "ROS_LOCALHOST_ONLY": "1",
        "PYTHONUNBUFFERED": "1"
      }
    }
  }
}
```
Note: Replace /home/darshan with your system /home/USERNAME.


---

### ✅ What this JSON does (Student Explanation)

This config is like a **launch recipe** for Cursor:

✅ tells Cursor **where the MCP server is located**
✅ ensures Cursor uses the correct Python (`.venv/bin/python`)
✅ sources ROS 2 and workspace setup scripts
✅ launches `nav2_mcp_server` automatically
✅ sets ROS environment variables for communication

---

### 📝 Extra Note (Optional)

If your system uses `uv`, ensure Cursor can find it:

```bash
which uv
```

---

## ✅ Step 2 — Restart Cursor Properly (Very Important)

Cursor must be launched from a terminal **with ROS sourced**, otherwise ROS info may not be visible.

### Fully close Cursor first, then run:

```bash
source /opt/ros/humble/setup.bash
source ~/turtlebot_ws/install/setup.bash
cursor .
```

---

### ✅ What happens when you restart Cursor?

When Cursor launches:

✅ it reads your MCP config JSON
✅ starts the MCP server in the background
✅ creates an active connection to ROS 2 through MCP

---

# ✅ Part 4 — Verify Everything Works

### Step 1 — Check MCP Status

1. Open: **File → Preferences→ Cursor Settings→Tools & MCP**
2. You should see a **green indicator** 🟢 next to:

✅ `nav2_mcp_server`

---

### Step 2 — Test in AI Chat

1. Open Cursor AI Chat using:

`Ctrl + L`

2. Ask:

```
List the currently active ROS 2 nodes.
```

✅ If you see nodes like:

* `/collision_monitor`
* `/velocity_smoother`

🎉 Then your MCP connection is working!

---

# 💡 Example Questions You Can Ask Cursor (MCP Prompts)

Once connected, try prompts like:

### ROS 2 System

* **Am I connected to a ROS 2 system?**
* **What nodes, topics, and services are active?**
* **Which localization node is running?**

### Nav2 Configuration

* **Which global planner is configured?**
* **Which controller is used?**
* **What robot is used in the simulation?**

### Robot Sensors & Navigation

* **Find the nearest obstacle in front of the robot using LaserScan data**
* **What is the current navigation goal?**
* **Show the robot’s current pose**

### Fun Test Prompt 😄

* **What is the weather in Mysuru?**

---

# ✅ You’re Done! 🎉

You can now interact with **Nav2 and ROS 2 using Cursor MCP** — like having an AI assistant inside your robotics system.
