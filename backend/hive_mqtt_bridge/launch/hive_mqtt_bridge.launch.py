from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    bridge_node = Node(
        package='hive_mqtt_bridge',
        executable='bridge',
        name='hive_mqtt_bridge',
        output='screen',
        # ROBOT_ID / MQTT_HOST / MQTT_PORT / MQTT_USERNAME / MQTT_PASSWORD are
        # read from the process environment (set in docker-compose.yml) —
        # keeps this launch file identical across dev/prod, only the compose
        # env block changes.
    )

    return LaunchDescription([
        bridge_node,
    ])
