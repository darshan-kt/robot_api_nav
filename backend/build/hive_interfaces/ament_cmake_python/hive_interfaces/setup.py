from setuptools import find_packages
from setuptools import setup

setup(
    name='hive_interfaces',
    version='0.0.0',
    packages=find_packages(
        include=('hive_interfaces', 'hive_interfaces.*')),
)
