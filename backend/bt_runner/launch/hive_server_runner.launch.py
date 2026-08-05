from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Main BT Runner node
    bt_runner_node = Node(
        package='bt_runner',
        executable='bt_runner_node',
        name='bt_runner',
        output='screen',
        parameters=[
            {'tick_ms': 750},
            {'groot_port': 1667}
        ]
    )

    # Path to the hive_server.launch.py file
    hive_server_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(
                get_package_share_directory('hive_bt_server'),
                'launch',
                'hive_server.launch.py'
            )
        )
    )

    # hive_mqtt_bridge — the ROS2<->MQTT translation node. Included here
    # (rather than launched as a separate process) so the whole robotstore
    # container comes up / goes down as one unit via the existing
    # entrypoint_robotstore.sh, same pattern already used above for
    # hive_bt_server.
    mqtt_bridge_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(
                get_package_share_directory('hive_mqtt_bridge'),
                'launch',
                'hive_mqtt_bridge.launch.py'
            )
        )
    )

    # hive_camera_bridge — ROS2 camera topic -> WebRTC. Same "included here"
    # reasoning as hive_mqtt_bridge above; it's the only other node besides
    # hive_mqtt_bridge that talks to anything outside ROS 2.
    camera_bridge_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(
                get_package_share_directory('hive_camera_bridge'),
                'launch',
                'hive_camera_bridge.launch.py'
            )
        )
    )

    return LaunchDescription([
        hive_server_launch,     # starts hive_server_node
        bt_runner_node,         # starts bt_runner_node
        mqtt_bridge_launch,     # starts hive_mqtt_bridge
        camera_bridge_launch,   # starts hive_camera_bridge
    ])
