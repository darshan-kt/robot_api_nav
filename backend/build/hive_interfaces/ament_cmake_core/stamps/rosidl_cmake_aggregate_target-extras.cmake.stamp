# generated from rosidl_cmake/cmake/rosidl_cmake_aggregate_target-extras.cmake.in

# Create a convenience aggregate target hive_interfaces::hive_interfaces
# that links all generated interface targets, so downstream packages can use
# a single modern CMake target name instead of ${hive_interfaces_TARGETS}.
if(hive_interfaces_TARGETS AND NOT TARGET hive_interfaces::hive_interfaces)
  add_library(hive_interfaces::hive_interfaces INTERFACE IMPORTED)
  set_target_properties(hive_interfaces::hive_interfaces PROPERTIES
    INTERFACE_LINK_LIBRARIES "${hive_interfaces_TARGETS}")
endif()
