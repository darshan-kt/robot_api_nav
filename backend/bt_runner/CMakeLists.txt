cmake_minimum_required(VERSION 3.5)
project(bt_runner)

# C++ standard
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

# Dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(ament_index_cpp REQUIRED)
find_package(behaviortree_cpp REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(nav2_msgs REQUIRED)
find_package(action_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(hive_interfaces REQUIRED)

# Target
add_executable(bt_runner_node src/runner.cpp)
ament_target_dependencies(bt_runner_node
  rclcpp
  rclcpp_action
  ament_index_cpp
  behaviortree_cpp
  sensor_msgs
  geometry_msgs
  hive_interfaces
  nav2_msgs
  action_msgs 
)

# Make headers visible while building this target, and export for dependents
target_include_directories(bt_runner_node PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>)

# Install binary
install(TARGETS bt_runner_node
  DESTINATION lib/${PROJECT_NAME}
)

# Install public headers (exactly once) and export include dir
install(DIRECTORY include/
  DESTINATION include)
ament_export_include_directories(include)

# Install BT XML trees
install(DIRECTORY trees/
  DESTINATION share/${PROJECT_NAME}/trees)


# Install launch files
install(DIRECTORY launch
  DESTINATION share/${PROJECT_NAME}/)

# (Optional but robust) make sure package is discoverable by `ros2`
file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME} "")
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}
  DESTINATION share/ament_index/resource_index/packages)
install(FILES package.xml DESTINATION share/${PROJECT_NAME})

ament_package()
