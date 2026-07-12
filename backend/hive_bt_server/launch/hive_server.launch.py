from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    hive_server_node = Node(
        package='hive_bt_server',
        executable='hive_server_node',
        name='hive_bt_server',
        output='screen'
    )

    return LaunchDescription([
        hive_server_node
    ])
