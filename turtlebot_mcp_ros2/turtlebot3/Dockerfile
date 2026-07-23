# Use the base ROS2 humble image
#
# ARCH NOTE: amd64-only, on purpose. This installs ros-${ROS_DISTRO}-gazebo-
# ros-pkgs, which — like ros-humble-turtlebot3-gazebo — was never published
# for arm64 on the ROS build farm (Gazebo Classic has no arm64 packages
# upstream at all). See turtlebot_mcp_ros2/docker/Dockerfile-sim for the
# full explanation; the same constraint applies here. Gazebo simulation runs
# on a desktop-class amd64 machine; the Raspberry Pi 5 runs the real onboard
# stack (hive_api, robotstore — both arm64-verified) instead.
FROM osrf/ros:humble-desktop-full

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install the required packages in a single layer and clean up afterwards
RUN apt-get update && apt-get install -y \
    git \
    python3-pip \
    ros-${ROS_DISTRO}-gazebo-ros-pkgs \
    ros-${ROS_DISTRO}-cartographer \
    ros-${ROS_DISTRO}-cartographer-ros \
    ros-${ROS_DISTRO}-navigation2 \
    ros-${ROS_DISTRO}-nav2-bringup && \
    rm -rf /var/lib/apt/lists/*

ENV COLCON_WS=/root/turtlebot3_ws
WORKDIR ${COLCON_WS}

RUN mkdir -p ${COLCON_WS}/src && \
    cd ${COLCON_WS}/src && \
    git clone -b humble https://github.com/ROBOTIS-GIT/DynamixelSDK.git && \
    git clone -b humble https://github.com/ROBOTIS-GIT/turtlebot3_msgs.git && \
    git clone -b humble https://github.com/ROBOTIS-GIT/turtlebot3.git

RUN bash -c "source /opt/ros/${ROS_DISTRO}/setup.bash && \
    cd ${COLCON_WS} && \
    colcon build --symlink-install --cmake-args -DCMAKE_BUILD_TYPE=Release"

RUN echo "source /opt/ros/${ROS_DISTRO}/setup.bash" >> ~/.bashrc
RUN echo "source ${COLCON_WS}/install/setup.bash" >> ~/.bashrc
RUN echo "source /usr/share/gazebo/setup.sh" >> ~/.bashrc

CMD ["bash"]
