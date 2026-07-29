// generated from rosidl_generator_cpp/resource/idl__struct.hpp.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#ifndef HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_HPP_
#define HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_HPP_

#include <algorithm>
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "rosidl_runtime_cpp/bounded_vector.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


// Include directives for member types
// Member 'pose'
#include "geometry_msgs/msg/detail/pose_stamped__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Goal __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Goal __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_Goal_
{
  using Type = ExecuteBehavior_Goal_<ContainerAllocator>;

  explicit ExecuteBehavior_Goal_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : pose(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->id = 0l;
      this->behavior_name = "";
      this->task_id = "";
      this->json_payload = "";
    }
  }

  explicit ExecuteBehavior_Goal_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : behavior_name(_alloc),
    task_id(_alloc),
    pose(_alloc, _init),
    json_payload(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->id = 0l;
      this->behavior_name = "";
      this->task_id = "";
      this->json_payload = "";
    }
  }

  // field types and members
  using _id_type =
    int32_t;
  _id_type id;
  using _behavior_name_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _behavior_name_type behavior_name;
  using _task_id_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _task_id_type task_id;
  using _pose_type =
    geometry_msgs::msg::PoseStamped_<ContainerAllocator>;
  _pose_type pose;
  using _json_payload_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _json_payload_type json_payload;

  // setters for named parameter idiom
  Type & set__id(
    const int32_t & _arg)
  {
    this->id = _arg;
    return *this;
  }
  Type & set__behavior_name(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->behavior_name = _arg;
    return *this;
  }
  Type & set__task_id(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->task_id = _arg;
    return *this;
  }
  Type & set__pose(
    const geometry_msgs::msg::PoseStamped_<ContainerAllocator> & _arg)
  {
    this->pose = _arg;
    return *this;
  }
  Type & set__json_payload(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->json_payload = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Goal
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Goal
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_Goal_ & other) const
  {
    if (this->id != other.id) {
      return false;
    }
    if (this->behavior_name != other.behavior_name) {
      return false;
    }
    if (this->task_id != other.task_id) {
      return false;
    }
    if (this->pose != other.pose) {
      return false;
    }
    if (this->json_payload != other.json_payload) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_Goal_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_Goal_

// alias to use template instance with default allocator
using ExecuteBehavior_Goal =
  hive_interfaces::action::ExecuteBehavior_Goal_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces


#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Result __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Result __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_Result_
{
  using Type = ExecuteBehavior_Result_<ContainerAllocator>;

  explicit ExecuteBehavior_Result_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->success = false;
      this->outcome_text = "";
      this->log_file = "";
      this->metrics_json = "";
    }
  }

  explicit ExecuteBehavior_Result_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : outcome_text(_alloc),
    log_file(_alloc),
    metrics_json(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->success = false;
      this->outcome_text = "";
      this->log_file = "";
      this->metrics_json = "";
    }
  }

  // field types and members
  using _success_type =
    bool;
  _success_type success;
  using _outcome_text_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _outcome_text_type outcome_text;
  using _log_file_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _log_file_type log_file;
  using _metrics_json_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _metrics_json_type metrics_json;

  // setters for named parameter idiom
  Type & set__success(
    const bool & _arg)
  {
    this->success = _arg;
    return *this;
  }
  Type & set__outcome_text(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->outcome_text = _arg;
    return *this;
  }
  Type & set__log_file(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->log_file = _arg;
    return *this;
  }
  Type & set__metrics_json(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->metrics_json = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Result
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Result
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_Result_ & other) const
  {
    if (this->success != other.success) {
      return false;
    }
    if (this->outcome_text != other.outcome_text) {
      return false;
    }
    if (this->log_file != other.log_file) {
      return false;
    }
    if (this->metrics_json != other.metrics_json) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_Result_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_Result_

// alias to use template instance with default allocator
using ExecuteBehavior_Result =
  hive_interfaces::action::ExecuteBehavior_Result_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces


#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Feedback __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_Feedback __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_Feedback_
{
  using Type = ExecuteBehavior_Feedback_<ContainerAllocator>;

  explicit ExecuteBehavior_Feedback_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->progress_percent = 0.0f;
      this->current_state = "";
      this->comment = "";
    }
  }

  explicit ExecuteBehavior_Feedback_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : current_state(_alloc),
    comment(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->progress_percent = 0.0f;
      this->current_state = "";
      this->comment = "";
    }
  }

  // field types and members
  using _progress_percent_type =
    float;
  _progress_percent_type progress_percent;
  using _current_state_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _current_state_type current_state;
  using _comment_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _comment_type comment;

  // setters for named parameter idiom
  Type & set__progress_percent(
    const float & _arg)
  {
    this->progress_percent = _arg;
    return *this;
  }
  Type & set__current_state(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->current_state = _arg;
    return *this;
  }
  Type & set__comment(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->comment = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Feedback
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_Feedback
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_Feedback_ & other) const
  {
    if (this->progress_percent != other.progress_percent) {
      return false;
    }
    if (this->current_state != other.current_state) {
      return false;
    }
    if (this->comment != other.comment) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_Feedback_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_Feedback_

// alias to use template instance with default allocator
using ExecuteBehavior_Feedback =
  hive_interfaces::action::ExecuteBehavior_Feedback_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces


// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"
// Member 'goal'
#include "hive_interfaces/action/detail/execute_behavior__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Request __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Request __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_SendGoal_Request_
{
  using Type = ExecuteBehavior_SendGoal_Request_<ContainerAllocator>;

  explicit ExecuteBehavior_SendGoal_Request_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init),
    goal(_init)
  {
    (void)_init;
  }

  explicit ExecuteBehavior_SendGoal_Request_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init),
    goal(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;
  using _goal_type =
    hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator>;
  _goal_type goal;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }
  Type & set__goal(
    const hive_interfaces::action::ExecuteBehavior_Goal_<ContainerAllocator> & _arg)
  {
    this->goal = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Request
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Request
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_SendGoal_Request_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    if (this->goal != other.goal) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_SendGoal_Request_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_SendGoal_Request_

// alias to use template instance with default allocator
using ExecuteBehavior_SendGoal_Request =
  hive_interfaces::action::ExecuteBehavior_SendGoal_Request_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces


// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Response __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Response __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_SendGoal_Response_
{
  using Type = ExecuteBehavior_SendGoal_Response_<ContainerAllocator>;

  explicit ExecuteBehavior_SendGoal_Response_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->accepted = false;
    }
  }

  explicit ExecuteBehavior_SendGoal_Response_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_alloc, _init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->accepted = false;
    }
  }

  // field types and members
  using _accepted_type =
    bool;
  _accepted_type accepted;
  using _stamp_type =
    builtin_interfaces::msg::Time_<ContainerAllocator>;
  _stamp_type stamp;

  // setters for named parameter idiom
  Type & set__accepted(
    const bool & _arg)
  {
    this->accepted = _arg;
    return *this;
  }
  Type & set__stamp(
    const builtin_interfaces::msg::Time_<ContainerAllocator> & _arg)
  {
    this->stamp = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Response
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_SendGoal_Response
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_SendGoal_Response_ & other) const
  {
    if (this->accepted != other.accepted) {
      return false;
    }
    if (this->stamp != other.stamp) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_SendGoal_Response_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_SendGoal_Response_

// alias to use template instance with default allocator
using ExecuteBehavior_SendGoal_Response =
  hive_interfaces::action::ExecuteBehavior_SendGoal_Response_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces

namespace hive_interfaces
{

namespace action
{

struct ExecuteBehavior_SendGoal
{
  using Request = hive_interfaces::action::ExecuteBehavior_SendGoal_Request;
  using Response = hive_interfaces::action::ExecuteBehavior_SendGoal_Response;
};

}  // namespace action

}  // namespace hive_interfaces


// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Request __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Request __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_GetResult_Request_
{
  using Type = ExecuteBehavior_GetResult_Request_<ContainerAllocator>;

  explicit ExecuteBehavior_GetResult_Request_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init)
  {
    (void)_init;
  }

  explicit ExecuteBehavior_GetResult_Request_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Request
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Request
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Request_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_GetResult_Request_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_GetResult_Request_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_GetResult_Request_

// alias to use template instance with default allocator
using ExecuteBehavior_GetResult_Request =
  hive_interfaces::action::ExecuteBehavior_GetResult_Request_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces


// Include directives for member types
// Member 'result'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Response __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Response __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_GetResult_Response_
{
  using Type = ExecuteBehavior_GetResult_Response_<ContainerAllocator>;

  explicit ExecuteBehavior_GetResult_Response_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : result(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->status = 0;
    }
  }

  explicit ExecuteBehavior_GetResult_Response_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : result(_alloc, _init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->status = 0;
    }
  }

  // field types and members
  using _status_type =
    int8_t;
  _status_type status;
  using _result_type =
    hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator>;
  _result_type result;

  // setters for named parameter idiom
  Type & set__status(
    const int8_t & _arg)
  {
    this->status = _arg;
    return *this;
  }
  Type & set__result(
    const hive_interfaces::action::ExecuteBehavior_Result_<ContainerAllocator> & _arg)
  {
    this->result = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Response
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_GetResult_Response
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_GetResult_Response_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_GetResult_Response_ & other) const
  {
    if (this->status != other.status) {
      return false;
    }
    if (this->result != other.result) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_GetResult_Response_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_GetResult_Response_

// alias to use template instance with default allocator
using ExecuteBehavior_GetResult_Response =
  hive_interfaces::action::ExecuteBehavior_GetResult_Response_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces

namespace hive_interfaces
{

namespace action
{

struct ExecuteBehavior_GetResult
{
  using Request = hive_interfaces::action::ExecuteBehavior_GetResult_Request;
  using Response = hive_interfaces::action::ExecuteBehavior_GetResult_Response;
};

}  // namespace action

}  // namespace hive_interfaces


// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"
// Member 'feedback'
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_FeedbackMessage __attribute__((deprecated))
#else
# define DEPRECATED__hive_interfaces__action__ExecuteBehavior_FeedbackMessage __declspec(deprecated)
#endif

namespace hive_interfaces
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct ExecuteBehavior_FeedbackMessage_
{
  using Type = ExecuteBehavior_FeedbackMessage_<ContainerAllocator>;

  explicit ExecuteBehavior_FeedbackMessage_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init),
    feedback(_init)
  {
    (void)_init;
  }

  explicit ExecuteBehavior_FeedbackMessage_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init),
    feedback(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;
  using _feedback_type =
    hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator>;
  _feedback_type feedback;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }
  Type & set__feedback(
    const hive_interfaces::action::ExecuteBehavior_Feedback_<ContainerAllocator> & _arg)
  {
    this->feedback = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> *;
  using ConstRawPtr =
    const hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_FeedbackMessage
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__hive_interfaces__action__ExecuteBehavior_FeedbackMessage
    std::shared_ptr<hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const ExecuteBehavior_FeedbackMessage_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    if (this->feedback != other.feedback) {
      return false;
    }
    return true;
  }
  bool operator!=(const ExecuteBehavior_FeedbackMessage_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct ExecuteBehavior_FeedbackMessage_

// alias to use template instance with default allocator
using ExecuteBehavior_FeedbackMessage =
  hive_interfaces::action::ExecuteBehavior_FeedbackMessage_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace hive_interfaces

#include "action_msgs/srv/cancel_goal.hpp"
#include "action_msgs/msg/goal_info.hpp"
#include "action_msgs/msg/goal_status_array.hpp"

namespace hive_interfaces
{

namespace action
{

struct ExecuteBehavior
{
  /// The goal message defined in the action definition.
  using Goal = hive_interfaces::action::ExecuteBehavior_Goal;
  /// The result message defined in the action definition.
  using Result = hive_interfaces::action::ExecuteBehavior_Result;
  /// The feedback message defined in the action definition.
  using Feedback = hive_interfaces::action::ExecuteBehavior_Feedback;

  struct Impl
  {
    /// The send_goal service using a wrapped version of the goal message as a request.
    using SendGoalService = hive_interfaces::action::ExecuteBehavior_SendGoal;
    /// The get_result service using a wrapped version of the result message as a response.
    using GetResultService = hive_interfaces::action::ExecuteBehavior_GetResult;
    /// The feedback message with generic fields which wraps the feedback message.
    using FeedbackMessage = hive_interfaces::action::ExecuteBehavior_FeedbackMessage;

    /// The generic service to cancel a goal.
    using CancelGoalService = action_msgs::srv::CancelGoal;
    /// The generic message for the status of a goal.
    using GoalStatusMessage = action_msgs::msg::GoalStatusArray;
  };
};

typedef struct ExecuteBehavior ExecuteBehavior;

}  // namespace action

}  // namespace hive_interfaces

#endif  // HIVE_INTERFACES__ACTION__DETAIL__EXECUTE_BEHAVIOR__STRUCT_HPP_
