cmake_minimum_required(VERSION 3.5)
project(hive_bt_server)

if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(hive_interfaces REQUIRED)
find_package(nav2_msgs REQUIRED)


add_executable(hive_server_node src/server.cpp)
ament_target_dependencies(hive_server_node rclcpp rclcpp_action hive_interfaces nav2_msgs std_msgs geometry_msgs)

install(TARGETS hive_server_node
  DESTINATION lib/${PROJECT_NAME}
)

# Install launch files
install(
  DIRECTORY launch
  DESTINATION share/${PROJECT_NAME}/
)

# Ensure package is discoverable by `ros2`
file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME} "")
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/${PROJECT_NAME}
  DESTINATION share/ament_index/resource_index/packages)
install(FILES package.xml DESTINATION share/${PROJECT_NAME})

ament_package()
