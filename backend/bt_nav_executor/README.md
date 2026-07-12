# BT Nav Executor

A ROS2 package for executing sequential navigation waypoints using Behavior Trees and Nav2.

## Overview

This package provides a simple yet powerful way to execute predefined navigation routes using Behavior Trees. It integrates seamlessly with Nav2 and supports Groot2 visualization for real-time tree monitoring.

### Key Features

- 🎯 Sequential waypoint navigation
- 🌳 Behavior Tree based execution
- 👁️ Groot2 visualization support
- 🔌 Service-triggered execution
- ⚡ Non-blocking architecture
- 📊 Status monitoring and feedback

## Architecture

```
ROS2 Service Call
      ↓
BT Nav Executor Node
      ↓
Behavior Tree (XML)
      ↓
┌──────────────────────┐
│  Sequence            │
│  ├─ SendNav2Goal 1   │  →  Nav2 Action Server
│  ├─ MonitorStatus 1  │  ←  Status Topic
│  ├─ SendNav2Goal 2   │  →  Nav2 Action Server
│  ├─ MonitorStatus 2  │  ←  Status Topic
│  └─ ...              │
└──────────────────────┘
      ↓
Robot Navigation
```

## Prerequisites

- ROS2 Humble or later
- Nav2 Stack
- BehaviorTree.CPP (v4.x)
- Groot2 (optional, for visualization)

## Installation

### 1. Create Workspace

```bash
mkdir -p ~/bt_ws/src
cd ~/bt_ws/src
```

### 2. Add Package Files

Create the package structure:
```
bt_nav_executor/
├── CMakeLists.txt
├── package.xml
├── include/
│   └── bt_nav_executor/
│       └── nodes.hpp
├── src/
│   └── bt_nav_executor.cpp
├── launch/
│   └── bt_nav_executor.launch.py
├── trees/
│   └── go_to_route_no_return.xml
└── README.md
```

### 3. Build

```bash
cd ~/bt_ws
colcon build --packages-select bt_nav_executor
source install/setup.bash
```

## Usage

### 1. Launch the Node

```bash
ros2 launch bt_nav_executor bt_nav_executor.launch.py
```

**With custom parameters:**
```bash
ros2 launch bt_nav_executor bt_nav_executor.launch.py \
  tree_file:=my_custom_route.xml \
  groot_port:=1667 \
  enable_groot:=true
```

### 2. Trigger Execution

Call the service to start navigation:
```bash
ros2 service call /execute_navigation std_srvs/srv/Trigger
```

### 3. Monitor Status

Watch the status topic:
```bash
ros2 topic echo /bt_status
```

### 4. Visualize with Groot2

1. Install Groot2: https://www.behaviortree.dev/groot
2. Launch Groot2 and connect to port 1667
3. See real-time tree execution

## Configuration

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `tree_file` | string | `go_to_route_no_return.xml` | BT XML filename |
| `groot_port` | int | `1667` | Groot2 connection port |
| `tick_rate_ms` | int | `100` | Tree tick rate (ms) |
| `enable_groot` | bool | `true` | Enable Groot2 visualization |

### Topics

| Topic | Type | Description |
|-------|------|-------------|
| `/execute_navigation` | Service | Trigger BT execution |
| `/bt_status` | `std_msgs/String` | Current execution status |
| `/navigate_to_pose` | Action | Nav2 navigation action |

## Creating Custom Routes

### XML Structure

```xml
<root BTCPP_format="4">
  <BehaviorTree ID="MyRoute">
    <Sequence name="RouteSequence">
      
      <!-- Waypoint 1 -->
      <SendNav2Goal name="send_wp1"
                    x="1.0" 
                    y="2.0" 
                    yaw_deg="90.0" 
                    frame_id="map"
                    goal_id="{goal_id_1}"/>
      
      <MonitorNav2Status name="monitor_wp1"
                         goal_id="{goal_id_1}"
                         timeout_ms="600000"/>
      
      <!-- Add more waypoints... -->
      
    </Sequence>
  </BehaviorTree>
</root>
```

### Node Parameters

**SendNav2Goal:**
- `x`, `y`, `z`: Position in meters
- `yaw_deg`: Heading in degrees
- `qx`, `qy`, `qz`, `qw`: Quaternion (overrides yaw)
- `frame_id`: Reference frame (default: "map")
- `goal_id`: Output variable for goal UUID

**MonitorNav2Status:**
- `goal_id`: UUID to monitor (from SendNav2Goal)
- `timeout_ms`: Maximum wait time
- `status_topic`: Status topic name

**Wait (optional):**
- `msec`: Wait time in milliseconds
- `wait_duration`: Wait time in seconds

### Example: Route with Pauses

```xml
<Sequence name="RouteWithPauses">
  <SendNav2Goal name="wp1" x="1.0" y="2.0" yaw_deg="0.0" goal_id="{gid1}"/>
  <MonitorNav2Status name="wait1" goal_id="{gid1}"/>
  <Wait name="pause1" msec="5000"/>  <!-- 5 second pause -->
  
  <SendNav2Goal name="wp2" x="3.0" y="4.0" yaw_deg="90.0" goal_id="{gid2}"/>
  <MonitorNav2Status name="wait2" goal_id="{gid2}"/>
</Sequence>
```

