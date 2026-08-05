from setuptools import setup
from glob import glob

package_name = 'hive_mqtt_bridge'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', glob('launch/*.launch.py')),
    ],
    install_requires=['setuptools', 'paho-mqtt'],
    zip_safe=True,
    maintainer='Darshan Gowda',
    maintainer_email='dkg@hiverobots.dk',
    description='ROS 2 <-> MQTT bridge for the Hive stack',
    entry_points={
        'console_scripts': [
            'bridge = hive_mqtt_bridge.bridge_node:main',
        ],
    },
)
