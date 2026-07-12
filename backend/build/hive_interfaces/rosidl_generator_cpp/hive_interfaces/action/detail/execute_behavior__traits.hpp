// generated from rosidl_generator_cpp/resource/idl__traits.hpp.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#ifndef HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__TRAITS_HPP_
#define HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__TRAITS_HPP_

#include <stdint.h>

#include <sstream>
#include <string>
#include <type_traits>

#include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
#include "rosidl_runtime_cpp/traits.hpp"

// Include directives for member types
// Member 'pose'
#include "geometry_msgs/msg/detail/pose_stamped__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_Goal & msg,
  std::ostream & out)
{
  out << "{";
  // member: id
  {
    out << "id: ";
    rosidl_generator_traits::value_to_yaml(msg.id, out);
    out << ", ";
  }

  // member: behavior_name
  {
    out << "behavior_name: ";
    rosidl_generator_traits::value_to_yaml(msg.behavior_name, out);
    out << ", ";
  }

  // member: task_id
  {
    out << "task_id: ";
    rosidl_generator_traits::value_to_yaml(msg.task_id, out);
    out << ", ";
  }

  // member: pose
  {
    out << "pose: ";
    to_flow_style_yaml(msg.pose, out);
    out << ", ";
  }

  // member: json_payload
  {
    out << "json_payload: ";
    rosidl_generator_traits::value_to_yaml(msg.json_payload, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_Goal & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "id: ";
    rosidl_generator_traits::value_to_yaml(msg.id, out);
    out << "\n";
  }

  // member: behavior_name
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "behavior_name: ";
    rosidl_generator_traits::value_to_yaml(msg.behavior_name, out);
    out << "\n";
  }

  // member: task_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "task_id: ";
    rosidl_generator_traits::value_to_yaml(msg.task_id, out);
    out << "\n";
  }

  // member: pose
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "pose:\n";
    to_block_style_yaml(msg.pose, out, indentation + 2);
  }

  // member: json_payload
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "json_payload: ";
    rosidl_generator_traits::value_to_yaml(msg.json_payload, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_Goal & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_Goal & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_Goal & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_Goal>()
{
  return "hive_interfaces::action::ExecuteBehavior_Goal";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_Goal>()
{
  return "hive_interfaces/action/ExecuteBehavior_Goal";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_Goal>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_Goal>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_Goal>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_Result & msg,
  std::ostream & out)
{
  out << "{";
  // member: success
  {
    out << "success: ";
    rosidl_generator_traits::value_to_yaml(msg.success, out);
    out << ", ";
  }

  // member: outcome_text
  {
    out << "outcome_text: ";
    rosidl_generator_traits::value_to_yaml(msg.outcome_text, out);
    out << ", ";
  }

  // member: log_file
  {
    out << "log_file: ";
    rosidl_generator_traits::value_to_yaml(msg.log_file, out);
    out << ", ";
  }

  // member: metrics_json
  {
    out << "metrics_json: ";
    rosidl_generator_traits::value_to_yaml(msg.metrics_json, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_Result & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: success
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "success: ";
    rosidl_generator_traits::value_to_yaml(msg.success, out);
    out << "\n";
  }

  // member: outcome_text
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "outcome_text: ";
    rosidl_generator_traits::value_to_yaml(msg.outcome_text, out);
    out << "\n";
  }

  // member: log_file
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "log_file: ";
    rosidl_generator_traits::value_to_yaml(msg.log_file, out);
    out << "\n";
  }

  // member: metrics_json
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "metrics_json: ";
    rosidl_generator_traits::value_to_yaml(msg.metrics_json, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_Result & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_Result & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_Result & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_Result>()
{
  return "hive_interfaces::action::ExecuteBehavior_Result";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_Result>()
{
  return "hive_interfaces/action/ExecuteBehavior_Result";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_Result>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_Result>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_Result>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_Feedback & msg,
  std::ostream & out)
{
  out << "{";
  // member: progress_percent
  {
    out << "progress_percent: ";
    rosidl_generator_traits::value_to_yaml(msg.progress_percent, out);
    out << ", ";
  }

  // member: current_state
  {
    out << "current_state: ";
    rosidl_generator_traits::value_to_yaml(msg.current_state, out);
    out << ", ";
  }

  // member: comment
  {
    out << "comment: ";
    rosidl_generator_traits::value_to_yaml(msg.comment, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_Feedback & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: progress_percent
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "progress_percent: ";
    rosidl_generator_traits::value_to_yaml(msg.progress_percent, out);
    out << "\n";
  }

  // member: current_state
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "current_state: ";
    rosidl_generator_traits::value_to_yaml(msg.current_state, out);
    out << "\n";
  }

  // member: comment
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "comment: ";
    rosidl_generator_traits::value_to_yaml(msg.comment, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_Feedback & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_Feedback & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_Feedback & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_Feedback>()
{
  return "hive_interfaces::action::ExecuteBehavior_Feedback";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_Feedback>()
{
  return "hive_interfaces/action/ExecuteBehavior_Feedback";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_Feedback>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_Feedback>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_Feedback>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"
// Member 'goal'
#include "hive_interfaces/action/detail/execute_behavior__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_SendGoal_Request & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
    out << ", ";
  }

  // member: goal
  {
    out << "goal: ";
    to_flow_style_yaml(msg.goal, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_SendGoal_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }

  // member: goal
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal:\n";
    to_block_style_yaml(msg.goal, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_SendGoal_Request & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_SendGoal_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_SendGoal_Request & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>()
{
  return "hive_interfaces::action::ExecuteBehavior_SendGoal_Request";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>()
{
  return "hive_interfaces/action/ExecuteBehavior_SendGoal_Request";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>
  : std::integral_constant<bool, has_fixed_size<hive_interfaces::action::ExecuteBehavior_Goal>::value && has_fixed_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>
  : std::integral_constant<bool, has_bounded_size<hive_interfaces::action::ExecuteBehavior_Goal>::value && has_bounded_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_SendGoal_Response & msg,
  std::ostream & out)
{
  out << "{";
  // member: accepted
  {
    out << "accepted: ";
    rosidl_generator_traits::value_to_yaml(msg.accepted, out);
    out << ", ";
  }

  // member: stamp
  {
    out << "stamp: ";
    to_flow_style_yaml(msg.stamp, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_SendGoal_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: accepted
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "accepted: ";
    rosidl_generator_traits::value_to_yaml(msg.accepted, out);
    out << "\n";
  }

  // member: stamp
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "stamp:\n";
    to_block_style_yaml(msg.stamp, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_SendGoal_Response & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_SendGoal_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_SendGoal_Response & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>()
{
  return "hive_interfaces::action::ExecuteBehavior_SendGoal_Response";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>()
{
  return "hive_interfaces/action/ExecuteBehavior_SendGoal_Response";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>
  : std::integral_constant<bool, has_fixed_size<builtin_interfaces::msg::Time>::value> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>
  : std::integral_constant<bool, has_bounded_size<builtin_interfaces::msg::Time>::value> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace rosidl_generator_traits
{

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_SendGoal>()
{
  return "hive_interfaces::action::ExecuteBehavior_SendGoal";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_SendGoal>()
{
  return "hive_interfaces/action/ExecuteBehavior_SendGoal";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_SendGoal>
  : std::integral_constant<
    bool,
    has_fixed_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>::value &&
    has_fixed_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>::value
  >
{
};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_SendGoal>
  : std::integral_constant<
    bool,
    has_bounded_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>::value &&
    has_bounded_size<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>::value
  >
{
};

template<>
struct is_service<hive_interfaces::action::ExecuteBehavior_SendGoal>
  : std::true_type
{
};

template<>
struct is_service_request<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>
  : std::true_type
{
};

template<>
struct is_service_response<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_GetResult_Request & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_GetResult_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_GetResult_Request & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_GetResult_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_GetResult_Request & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_GetResult_Request>()
{
  return "hive_interfaces::action::ExecuteBehavior_GetResult_Request";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_GetResult_Request>()
{
  return "hive_interfaces/action/ExecuteBehavior_GetResult_Request";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_GetResult_Request>
  : std::integral_constant<bool, has_fixed_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_GetResult_Request>
  : std::integral_constant<bool, has_bounded_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_GetResult_Request>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'result'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_GetResult_Response & msg,
  std::ostream & out)
{
  out << "{";
  // member: status
  {
    out << "status: ";
    rosidl_generator_traits::value_to_yaml(msg.status, out);
    out << ", ";
  }

  // member: result
  {
    out << "result: ";
    to_flow_style_yaml(msg.result, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_GetResult_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: status
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "status: ";
    rosidl_generator_traits::value_to_yaml(msg.status, out);
    out << "\n";
  }

  // member: result
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "result:\n";
    to_block_style_yaml(msg.result, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_GetResult_Response & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_GetResult_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_GetResult_Response & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_GetResult_Response>()
{
  return "hive_interfaces::action::ExecuteBehavior_GetResult_Response";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_GetResult_Response>()
{
  return "hive_interfaces/action/ExecuteBehavior_GetResult_Response";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_GetResult_Response>
  : std::integral_constant<bool, has_fixed_size<hive_interfaces::action::ExecuteBehavior_Result>::value> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_GetResult_Response>
  : std::integral_constant<bool, has_bounded_size<hive_interfaces::action::ExecuteBehavior_Result>::value> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_GetResult_Response>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace rosidl_generator_traits
{

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_GetResult>()
{
  return "hive_interfaces::action::ExecuteBehavior_GetResult";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_GetResult>()
{
  return "hive_interfaces/action/ExecuteBehavior_GetResult";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_GetResult>
  : std::integral_constant<
    bool,
    has_fixed_size<hive_interfaces::action::ExecuteBehavior_GetResult_Request>::value &&
    has_fixed_size<hive_interfaces::action::ExecuteBehavior_GetResult_Response>::value
  >
{
};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_GetResult>
  : std::integral_constant<
    bool,
    has_bounded_size<hive_interfaces::action::ExecuteBehavior_GetResult_Request>::value &&
    has_bounded_size<hive_interfaces::action::ExecuteBehavior_GetResult_Response>::value
  >
{
};

template<>
struct is_service<hive_interfaces::action::ExecuteBehavior_GetResult>
  : std::true_type
{
};

template<>
struct is_service_request<hive_interfaces::action::ExecuteBehavior_GetResult_Request>
  : std::true_type
{
};

template<>
struct is_service_response<hive_interfaces::action::ExecuteBehavior_GetResult_Response>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"
// Member 'feedback'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__traits.hpp"

namespace hive_interfaces
{

namespace action
{

inline void to_flow_style_yaml(
  const ExecuteBehavior_FeedbackMessage & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
    out << ", ";
  }

  // member: feedback
  {
    out << "feedback: ";
    to_flow_style_yaml(msg.feedback, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const ExecuteBehavior_FeedbackMessage & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }

  // member: feedback
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "feedback:\n";
    to_block_style_yaml(msg.feedback, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const ExecuteBehavior_FeedbackMessage & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_generator_traits
{

[[deprecated("use hive_interfaces::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const hive_interfaces::action::ExecuteBehavior_FeedbackMessage & msg,
  std::ostream & out, size_t indentation = 0)
{
  hive_interfaces::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use hive_interfaces::action::to_yaml() instead")]]
inline std::string to_yaml(const hive_interfaces::action::ExecuteBehavior_FeedbackMessage & msg)
{
  return hive_interfaces::action::to_yaml(msg);
}

template<>
inline const char * data_type<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>()
{
  return "hive_interfaces::action::ExecuteBehavior_FeedbackMessage";
}

template<>
inline const char * name<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>()
{
  return "hive_interfaces/action/ExecuteBehavior_FeedbackMessage";
}

template<>
struct has_fixed_size<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>
  : std::integral_constant<bool, has_fixed_size<hive_interfaces::action::ExecuteBehavior_Feedback>::value && has_fixed_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct has_bounded_size<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>
  : std::integral_constant<bool, has_bounded_size<hive_interfaces::action::ExecuteBehavior_Feedback>::value && has_bounded_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct is_message<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>
  : std::true_type {};

}  // namespace rosidl_generator_traits


namespace rosidl_generator_traits
{

template<>
struct is_action<hive_interfaces::action::ExecuteBehavior>
  : std::true_type
{
};

template<>
struct is_action_goal<hive_interfaces::action::ExecuteBehavior_Goal>
  : std::true_type
{
};

template<>
struct is_action_result<hive_interfaces::action::ExecuteBehavior_Result>
  : std::true_type
{
};

template<>
struct is_action_feedback<hive_interfaces::action::ExecuteBehavior_Feedback>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits


#endif  // HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__TRAITS_HPP_
