from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    api_gateway_node = Node(
        package='hive_api_gateway',
        executable='api',
        name='hive_api_gateway',
        output='screen',
    )

    return LaunchDescription([
        api_gateway_node,
    ])
