# 🐢 TurtleBot3 Autonomous Navigation & Simulation (ROS 2 Humble)

This repository provides a complete simulation environment for the **TurtleBot3 Burger**, pre-configured for **SLAM (Simultaneous Localization and Mapping)**, **AMCL Localization**, and **Autonomous Navigation (Nav2)**.

It includes a suite of automated **Bash Scripts** located in `src/bash_scripts/` to abstract complex launch sequences, making it ideal for robotics students and researchers focusing on algorithm testing rather than boilerplate configuration.

---

## 📋 Prerequisites

* **OS:** Ubuntu 22.04 LTS (Jammy Jellyfish)
* **ROS Distribution:** ROS 2 Humble Hawksbill
* **Simulator:** Gazebo Classic 11

### 📦 System Dependencies

Before using this repository, ensure the required ROS 2 packages are installed:

```bash
sudo apt update
sudo apt install -y \
    ros-humble-gazebo-ros-pkgs \
    ros-humble-navigation2 \
    ros-humble-nav2-bringup \
    ros-humble-slam-toolbox \
    ros-humble-turtlebot3* \
    ros-humble-teleop-tools  # Required for 'key_teleop' (Dead-man switch)
```

---

## 🛠️ Installation & Setup

We recommend creating a fresh workspace for this simulation.

### 1. Create Workspace

```bash
mkdir -p ~/turtlebot_ws/src
cd ~/turtlebot_ws/src
```

### 2. Clone Repository

Clone this repository into the src folder.

```bash
git clone https://github.com/darshan-kt/turtlebot_mcp_ros2.git
```

### 3. Build the Workspace

Return to the workspace root, install dependencies using rosdep, and build.

```bash
cd ~/turtlebot_ws

# Install dependencies defined in package.xml files
rosdep install --from-paths src --ignore-src -r -y

# Build packages
colcon build --symlink-install

# Source the environment
source install/setup.bash
```

### 4. Make Scripts Executable

Ensure the helper scripts have execution permissions:

```bash
chmod +x src/turtlebot_mcp_ros2/bash_scripts/*.sh
```

### 5. Add gazebo setup file into .bashrc

```bash
nano ~/.bashrc

## At the bottom of this file add below line

source /usr/share/gazebo/setup.bash
```

### 6. source .bashrc on terminal or skip this step by opening new terminal
```bash
source ~/.bashrc
```

---

## 🚀 Tutorial 1: SLAM (Mapping the World)

**Objective:** Create a 2D occupancy grid map of an unknown environment.

**Theory:** We use SLAM Toolbox (Simultaneous Localization and Mapping). As the robot moves, it uses LiDAR data to calculate its own position while simultaneously building a map of walls and obstacles.

### Steps:

#### Launch Simulation & Mapper

Run the automated mapping script. This launches Gazebo, SLAM Toolbox, and RViz (pre-configured).

```bash
./src/turtlebot_mcp_ros2/bash_scripts/mapping.sh
```

> **Gazebo World View:** The simulation environment will appear.

![Gazebo World View](images/gazebo_world.png)

#### Drive the Robot

Open a new terminal, source the workspace, and run the teleop script.

```bash
./src/turtlebot_mcp_ros2/bash_scripts/teleop.sh
```

**Controls:** Use Arrow Keys to move.

> **Note:** This uses a "Dead Man's Switch". The robot stops immediately when keys are released.

#### Visualize

Watch the RViz window. You will see:
- **White areas** (free space)
- **Black lines** (walls)
- **Gray areas** (unknown)

Drive until the map is complete.

> **Mapping Process in RViz:** Watch the map build in real-time.

![Mapping Process](images/mapping.png)

#### Save the Map

Once satisfied, open a new terminal and save the map to the workspace root:

```bash
# Usage: ./src/turtlebot_mcp_ros2/bash_scripts/save_map.sh [map_name]
./src/turtlebot_mcp_ros2/bash_scripts/save_map.sh my_lab_map
```

**Output:** This creates `my_lab_map.yaml` and `my_lab_map.pgm` in your workspace root.

---

## 🔍 Tutorial 2: AMCL (Localization Only)

**Objective:** Localize the robot within a known static map.

**Theory:** AMCL (Adaptive Monte Carlo Localization) uses a particle filter. It spawns thousands of "particles" (hypothetical robot poses). As the robot senses the environment, particles that don't match the sensor readings are discarded, eventually converging on the robot's true position.

### Steps:

#### Launch AMCL

This starts Gazebo, loads the map server, starts the AMCL node, and opens RViz.

```bash
# Usage: ./src/turtlebot_mcp_ros2/bash_scripts/amcl.sh [map_name.yaml]
./src/turtlebot_mcp_ros2/bash_scripts/amcl.sh $(pwd)/src/my_lab_map.yaml
```

#### Initialize Pose (Critical Step)

In the RViz window, the robot might appear in the wrong location.

1. Click the **"2D Pose Estimate"** button (top toolbar)
2. Click and drag on the map where the robot actually is in Gazebo

**Result:** You will see the particle cloud (green arrows) disperse and then converge as you verify the position.

> **AMCL Particle Cloud:** Green arrows representing possible robot positions.

![AMCL Localization](images/amcl.png)

#### Verify

Use `teleop.sh` to spin the robot. The particles should tighten around the robot, confirming it knows where it is.

---

## 🧭 Tutorial 3: Autonomous Navigation

**Objective:** Send the robot to a goal destination while avoiding obstacles autonomously.

**Theory:** The Nav2 Stack performs path planning:
- **Global Planner:** Finds the shortest path from A to B (Dijkstra/A*)
- **Local Planner:** Controls velocity to follow the path while avoiding dynamic obstacles (Costmaps)

### Steps:

#### Launch Navigation

This script brings up the full navigation stack (Map Server + AMCL + Planner + Controller).

```bash
./src/turtlebot_mcp_ros2/bash_scripts/navigation.sh $(pwd)/src/my_lab_map.yaml
```

#### Initialize Pose

Just like in AMCL, use **"2D Pose Estimate"** to tell the robot where it starts.

#### Send a Goal

1. Click the **"2D Goal Pose"** button in RViz
2. Click and drag on a target location on the map

**Result:** The robot will plan a path (green line) and automatically drive to the destination, avoiding obstacles.

> **Nav2 Path Planning:** Green path showing planned route.

![Autonomous Navigation](images/navigation.png)

---

## 🔧 Troubleshooting

If Gazebo hangs, processes freeze, or you need to restart the simulation quickly, use the cleanup script.

```bash
# Force kills Gazebo, Nav2, and background ROS processes
./src/turtlebot_mcp_ros2/bash_scripts/kill_process.sh
```

### Common Issues

**Robot not moving?**  
Ensure you have the `teleop_tools` package installed.

**Map not found?**  
Ensure you ran `save_map.sh` and the `.yaml` file exists in your workspace root.

**RViz showing errors?**  
Wait a few seconds; Nav2 takes time to initialize costmaps.

---
## 📧 Contact

```bash
Darshan K T
darshankt1806@gmail.com
```


