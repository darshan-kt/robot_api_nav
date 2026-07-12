MCP Server installtion and running!

Step 1: Pull the Official Image
Open your terminal and pull the pre-built image directly from the repository.

docker pull ghcr.io/ajtudela/nav2_mcp_server:latest


Step 2: Run the Docker container with --net=host.
Note: --net=host is critical. Without it, the Docker container is isolated and cannot see your robot's ROS topics.

docker run -it --rm --net=host ghcr.io/ajtudela/nav2_mcp_server:latest


Curser installtion:
https://cursor.com/download
Note: Click Download for linux and install through software installer.

# Cursor MCP Setup for Nav2

This guide fixes the configuration structure error and ensures Cursor can access your ROS 2 environment.

### 1. Fix the Configuration File

Your previous error occurred because the configuration was missing the required root object.

1. In Cursor, go to **Settings > Features > MCP**.
2. If you see an error, click the **Open JSON** link next to it.
3. **Replace** the entire file content with this valid JSON structure:

```json
{
  "mcpServers": {
    "nav2_mcp_server": {
      "command": "/home/darshan/.local/bin/uv",
      "args": [
        "run",
        "--directory",
        "/home/darshan/mcp_course/nav2_mcp_server",
        "nav2_mcp_server"
      ],
      "env": {
        "ROS_DOMAIN_ID": "0",
        "ROS_LOCALHOST_ONLY": "1"
      }
    }
  }
}

```

*Note: Ensure the path to `uv` matches your system (check with `which uv`).*

### 2. Launch Cursor correctly (Crucial!)

You cannot launch Cursor from the desktop icon because it won't load the ROS 2 environment variables. You must launch it from a terminal.

1. Close Cursor completely.
2. Open a terminal and run:
```bash
# 1. Load ROS 2 Humble
source /opt/ros/humble/setup.bash

# 2. Launch Cursor in this environment
cursor .

```



### 3. Verification

1. Open the **Cursor Settings > Features > MCP** panel.
2. You should see a **Green Light** 🟢 next to `nav2_mcp_server`.
3. Open the **AI Chat** (`Ctrl+L`) and type:
> "List the currently active ROS 2 nodes."



If the AI responds with a list of nodes (like `/collision_monitor`, `/velocity_smoother`), the connection is successful.




Read this Gemini file: for running docker

https://gemini.google.com/app/ed4ca1df7980759f




Am I connected to ROS2 System ?

What are ros2 nodes, topics, services running on the system ?

What is the localisation node we are using ?

What is the global planner we are using ?

What is the type of robot we are uisng in simulation ?

What is the weather in Mysure ?

Find the nearest obstacle in front of robot using laserscan data ?





Below is a clean, **GitHub-style `README.md` structure**, with proper headings, code blocks, notes, and sections. You can copy-paste this directly into a `README.md` file.

---

# Nav2 MCP Server – Installation & Cursor Integration Guide

This repository documents how to install, run, and verify the **Nav2 MCP Server** using Docker and connect it to **Cursor MCP** for interacting with a ROS 2 system.

---

## Table of Contents

* [Prerequisites](#prerequisites)
* [MCP Server Installation](#mcp-server-installation)

  * [Step 1: Pull the Docker Image](#step-1-pull-the-docker-image)
  * [Step 2: Run the MCP Server](#step-2-run-the-mcp-server)
* [Cursor Installation](#cursor-installation)
* [Cursor MCP Setup for Nav2](#cursor-mcp-setup-for-nav2)

  * [1. Fix the MCP Configuration File](#1-fix-the-mcp-configuration-file)
  * [2. Launch Cursor Correctly (Important)](#2-launch-cursor-correctly-important)
  * [3. Verification](#3-verification)
* [Docker Reference (Gemini)](#docker-reference-gemini)
* [Example MCP Questions](#example-mcp-questions)

---

## Prerequisites

* Docker installed and running
* ROS 2 Humble installed
* Cursor Editor installed
* A running ROS 2 / Nav2 system (simulation or real robot)

---

## MCP Server Installation

### Step 1: Pull the Docker Image

Pull the pre-built Nav2 MCP Server image from GitHub Container Registry:

```bash
docker pull ghcr.io/ajtudela/nav2_mcp_server:latest
```

---

### Step 2: Run the MCP Server

Run the Docker container using **host networking**.

> ⚠️ **Important:**
> `--net=host` is required. Without it, the container cannot access ROS 2 topics and services from the host system.

```bash
docker run -it --rm --net=host ghcr.io/ajtudela/nav2_mcp_server:latest
```

---

## Cursor Installation

Download and install Cursor from the official website:

🔗 [https://cursor.com/download](https://cursor.com/download)

**Instructions:**

* Click **Download for Linux**
* Install using your system’s software installer

---

## Cursor MCP Setup for Nav2

This section ensures Cursor can correctly communicate with your ROS 2 environment via MCP.

---

### 1. Fix the MCP Configuration File

A common error occurs when the MCP configuration is missing the required root object.

**Steps:**

1. Open **Cursor**
2. Navigate to **Settings → Features → MCP**
3. If an error is shown, click **Open JSON**
4. **Replace the entire content** with the following configuration:

```json
{
  "mcpServers": {
    "nav2_mcp_server": {
      "command": "/home/darshan/mcp_course/nav2_mcp_server/.venv/bin/python",
      "args": [
        "-m",
        "nav2_mcp_server"
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

> 📝 **Note:**
> Ensure the path to `uv` is correct for your system:
>
> ```bash
> which uv
> ```

---

### 2. Launch Cursor Correctly (Important)

Cursor **must be launched from a terminal** so it inherits the ROS 2 environment variables.

**Do NOT launch Cursor from the desktop icon.**

```bash
# Load ROS 2 Humble
source /opt/ros/humble/setup.bash

# Launch Cursor in the same environment
cursor .
```

---

### 3. Verification

1. Open **Cursor → Settings → Features → MCP**
2. Confirm you see a **green indicator** 🟢 next to `nav2_mcp_server`
3. Open **AI Chat** using `Ctrl + L`
4. Run the following prompt:

```
List the currently active ROS 2 nodes.
```

✅ If the AI returns nodes such as:

* `/collision_monitor`
* `/velocity_smoother`

Then the MCP connection is working correctly.

---

## Docker Reference (Gemini)

For additional guidance on running Docker containers, refer to:

🔗 [https://gemini.google.com/app/ed4ca1df7980759f](https://gemini.google.com/app/ed4ca1df7980759f)

---

## Example MCP Questions

Once MCP is connected, you can ask questions like:

* **Am I connected to a ROS 2 system?**
* **What ROS 2 nodes, topics, and services are currently running?**
* **Which localization node is being used?**
* **What global planner is configured in Nav2?**
* **What type of robot is used in the simulation?**
* **What is the weather in Mysuru?**
* **Find the nearest obstacle in front of the robot using LaserScan data**

---

✅ **You are now ready to interact with Nav2 using Cursor MCP!**
