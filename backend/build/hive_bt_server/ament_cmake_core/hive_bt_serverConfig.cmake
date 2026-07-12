# generated from ament/cmake/core/templates/nameConfig.cmake.in

# prevent multiple inclusion
if(_hive_bt_server_CONFIG_INCLUDED)
  # ensure to keep the found flag the same
  if(NOT DEFINED hive_bt_server_FOUND)
    # explicitly set it to FALSE, otherwise CMake will set it to TRUE
    set(hive_bt_server_FOUND FALSE)
  elseif(NOT hive_bt_server_FOUND)
    # use separate condition to avoid uninitialized variable warning
    set(hive_bt_server_FOUND FALSE)
  endif()
  return()
endif()
set(_hive_bt_server_CONFIG_INCLUDED TRUE)

# output package information
if(NOT hive_bt_server_FIND_QUIETLY)
  message(STATUS "Found hive_bt_server: 0.1.0 (${hive_bt_server_DIR})")
endif()

# warn when using a deprecated package
if(NOT "" STREQUAL "")
  set(_msg "Package 'hive_bt_server' is deprecated")
  # append custom deprecation text if available
  if(NOT "" STREQUAL "TRUE")
    set(_msg "${_msg} ()")
  endif()
  # optionally quiet the deprecation message
  if(NOT ${hive_bt_server_DEPRECATED_QUIET})
    message(DEPRECATION "${_msg}")
  endif()
endif()

# flag package as ament-based to distinguish it after being find_package()-ed
set(hive_bt_server_FOUND_AMENT_PACKAGE TRUE)

# include all config extra files
set(_extras "")
foreach(_extra ${_extras})
  include("${hive_bt_server_DIR}/${_extra}")
endforeach()
