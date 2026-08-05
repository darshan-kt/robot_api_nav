from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    camera_bridge_node = Node(
        package='hive_camera_bridge',
        executable='camera_bridge',
        name='hive_camera_bridge',
        output='screen',
        # CAMERA_TOPIC / CAMERA_SIGNALING_PORT / CAMERA_FPS read from the
        # process environment (docker-compose.yml) — same pattern as
        # hive_mqtt_bridge's launch file.
    )

    return LaunchDescription([
        camera_bridge_node,
    ])