## Examples

### Example 1: Simple 3-Point Route

```bash
# Create trees/simple_route.xml
cat > ~/bt_ws/src/bt_nav_executor/trees/simple_route.xml << 'EOF'
<root BTCPP_format="4">
  <BehaviorTree ID="SimpleRoute">
    <Sequence>
      <SendNav2Goal x="1.0" y="0.0" yaw_deg="0.0" goal_id="{g1}"/>
      <MonitorNav2Status goal_id="{g1}"/>
      
      <SendNav2Goal x="1.0" y="1.0" yaw_deg="90.0" goal_id="{g2}"/>
      <MonitorNav2Status goal_id="{g2}"/>
      
      <SendNav2Goal x="0.0" y="0.0" yaw_deg="180.0" goal_id="{g3}"/>
      <MonitorNav2Status goal_id="{g3}"/>
    </Sequence>
  </BehaviorTree>
</root>
EOF

# Launch with custom tree
ros2 launch bt_nav_executor bt_nav_executor.launch.py tree_file:=simple_route.xml

# Execute
ros2 service call /execute_navigation std_srvs/srv/Trigger
```

### Example 2: Patrol Route (Loop)

For looping behavior, wrap the Sequence in a Repeat decorator in your XML.

### Example 3: Conditional Routing

Use BehaviorTree.CPP control nodes like `Fallback` or `IfThenElse` for conditional behavior.

## Troubleshooting

### Node Won't Start

**Check dependencies:**
```bash
ros2 pkg list | grep -E "behaviortree_cpp|nav2_msgs"
```

**Verify XML file exists:**
```bash
ros2 pkg prefix bt_nav_executor
ls $(ros2 pkg prefix bt_nav_executor)/share/bt_nav_executor/trees/
```

### Service Call Fails

**Check if node is running:**
```bash
ros2 node list | grep bt_nav_executor
```

**Check service:**
```bash
ros2 service list | grep execute_navigation
```

### Navigation Doesn't Start

**Verify Nav2 is running:**
```bash
ros2 action list | grep navigate_to_pose
```

**Check robot localization:**
```bash
ros2 topic echo /amcl_pose
```

### Groot2 Not Connecting

**Check port:**
```bash
netstat -tuln | grep 1667
```

**Firewall:**
```bash
sudo ufw allow 1667
```

## Advanced Usage

### Integration with Other Nodes

```python
#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from std_srvs.srv import Trigger

class NavigationTrigger(Node):
    def __init__(self):
        super().__init__('nav_trigger')
        self.cli = self.create_client(Trigger, '/execute_navigation')
        
    def trigger_navigation(self):
        req = Trigger.Request()
        future = self.cli.call_async(req)
        rclpy.spin_until_future_complete(self, future)
        return future.result()

def main():
    rclpy.init()
    node = NavigationTrigger()
    result = node.trigger_navigation()
    print(f"Result: {result.message}")
    rclpy.shutdown()

if __name__ == '__main__':
    main()
```

### Status Monitoring

```bash
# Monitor in terminal
ros2 topic echo /bt_status

# Expected outputs:
# - "LOADING"
# - "RUNNING"
# - "SUCCESS"
# - "FAILED"
```

### Custom BT Nodes

Add your own nodes by modifying `nodes.hpp` and registering them in `registerNav2Nodes()`.

## Best Practices

1. **Timeout Configuration**: Set appropriate timeouts based on expected navigation time
2. **Frame IDs**: Ensure frame_id matches your robot's coordinate system
3. **Waypoint Density**: Don't place waypoints too close together (min 0.5m recommended)
4. **Orientation**: Use yaw_deg for simplicity, quaternion for precision
5. **Testing**: Test routes in simulation before deploying to real robot

## Performance Tuning

- **Tick Rate**: Lower tick_rate_ms (50-100ms) for faster response
- **Timeout**: Adjust based on environment complexity
- **Status Topic**: Use correct topic name for your Nav2 version

## Dependencies

Ensure these are installed:

```bash
sudo apt install ros-humble-behaviortree-cpp \
                 ros-humble-nav2-bringup \
                 ros-humble-nav2-msgs
```

## Contributing

Contributions welcome! Please follow ROS2 coding standards.

## License

Apache 2.0

## Support

- GitHub Issues: [Your repo]
- ROS Answers: Tag with `bt_nav_executor`
- Email: darshan@hiverobotics.com

## References

- [BehaviorTree.CPP](https://www.behaviortree.dev/)
- [Nav2 Documentation](https://navigation.ros.org/)
- [Groot2](https://www.behaviortree.dev/groot)
- [ROS2 Humble](https://docs.ros.org/en/humble/)

## Acknowledgments

Built with inspiration from the ROS2 and BehaviorTree communities.

---

**Created by:** Darshan Gowda / Hive Robotics  
**Last Updated:** 2025