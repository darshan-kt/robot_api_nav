#!/usr/bin/env python3
"""
Launch file for BT Navigation Executor

Usage:
  ros2 launch bt_nav_executor bt_nav_executor.launch.py
  ros2 launch bt_nav_executor bt_nav_executor.launch.py tree_file:=custom_route.xml
"""

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # Declare launch arguments
    tree_file_arg = DeclareLaunchArgument(
        'tree_file',
        default_value='go_to_route_no_return.xml',
        description='Behavior tree XML file name'
    )
    
    groot_port_arg = DeclareLaunchArgument(
        'groot_port',
        default_value='1667',
        description='Port for Groot2 visualization'
    )
    
    tick_rate_arg = DeclareLaunchArgument(
        'tick_rate_ms',
        default_value='100',
        description='Tree tick rate in milliseconds'
    )
    
    enable_groot_arg = DeclareLaunchArgument(
        'enable_groot',
        default_value='true',
        description='Enable Groot2 visualization'
    )

    # Node
    bt_nav_executor_node = Node(
        package='bt_nav_executor',
        executable='bt_nav_executor',
        name='bt_nav_executor',
        output='screen',
        parameters=[{
            'tree_file': LaunchConfiguration('tree_file'),
            'groot_port': LaunchConfiguration('groot_port'),
            'tick_rate_ms': LaunchConfiguration('tick_rate_ms'),
            'enable_groot': LaunchConfiguration('enable_groot'),
        }]
    )

    return LaunchDescription([
        tree_file_arg,
        groot_port_arg,
        tick_rate_arg,
        enable_groot_arg,
        bt_nav_executor_node,
    ])