from setuptools import setup
from glob import glob

package_name = 'hive_api_gateway'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', glob('launch/*.launch.py')),
        # ── all .pgm map images ──
        ('share/' + package_name + '/resource', glob('resource/*.pgm')),
    ],
    install_requires=['setuptools','fastapi','uvicorn'],
    zip_safe=True,
    maintainer='Darshan Gowda',
    maintainer_email='dkg@hiverobots.dk',
    description='HTTP→ROS 2 gateway for Hive',
    entry_points={
        'console_scripts': [
            'api = hive_api_gateway.main:main',
        ],
    },
)