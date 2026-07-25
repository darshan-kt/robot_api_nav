import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, OpaqueFunction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

TURTLEBOT3_MODEL = os.environ['TURTLEBOT3_MODEL']
ROS_DISTRO = os.environ.get('ROS_DISTRO')

def _print_selected_files(context, *args, **kwargs):
    print("\n=== Launching Explicit Pipeline (Behaviors -> Bridge -> Robot) ===")
    return []

def generate_launch_description():
    # --- Config ---
    use_sim_time = LaunchConfiguration('use_sim_time', default='false')
    nav2_bringup_dir = get_package_share_directory('nav2_bringup')
    nav2_pkg_path = get_package_share_directory('turtlebot3_navigation2')

    # Maps & Params
    map_dir = LaunchConfiguration(
        'map',
        default=os.path.join(nav2_pkg_path, 'map', 'map.yaml')
    )
    
    param_file_name = TURTLEBOT3_MODEL + '.yaml'
    if ROS_DISTRO == 'humble':
        default_params_path = os.path.join(nav2_pkg_path, 'param', ROS_DISTRO, param_file_name)
    else:
        default_params_path = os.path.join(nav2_pkg_path, 'param', param_file_name)
    
    param_dir = LaunchConfiguration('params_file', default=default_params_path)
    rviz_config_dir = os.path.join(nav2_pkg_path, 'rviz', 'tb3_navigation2.rviz')

    # Lifecycle nodes to manage
    nav_lifecycle_nodes = ['controller_server',
                           'planner_server',
                           'behavior_server',
                           'bt_navigator',
                           'waypoint_follower']

    return LaunchDescription([
        # --- Arguments ---
        DeclareLaunchArgument('map', default_value=map_dir),
        DeclareLaunchArgument('params_file', default_value=param_dir),
        DeclareLaunchArgument('use_sim_time', default_value='false'),
        
        OpaqueFunction(function=_print_selected_files),

        # =========================================================
        # 1. LOCALIZATION (Map Server + AMCL)
        # =========================================================
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(nav2_bringup_dir, 'launch', 'localization_launch.py')
            ),
            launch_arguments={
                'map': map_dir,
                'use_sim_time': use_sim_time,
                'params_file': param_dir,
            }.items(),
        ),

        # =========================================================
        # 2. EXPLICIT NAVIGATION NODES (Remapped to Bridge)
        # =========================================================
        
        # A. Controller Server (Standard Path Following)
        Node(
            package='nav2_controller',
            executable='controller_server',
            output='screen',
            parameters=[param_dir, {'use_sim_time': use_sim_time}],
            remappings=[
                ('cmd_vel', '/cmd_vel_nav')  # Remap output to Bridge Input
            ]
        ),

        # B. Behavior Server (Recoveries: Spin, Backup, etc.)
        #    This was the one leaking to /cmd_vel in your screenshot!
        Node(
            package='nav2_behaviors',
            executable='behavior_server',
            name='behavior_server',
            output='screen',
            parameters=[param_dir, {'use_sim_time': use_sim_time}],
            remappings=[
                ('cmd_vel', '/cmd_vel_nav')  # Remap output to Bridge Input
            ]
        ),

        # C. Planner Server
        Node(
            package='nav2_planner',
            executable='planner_server',
            name='planner_server',
            output='screen',
            parameters=[param_dir, {'use_sim_time': use_sim_time}]
        ),

        # D. BT Navigator
        Node(
            package='nav2_bt_navigator',
            executable='bt_navigator',
            name='bt_navigator',
            output='screen',
            parameters=[param_dir, {'use_sim_time': use_sim_time}]
        ),
        
        # E. Waypoint Follower
        Node(
            package='nav2_waypoint_follower',
            executable='waypoint_follower',
            name='waypoint_follower',
            output='screen',
            parameters=[param_dir, {'use_sim_time': use_sim_time}]
        ),

        # F. Lifecycle Manager (Navigation)
        Node(
            package='nav2_lifecycle_manager',
            executable='lifecycle_manager',
            name='lifecycle_manager_navigation',
            output='screen',
            parameters=[
                {'use_sim_time': use_sim_time},
                {'autostart': True},
                {'node_names': nav_lifecycle_nodes},
                {'bond_timeout': 60.0}
            ]
        ),

        # =========================================================
        # 3. VELOCITY BRIDGE
        # =========================================================
        # Input:  /cmd_vel_nav (From Controller OR Behavior Server)
        # Output: /cmd_vel     (To Robot)
        Node(
            package='turtlebot3_navigation2',
            executable='velocity_bridge_node',
            name='velocity_bridge_node',
            output='screen',
            parameters=[{'use_sim_time': use_sim_time}],
            remappings=[
                ('/cmd_vel_in', '/cmd_vel_nav'),
                ('/cmd_vel_out', '/cmd_vel'),
                ('/safety_level', '/safety_level')
            ]
        ),

        # =========================================================
        # 4. RViz
        # =========================================================
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            arguments=['-d', rviz_config_dir],
            parameters=[{'use_sim_time': use_sim_time}],
            output='screen'
        ),
    ])