// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#ifndef HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_H_
#define HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'behavior_name'
// Member 'task_id'
// Member 'json_payload'
#include "rosidl_runtime_c/string.h"
// Member 'pose'
#include "geometry_msgs/msg/detail/pose_stamped__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_Goal
{
  int32_t id;
  rosidl_runtime_c__String behavior_name;
  rosidl_runtime_c__String task_id;
  geometry_msgs__msg__PoseStamped pose;
  rosidl_runtime_c__String json_payload;
} hive_interfaces__action__ExecuteBehavior_Goal;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_Goal.
typedef struct hive_interfaces__action__ExecuteBehavior_Goal__Sequence
{
  hive_interfaces__action__ExecuteBehavior_Goal * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_Goal__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'outcome_text'
// Member 'log_file'
// Member 'metrics_json'
// already included above
// #include "rosidl_runtime_c/string.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_Result
{
  bool success;
  rosidl_runtime_c__String outcome_text;
  rosidl_runtime_c__String log_file;
  rosidl_runtime_c__String metrics_json;
} hive_interfaces__action__ExecuteBehavior_Result;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_Result.
typedef struct hive_interfaces__action__ExecuteBehavior_Result__Sequence
{
  hive_interfaces__action__ExecuteBehavior_Result * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_Result__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'current_state'
// Member 'comment'
// already included above
// #include "rosidl_runtime_c/string.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_Feedback
{
  float progress_percent;
  rosidl_runtime_c__String current_state;
  rosidl_runtime_c__String comment;
} hive_interfaces__action__ExecuteBehavior_Feedback;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_Feedback.
typedef struct hive_interfaces__action__ExecuteBehavior_Feedback__Sequence
{
  hive_interfaces__action__ExecuteBehavior_Feedback * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_Feedback__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'goal'
#include "hive_interfaces/action/detail/execute_behavior__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_SendGoal_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
  hive_interfaces__action__ExecuteBehavior_Goal goal;
} hive_interfaces__action__ExecuteBehavior_SendGoal_Request;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_SendGoal_Request.
typedef struct hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence
{
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_SendGoal_Response
{
  bool accepted;
  builtin_interfaces__msg__Time stamp;
} hive_interfaces__action__ExecuteBehavior_SendGoal_Response;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_SendGoal_Response.
typedef struct hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence
{
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_GetResult_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
} hive_interfaces__action__ExecuteBehavior_GetResult_Request;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_GetResult_Request.
typedef struct hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence
{
  hive_interfaces__action__ExecuteBehavior_GetResult_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'result'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_GetResult_Response
{
  int8_t status;
  hive_interfaces__action__ExecuteBehavior_Result result;
} hive_interfaces__action__ExecuteBehavior_GetResult_Response;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_GetResult_Response.
typedef struct hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence
{
  hive_interfaces__action__ExecuteBehavior_GetResult_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'feedback'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.h"

/// Struct defined in action/ExecuteBehavior in the package hive_interfaces.
typedef struct hive_interfaces__action__ExecuteBehavior_FeedbackMessage
{
  unique_identifier_msgs__msg__UUID goal_id;
  hive_interfaces__action__ExecuteBehavior_Feedback feedback;
} hive_interfaces__action__ExecuteBehavior_FeedbackMessage;

// Struct for a sequence of hive_interfaces__action__ExecuteBehavior_FeedbackMessage.
typedef struct hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence
{
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_H_
