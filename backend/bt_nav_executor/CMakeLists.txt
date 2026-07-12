cmake_minimum_required(VERSION 3.8)
project(bt_nav_executor)

# Default to C++17
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# ===================================================================
# Dependencies
# ===================================================================
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(behaviortree_cpp REQUIRED)
find_package(ament_index_cpp REQUIRED)
find_package(std_msgs REQUIRED)
find_package(std_srvs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(nav2_msgs REQUIRED)
find_package(action_msgs REQUIRED)

# ===================================================================
# Executable: BT Navigation Executor
# ===================================================================
add_executable(bt_nav_executor 
  src/bt_nav_executor.cpp
)

target_include_directories(bt_nav_executor PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
)

ament_target_dependencies(bt_nav_executor
  rclcpp
  rclcpp_action
  behaviortree_cpp
  ament_index_cpp
  std_msgs
  std_srvs
  geometry_msgs
  nav2_msgs
  action_msgs
)

# ===================================================================
# Install
# ===================================================================

# Install executable
install(TARGETS bt_nav_executor
  DESTINATION lib/${PROJECT_NAME}
)

# Install header files
install(DIRECTORY include/
  DESTINATION include/
)

# Install launch files
install(DIRECTORY launch
  DESTINATION share/${PROJECT_NAME}
)

# Install config files
install(DIRECTORY config
  DESTINATION share/${PROJECT_NAME}
)

# Install tree files
install(DIRECTORY trees
  DESTINATION share/${PROJECT_NAME}
)

# ===================================================================
# Testing
# ===================================================================
if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

# ===================================================================
# Ament Package
# ===================================================================
ament_package()