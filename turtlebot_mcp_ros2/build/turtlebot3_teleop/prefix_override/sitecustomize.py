import sys
if sys.prefix == '/usr':
    sys.real_prefix = sys.prefix
    sys.prefix = sys.exec_prefix = '/home/darshan/appstore_arm/turtlebot_mcp_ros2/install/turtlebot3_teleop'
