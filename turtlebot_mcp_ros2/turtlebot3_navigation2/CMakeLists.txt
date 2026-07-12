################################################################################
# Set minimum required version of cmake, project name and compile options
################################################################################
cmake_minimum_required(VERSION 3.5)
project(turtlebot3_navigation2)

if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

################################################################################
# Find ament packages and libraries for ament and system dependencies
################################################################################
find_package(ament_cmake REQUIRED)

# --- ADDED: Dependencies for the C++ Node ---
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(std_msgs REQUIRED)

################################################################################
# Build Executables
################################################################################

# --- ADDED: Compilation Rules ---
# 1. Create the executable from the source file
add_executable(velocity_bridge_node src/velocity_bridge.cpp)

# 2. Link the required ROS libraries
ament_target_dependencies(velocity_bridge_node
  rclcpp
  geometry_msgs
  std_msgs
)

################################################################################
# Install
################################################################################

# --- ADDED: Install the compiled node ---
install(TARGETS
  velocity_bridge_node
  DESTINATION lib/${PROJECT_NAME}
)

# Existing install rule for config/launch files
install(
  DIRECTORY launch map param rviz src
  DESTINATION share/${PROJECT_NAME}
)

################################################################################
# Macro for ament package
################################################################################
ament_package()