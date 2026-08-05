from setuptools import setup
from glob import glob

package_name = 'hive_camera_bridge'

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
    # cv_bridge comes from the ros-humble-cv-bridge apt package (built
    # against the system OpenCV) — NOT pip opencv-python, which would
    # install a second, conflicting OpenCV. Only aiortc's stack is pip.
    install_requires=['setuptools', 'aiortc', 'aiohttp'],
    zip_safe=True,
    maintainer='Darshan Gowda',
    maintainer_email='dkg@hiverobots.dk',
    description='ROS 2 camera -> WebRTC bridge for the Hive stack',
    entry_points={
        'console_scripts': [
            'camera_bridge = hive_camera_bridge.camera_node:main',
        ],
    },
)
