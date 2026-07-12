from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
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

    return LaunchDescription([
        bt_runner_node
    ])
