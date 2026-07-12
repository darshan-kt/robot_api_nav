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

    return LaunchDescription([
        hive_server_launch,   # starts hive_server_node
        bt_runner_node        # starts bt_runner_node
    ])
