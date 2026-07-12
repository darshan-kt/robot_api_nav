# generated from ament/cmake/core/templates/nameConfig.cmake.in

# prevent multiple inclusion
if(_bt_runner_CONFIG_INCLUDED)
  # ensure to keep the found flag the same
  if(NOT DEFINED bt_runner_FOUND)
    # explicitly set it to FALSE, otherwise CMake will set it to TRUE
    set(bt_runner_FOUND FALSE)
  elseif(NOT bt_runner_FOUND)
    # use separate condition to avoid uninitialized variable warning
    set(bt_runner_FOUND FALSE)
  endif()
  return()
endif()
set(_bt_runner_CONFIG_INCLUDED TRUE)

# output package information
if(NOT bt_runner_FIND_QUIETLY)
  message(STATUS "Found bt_runner: 0.1.0 (${bt_runner_DIR})")
endif()

# warn when using a deprecated package
if(NOT "" STREQUAL "")
  set(_msg "Package 'bt_runner' is deprecated")
  # append custom deprecation text if available
  if(NOT "" STREQUAL "TRUE")
    set(_msg "${_msg} ()")
  endif()
  # optionally quiet the deprecation message
  if(NOT ${bt_runner_DEPRECATED_QUIET})
    message(DEPRECATION "${_msg}")
  endif()
endif()

# flag package as ament-based to distinguish it after being find_package()-ed
set(bt_runner_FOUND_AMENT_PACKAGE TRUE)

# include all config extra files
set(_extras "ament_cmake_export_include_directories-extras.cmake")
foreach(_extra ${_extras})
  include("${bt_runner_DIR}/${_extra}")
endforeach()
