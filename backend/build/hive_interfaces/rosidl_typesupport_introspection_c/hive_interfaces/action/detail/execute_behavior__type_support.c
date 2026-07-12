// generated from rosidl_typesupport_introspection_c/resource/idl__type_support.c.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#include <stddef.h>
#include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
#include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
#include "rosidl_typesupport_introspection_c/field_types.h"
#include "rosidl_typesupport_introspection_c/identifier.h"
#include "rosidl_typesupport_introspection_c/message_introspection.h"
#include "hive_interfaces/action/detail/execute_behavior__functions.h"
#include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `behavior_name`
// Member `task_id`
// Member `json_payload`
#include "rosidl_runtime_c/string_functions.h"
// Member `pose`
#include "geometry_msgs/msg/pose_stamped.h"
// Member `pose`
#include "geometry_msgs/msg/detail/pose_stamped__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_Goal__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_Goal__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_member_array[5] = {
  {
    "id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Goal, id),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "behavior_name",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Goal, behavior_name),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "task_id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Goal, task_id),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "pose",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Goal, pose),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "json_payload",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Goal, json_payload),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_Goal",  // message name
  5,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_Goal),
  hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Goal)() {
  hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_member_array[3].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, geometry_msgs, msg, PoseStamped)();
  if (!hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_Goal__rosidl_typesupport_introspection_c__ExecuteBehavior_Goal_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `outcome_text`
// Member `log_file`
// Member `metrics_json`
// already included above
// #include "rosidl_runtime_c/string_functions.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_Result__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_Result__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_member_array[4] = {
  {
    "success",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_BOOLEAN,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Result, success),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "outcome_text",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Result, outcome_text),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "log_file",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Result, log_file),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "metrics_json",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Result, metrics_json),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_Result",  // message name
  4,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_Result),
  hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Result)() {
  if (!hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_Result__rosidl_typesupport_introspection_c__ExecuteBehavior_Result_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `current_state`
// Member `comment`
// already included above
// #include "rosidl_runtime_c/string_functions.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_Feedback__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_Feedback__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_member_array[3] = {
  {
    "progress_percent",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Feedback, progress_percent),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "current_state",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Feedback, current_state),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "comment",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_Feedback, comment),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_Feedback",  // message name
  3,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_Feedback),
  hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Feedback)() {
  if (!hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_Feedback__rosidl_typesupport_introspection_c__ExecuteBehavior_Feedback_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `goal_id`
#include "unique_identifier_msgs/msg/uuid.h"
// Member `goal_id`
#include "unique_identifier_msgs/msg/detail/uuid__rosidl_typesupport_introspection_c.h"
// Member `goal`
#include "hive_interfaces/action/execute_behavior.h"
// Member `goal`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_member_array[2] = {
  {
    "goal_id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request, goal_id),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "goal",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request, goal),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_SendGoal_Request",  // message name
  2,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request),
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)() {
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_member_array[0].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, unique_identifier_msgs, msg, UUID)();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_member_array[1].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Goal)();
  if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_SendGoal_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `stamp`
#include "builtin_interfaces/msg/time.h"
// Member `stamp`
#include "builtin_interfaces/msg/detail/time__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_member_array[2] = {
  {
    "accepted",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_BOOLEAN,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response, accepted),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "stamp",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response, stamp),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_SendGoal_Response",  // message name
  2,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response),
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)() {
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_member_array[1].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, builtin_interfaces, msg, Time)();
  if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_SendGoal_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

#include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
#include "rosidl_typesupport_introspection_c/service_introspection.h"

// this is intentionally not const to allow initialization later to prevent an initialization race
static rosidl_typesupport_introspection_c__ServiceMembers hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_members = {
  "hive_interfaces__action",  // service namespace
  "ExecuteBehavior_SendGoal",  // service name
  // these two fields are initialized below on the first access
  NULL,  // request message
  // hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Request_message_type_support_handle,
  NULL  // response message
  // hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_Response_message_type_support_handle
};

static rosidl_service_type_support_t hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_type_support_handle = {
  0,
  &hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_members,
  get_service_typesupport_handle_function,
};

// Forward declaration of request/response type support functions
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)();

