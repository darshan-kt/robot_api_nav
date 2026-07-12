// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#ifndef HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__BUILDER_HPP_
#define HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_Goal_json_payload
{
public:
  explicit Init_ExecuteBehavior_Goal_json_payload(::hive_interfaces::action::ExecuteBehavior_Goal & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_Goal json_payload(::hive_interfaces::action::ExecuteBehavior_Goal::_json_payload_type arg)
  {
    msg_.json_payload = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Goal msg_;
};

class Init_ExecuteBehavior_Goal_pose
{
public:
  explicit Init_ExecuteBehavior_Goal_pose(::hive_interfaces::action::ExecuteBehavior_Goal & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Goal_json_payload pose(::hive_interfaces::action::ExecuteBehavior_Goal::_pose_type arg)
  {
    msg_.pose = std::move(arg);
    return Init_ExecuteBehavior_Goal_json_payload(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Goal msg_;
};

class Init_ExecuteBehavior_Goal_task_id
{
public:
  explicit Init_ExecuteBehavior_Goal_task_id(::hive_interfaces::action::ExecuteBehavior_Goal & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Goal_pose task_id(::hive_interfaces::action::ExecuteBehavior_Goal::_task_id_type arg)
  {
    msg_.task_id = std::move(arg);
    return Init_ExecuteBehavior_Goal_pose(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Goal msg_;
};

class Init_ExecuteBehavior_Goal_behavior_name
{
public:
  explicit Init_ExecuteBehavior_Goal_behavior_name(::hive_interfaces::action::ExecuteBehavior_Goal & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Goal_task_id behavior_name(::hive_interfaces::action::ExecuteBehavior_Goal::_behavior_name_type arg)
  {
    msg_.behavior_name = std::move(arg);
    return Init_ExecuteBehavior_Goal_task_id(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Goal msg_;
};

class Init_ExecuteBehavior_Goal_id
{
public:
  Init_ExecuteBehavior_Goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_Goal_behavior_name id(::hive_interfaces::action::ExecuteBehavior_Goal::_id_type arg)
  {
    msg_.id = std::move(arg);
    return Init_ExecuteBehavior_Goal_behavior_name(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Goal msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_Goal>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_Goal_id();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_Result_metrics_json
{
public:
  explicit Init_ExecuteBehavior_Result_metrics_json(::hive_interfaces::action::ExecuteBehavior_Result & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_Result metrics_json(::hive_interfaces::action::ExecuteBehavior_Result::_metrics_json_type arg)
  {
    msg_.metrics_json = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Result msg_;
};

class Init_ExecuteBehavior_Result_log_file
{
public:
  explicit Init_ExecuteBehavior_Result_log_file(::hive_interfaces::action::ExecuteBehavior_Result & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Result_metrics_json log_file(::hive_interfaces::action::ExecuteBehavior_Result::_log_file_type arg)
  {
    msg_.log_file = std::move(arg);
    return Init_ExecuteBehavior_Result_metrics_json(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Result msg_;
};

class Init_ExecuteBehavior_Result_outcome_text
{
public:
  explicit Init_ExecuteBehavior_Result_outcome_text(::hive_interfaces::action::ExecuteBehavior_Result & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Result_log_file outcome_text(::hive_interfaces::action::ExecuteBehavior_Result::_outcome_text_type arg)
  {
    msg_.outcome_text = std::move(arg);
    return Init_ExecuteBehavior_Result_log_file(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Result msg_;
};

class Init_ExecuteBehavior_Result_success
{
public:
  Init_ExecuteBehavior_Result_success()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_Result_outcome_text success(::hive_interfaces::action::ExecuteBehavior_Result::_success_type arg)
  {
    msg_.success = std::move(arg);
    return Init_ExecuteBehavior_Result_outcome_text(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Result msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_Result>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_Result_success();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_Feedback_comment
{
public:
  explicit Init_ExecuteBehavior_Feedback_comment(::hive_interfaces::action::ExecuteBehavior_Feedback & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_Feedback comment(::hive_interfaces::action::ExecuteBehavior_Feedback::_comment_type arg)
  {
    msg_.comment = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Feedback msg_;
};

class Init_ExecuteBehavior_Feedback_current_state
{
public:
  explicit Init_ExecuteBehavior_Feedback_current_state(::hive_interfaces::action::ExecuteBehavior_Feedback & msg)
  : msg_(msg)
  {}
  Init_ExecuteBehavior_Feedback_comment current_state(::hive_interfaces::action::ExecuteBehavior_Feedback::_current_state_type arg)
  {
    msg_.current_state = std::move(arg);
    return Init_ExecuteBehavior_Feedback_comment(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Feedback msg_;
};

class Init_ExecuteBehavior_Feedback_progress_percent
{
public:
  Init_ExecuteBehavior_Feedback_progress_percent()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_Feedback_current_state progress_percent(::hive_interfaces::action::ExecuteBehavior_Feedback::_progress_percent_type arg)
  {
    msg_.progress_percent = std::move(arg);
    return Init_ExecuteBehavior_Feedback_current_state(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_Feedback msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_Feedback>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_Feedback_progress_percent();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_SendGoal_Request_goal
{
public:
  explicit Init_ExecuteBehavior_SendGoal_Request_goal(::hive_interfaces::action::ExecuteBehavior_SendGoal_Request & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Request goal(::hive_interfaces::action::ExecuteBehavior_SendGoal_Request::_goal_type arg)
  {
    msg_.goal = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Request msg_;
};

class Init_ExecuteBehavior_SendGoal_Request_goal_id
{
public:
  Init_ExecuteBehavior_SendGoal_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_SendGoal_Request_goal goal_id(::hive_interfaces::action::ExecuteBehavior_SendGoal_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_ExecuteBehavior_SendGoal_Request_goal(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_SendGoal_Request>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_SendGoal_Request_goal_id();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_SendGoal_Response_stamp
{
public:
  explicit Init_ExecuteBehavior_SendGoal_Response_stamp(::hive_interfaces::action::ExecuteBehavior_SendGoal_Response & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Response stamp(::hive_interfaces::action::ExecuteBehavior_SendGoal_Response::_stamp_type arg)
  {
    msg_.stamp = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Response msg_;
};

class Init_ExecuteBehavior_SendGoal_Response_accepted
{
public:
  Init_ExecuteBehavior_SendGoal_Response_accepted()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_SendGoal_Response_stamp accepted(::hive_interfaces::action::ExecuteBehavior_SendGoal_Response::_accepted_type arg)
  {
    msg_.accepted = std::move(arg);
    return Init_ExecuteBehavior_SendGoal_Response_stamp(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_SendGoal_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_SendGoal_Response>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_SendGoal_Response_accepted();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_GetResult_Request_goal_id
{
public:
  Init_ExecuteBehavior_GetResult_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  ::hive_interfaces::action::ExecuteBehavior_GetResult_Request goal_id(::hive_interfaces::action::ExecuteBehavior_GetResult_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_GetResult_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_GetResult_Request>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_GetResult_Request_goal_id();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_GetResult_Response_result
{
public:
  explicit Init_ExecuteBehavior_GetResult_Response_result(::hive_interfaces::action::ExecuteBehavior_GetResult_Response & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_GetResult_Response result(::hive_interfaces::action::ExecuteBehavior_GetResult_Response::_result_type arg)
  {
    msg_.result = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_GetResult_Response msg_;
};

class Init_ExecuteBehavior_GetResult_Response_status
{
public:
  Init_ExecuteBehavior_GetResult_Response_status()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_GetResult_Response_result status(::hive_interfaces::action::ExecuteBehavior_GetResult_Response::_status_type arg)
  {
    msg_.status = std::move(arg);
    return Init_ExecuteBehavior_GetResult_Response_result(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_GetResult_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_GetResult_Response>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_GetResult_Response_status();
}

}  // namespace hive_interfaces


namespace hive_interfaces
{

namespace action
{

namespace builder
{

class Init_ExecuteBehavior_FeedbackMessage_feedback
{
public:
  explicit Init_ExecuteBehavior_FeedbackMessage_feedback(::hive_interfaces::action::ExecuteBehavior_FeedbackMessage & msg)
  : msg_(msg)
  {}
  ::hive_interfaces::action::ExecuteBehavior_FeedbackMessage feedback(::hive_interfaces::action::ExecuteBehavior_FeedbackMessage::_feedback_type arg)
  {
    msg_.feedback = std::move(arg);
    return std::move(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_FeedbackMessage msg_;
};

class Init_ExecuteBehavior_FeedbackMessage_goal_id
{
public:
  Init_ExecuteBehavior_FeedbackMessage_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_ExecuteBehavior_FeedbackMessage_feedback goal_id(::hive_interfaces::action::ExecuteBehavior_FeedbackMessage::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_ExecuteBehavior_FeedbackMessage_feedback(msg_);
  }

private:
  ::hive_interfaces::action::ExecuteBehavior_FeedbackMessage msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::hive_interfaces::action::ExecuteBehavior_FeedbackMessage>()
{
  return hive_interfaces::action::builder::Init_ExecuteBehavior_FeedbackMessage_goal_id();
}

}  // namespace hive_interfaces

#endif  // HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__BUILDER_HPP_
