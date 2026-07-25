import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, OpaqueFunction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.descriptions import ParameterFile
from launch.substitutions import LaunchConfiguration

TURTLEBOT3_MODEL = os.environ['TURTLEBOT3_MODEL']
ROS_DISTRO = os.environ.get('ROS_DISTRO')

def _print_selected_files(context, *args, **kwargs):
    params_path = LaunchConfiguration('params_file').perform(context)
    map_path = LaunchConfiguration('map').perform(context)
    use_sim = LaunchConfiguration('use_sim_time').perform(context)
    print(
        "\n================ Launch Debug ================\n"
        f"Using parameter file: {params_path}\n"
        f"Using map file:       {map_path}\n"
        f"use_sim_time:         {use_sim}\n"
        "=============================================\n"
    )
    return []  # no actions to add

def generate_launch_description():
    use_sim_time = LaunchConfiguration('use_sim_time', default='true')

    # Map and parameter paths
    map_dir = LaunchConfiguration(
        'map',
        default=os.path.join(
            get_package_share_directory('turtlebot3_navigation2'),
            'map',
            'map.yaml'
        )
    )

    param_file_name = TURTLEBOT3_MODEL + '.yaml'
    if ROS_DISTRO == 'humble':
        default_params_path = os.path.join(
            get_package_share_directory('turtlebot3_navigation2'),
            'param',
            ROS_DISTRO,
            param_file_name
        )
    else:
        default_params_path = os.path.join(
            get_package_share_directory('turtlebot3_navigation2'),
            'param',
            param_file_name
        )

    # LaunchConfiguration wrapping for params_file (so it can be overridden)
    param_dir = LaunchConfiguration('params_file', default=default_params_path)

    # Directories for other launch files
    nav2_launch_file_dir = os.path.join(
        get_package_share_directory('nav2_bringup'),
        'launch'
    )
    #local_bringup='/home/jia/turtle_nav2/src/turtle_nav2/turtlebot3_navigation2/launch/bringup_launch.py'
    rviz_config_dir = os.path.join(
        get_package_share_directory('turtlebot3_navigation2'),
        'rviz',
        'tb3_navigation2.rviz'
    )


    cm_params_dir = LaunchConfiguration(
    'cm_params_file',
    default=os.path.abspath(os.path.join(os.path.dirname(__file__),
                                         '..', 'param', 'collision_monitor_params.yaml')))

    return LaunchDescription([
        # Launch arguments
        DeclareLaunchArgument(
            'map',
            default_value=map_dir,
            description='Full path to map file to load'
        ),
        DeclareLaunchArgument(
            'params_file',
            default_value=param_dir,
            description='Full path to param file to load'
        ),
        DeclareLaunchArgument(
            'use_sim_time',
            default_value='true',
            description='Use simulation (Gazebo) clock if true'
        ),
        # NEW: 声明 CM 参数
        DeclareLaunchArgument(
            'cm_params_file',
            default_value=cm_params_dir,
            description='Full path to Collision Monitor params'
        ),

        # 🔎 Print the resolved files/values at runtime
        OpaqueFunction(function=_print_selected_files),

        # 🚀 Include Nav2 bringup
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(nav2_launch_file_dir, 'bringup_launch.py')
            ),
            launch_arguments={
                'map': map_dir,
                'use_sim_time': use_sim_time,
                'params_file': param_dir
            }.items(),
        ),
        Node(
            package='nav2_collision_monitor',
            executable='collision_monitor',
            name='collision_monitor',
            output='screen',
            parameters=[cm_params_dir, {'use_sim_time': use_sim_time}],
            remappings=[
                ('/cmd_vel_in',  'cmd_vel_nav'),   # 若无 remap，则两处都改成 'cmd_vel'
                ('/cmd_vel_out', 'cmd_vel'),
            ],
        ),
         Node(
            package='nav2_lifecycle_manager',
            executable='lifecycle_manager',
            name='lifecycle_manager_collision',
            output='screen',
            parameters=[
                {'use_sim_time': use_sim_time},
                {'autostart': True},              # 启动后自动 configure + activate
                {'bond_timeout': 0.0},
                {'node_names': ['collision_monitor']},  # 只管理这个节点
            ],
        ),

        # 🖥️ RViz visualization
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz2',
            arguments=['-d', rviz_config_dir],
            parameters=[{'use_sim_time': use_sim_time}],
            output='screen'
        ),
    ])