const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)();

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal)() {
  if (!hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  rosidl_typesupport_introspection_c__ServiceMembers * service_members =
    (rosidl_typesupport_introspection_c__ServiceMembers *)hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_type_support_handle.data;

  if (!service_members->request_members_) {
    service_members->request_members_ =
      (const rosidl_typesupport_introspection_c__MessageMembers *)
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)()->data;
  }
  if (!service_members->response_members_) {
    service_members->response_members_ =
      (const rosidl_typesupport_introspection_c__MessageMembers *)
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)()->data;
  }

  return &hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_SendGoal_service_type_support_handle;
}

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/uuid.h"
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_member_array[1] = {
  {
    "goal_id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_GetResult_Request, goal_id),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_GetResult_Request",  // message name
  1,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request),
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Request)() {
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_member_array[0].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, unique_identifier_msgs, msg, UUID)();
  if (!hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_GetResult_Request__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `result`
// already included above
// #include "hive_interfaces/action/execute_behavior.h"
// Member `result`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_member_array[2] = {
  {
    "status",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT8,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_GetResult_Response, status),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "result",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_GetResult_Response, result),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_GetResult_Response",  // message name
  2,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response),
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Response)() {
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_member_array[1].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Result)();
  if (!hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_GetResult_Response__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif

// already included above
// #include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/service_introspection.h"

// this is intentionally not const to allow initialization later to prevent an initialization race
static rosidl_typesupport_introspection_c__ServiceMembers hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_members = {
  "hive_interfaces__action",  // service namespace
  "ExecuteBehavior_GetResult",  // service name
  // these two fields are initialized below on the first access
  NULL,  // request message
  // hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Request_message_type_support_handle,
  NULL  // response message
  // hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_Response_message_type_support_handle
};

static rosidl_service_type_support_t hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_type_support_handle = {
  0,
  &hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_members,
  get_service_typesupport_handle_function,
};

// Forward declaration of request/response type support functions
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Request)();

const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Response)();

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult)() {
  if (!hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  rosidl_typesupport_introspection_c__ServiceMembers * service_members =
    (rosidl_typesupport_introspection_c__ServiceMembers *)hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_type_support_handle.data;

  if (!service_members->request_members_) {
    service_members->request_members_ =
      (const rosidl_typesupport_introspection_c__MessageMembers *)
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Request)()->data;
  }
  if (!service_members->response_members_) {
    service_members->response_members_ =
      (const rosidl_typesupport_introspection_c__MessageMembers *)
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_GetResult_Response)()->data;
  }

  return &hive_interfaces__action__detail__execute_behavior__rosidl_typesupport_introspection_c__ExecuteBehavior_GetResult_service_type_support_handle;
}

// already included above
// #include <stddef.h>
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"
// already included above
// #include "hive_interfaces/msg/rosidl_typesupport_introspection_c__visibility_control.h"
// already included above
// #include "rosidl_typesupport_introspection_c/field_types.h"
// already included above
// #include "rosidl_typesupport_introspection_c/identifier.h"
// already included above
// #include "rosidl_typesupport_introspection_c/message_introspection.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/uuid.h"
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__rosidl_typesupport_introspection_c.h"
// Member `feedback`
// already included above
// #include "hive_interfaces/action/execute_behavior.h"
// Member `feedback`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(message_memory);
}

void hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_fini_function(void * message_memory)
{
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(message_memory);
}

static rosidl_typesupport_introspection_c__MessageMember hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_member_array[2] = {
  {
    "goal_id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage, goal_id),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "feedback",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage, feedback),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_members = {
  "hive_interfaces__action",  // message namespace
  "ExecuteBehavior_FeedbackMessage",  // message name
  2,  // number of fields
  sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage),
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_member_array,  // message members
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_init_function,  // function to initialize message memory (memory has to be allocated)
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_type_support_handle = {
  0,
  &hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_hive_interfaces
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_FeedbackMessage)() {
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_member_array[0].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, unique_identifier_msgs, msg, UUID)();
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_member_array[1].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, hive_interfaces, action, ExecuteBehavior_Feedback)();
  if (!hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_type_support_handle.typesupport_identifier) {
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &hive_interfaces__action__ExecuteBehavior_FeedbackMessage__rosidl_typesupport_introspection_c__ExecuteBehavior_FeedbackMessage_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif
