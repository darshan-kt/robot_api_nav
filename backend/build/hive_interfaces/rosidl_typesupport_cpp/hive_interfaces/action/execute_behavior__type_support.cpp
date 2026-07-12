// generated from rosidl_typesupport_cpp/resource/idl__type_support.cpp.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice

#include "cstddef"
#include "rosidl_runtime_c/message_type_support_struct.h"
#include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
#include "rosidl_typesupport_cpp/identifier.hpp"
#include "rosidl_typesupport_cpp/message_type_support.hpp"
#include "rosidl_typesupport_c/type_support_map.h"
#include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
#include "rosidl_typesupport_cpp/visibility_control.h"
#include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_Goal_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_Goal_type_support_ids_t;

static const _ExecuteBehavior_Goal_type_support_ids_t _ExecuteBehavior_Goal_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_Goal_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_Goal_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_Goal_type_support_symbol_names_t _ExecuteBehavior_Goal_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_Goal)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_Goal)),
  }
};

typedef struct _ExecuteBehavior_Goal_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_Goal_type_support_data_t;

static _ExecuteBehavior_Goal_type_support_data_t _ExecuteBehavior_Goal_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_Goal_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_Goal_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_Goal_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_Goal_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_Goal_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_Goal_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Goal>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_Goal_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_Goal)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Goal>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_Result_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_Result_type_support_ids_t;

static const _ExecuteBehavior_Result_type_support_ids_t _ExecuteBehavior_Result_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_Result_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_Result_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_Result_type_support_symbol_names_t _ExecuteBehavior_Result_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_Result)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_Result)),
  }
};

typedef struct _ExecuteBehavior_Result_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_Result_type_support_data_t;

static _ExecuteBehavior_Result_type_support_data_t _ExecuteBehavior_Result_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_Result_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_Result_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_Result_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_Result_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_Result_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_Result_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Result>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_Result_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_Result)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Result>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_Feedback_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_Feedback_type_support_ids_t;

static const _ExecuteBehavior_Feedback_type_support_ids_t _ExecuteBehavior_Feedback_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_Feedback_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_Feedback_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_Feedback_type_support_symbol_names_t _ExecuteBehavior_Feedback_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_Feedback)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_Feedback)),
  }
};

typedef struct _ExecuteBehavior_Feedback_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_Feedback_type_support_data_t;

static _ExecuteBehavior_Feedback_type_support_data_t _ExecuteBehavior_Feedback_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_Feedback_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_Feedback_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_Feedback_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_Feedback_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_Feedback_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_Feedback_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Feedback>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_Feedback_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_Feedback)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_Feedback>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_SendGoal_Request_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_SendGoal_Request_type_support_ids_t;

static const _ExecuteBehavior_SendGoal_Request_type_support_ids_t _ExecuteBehavior_SendGoal_Request_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_SendGoal_Request_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_SendGoal_Request_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_SendGoal_Request_type_support_symbol_names_t _ExecuteBehavior_SendGoal_Request_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)),
  }
};

typedef struct _ExecuteBehavior_SendGoal_Request_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_SendGoal_Request_type_support_data_t;

static _ExecuteBehavior_SendGoal_Request_type_support_data_t _ExecuteBehavior_SendGoal_Request_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_SendGoal_Request_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_SendGoal_Request_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_SendGoal_Request_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_SendGoal_Request_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_SendGoal_Request_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_SendGoal_Request_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_SendGoal_Request_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Request)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal_Request>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_SendGoal_Response_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_SendGoal_Response_type_support_ids_t;

static const _ExecuteBehavior_SendGoal_Response_type_support_ids_t _ExecuteBehavior_SendGoal_Response_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_SendGoal_Response_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_SendGoal_Response_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_SendGoal_Response_type_support_symbol_names_t _ExecuteBehavior_SendGoal_Response_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)),
  }
};

typedef struct _ExecuteBehavior_SendGoal_Response_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_SendGoal_Response_type_support_data_t;

static _ExecuteBehavior_SendGoal_Response_type_support_data_t _ExecuteBehavior_SendGoal_Response_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_SendGoal_Response_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_SendGoal_Response_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_SendGoal_Response_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_SendGoal_Response_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_SendGoal_Response_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_SendGoal_Response_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_SendGoal_Response_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal_Response)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal_Response>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
#include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
#include "rosidl_typesupport_cpp/service_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
#include "rosidl_typesupport_cpp/service_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_SendGoal_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_SendGoal_type_support_ids_t;

static const _ExecuteBehavior_SendGoal_type_support_ids_t _ExecuteBehavior_SendGoal_service_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_SendGoal_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_SendGoal_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_SendGoal_type_support_symbol_names_t _ExecuteBehavior_SendGoal_service_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal)),
  }
};

typedef struct _ExecuteBehavior_SendGoal_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_SendGoal_type_support_data_t;

static _ExecuteBehavior_SendGoal_type_support_data_t _ExecuteBehavior_SendGoal_service_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_SendGoal_service_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_SendGoal_service_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_SendGoal_service_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_SendGoal_service_typesupport_data.data[0],
};

static const rosidl_service_type_support_t ExecuteBehavior_SendGoal_service_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_SendGoal_service_typesupport_map),
  ::rosidl_typesupport_cpp::get_service_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
get_service_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_SendGoal_service_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_SendGoal)() {
  return ::rosidl_typesupport_cpp::get_service_type_support_handle<hive_interfaces::action::ExecuteBehavior_SendGoal>();
}

#ifdef __cplusplus
}
#endif

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_GetResult_Request_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_GetResult_Request_type_support_ids_t;

static const _ExecuteBehavior_GetResult_Request_type_support_ids_t _ExecuteBehavior_GetResult_Request_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_GetResult_Request_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_GetResult_Request_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_GetResult_Request_type_support_symbol_names_t _ExecuteBehavior_GetResult_Request_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Request)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Request)),
  }
};

typedef struct _ExecuteBehavior_GetResult_Request_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_GetResult_Request_type_support_data_t;

static _ExecuteBehavior_GetResult_Request_type_support_data_t _ExecuteBehavior_GetResult_Request_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_GetResult_Request_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_GetResult_Request_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_GetResult_Request_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_GetResult_Request_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_GetResult_Request_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_GetResult_Request_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult_Request>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_GetResult_Request_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Request)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult_Request>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_GetResult_Response_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_GetResult_Response_type_support_ids_t;

static const _ExecuteBehavior_GetResult_Response_type_support_ids_t _ExecuteBehavior_GetResult_Response_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_GetResult_Response_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_GetResult_Response_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_GetResult_Response_type_support_symbol_names_t _ExecuteBehavior_GetResult_Response_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Response)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Response)),
  }
};

typedef struct _ExecuteBehavior_GetResult_Response_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_GetResult_Response_type_support_data_t;

static _ExecuteBehavior_GetResult_Response_type_support_data_t _ExecuteBehavior_GetResult_Response_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_GetResult_Response_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_GetResult_Response_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_GetResult_Response_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_GetResult_Response_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_GetResult_Response_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_GetResult_Response_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult_Response>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_GetResult_Response_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_GetResult_Response)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult_Response>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_GetResult_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_GetResult_type_support_ids_t;

static const _ExecuteBehavior_GetResult_type_support_ids_t _ExecuteBehavior_GetResult_service_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_GetResult_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_GetResult_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_GetResult_type_support_symbol_names_t _ExecuteBehavior_GetResult_service_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_GetResult)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_GetResult)),
  }
};

typedef struct _ExecuteBehavior_GetResult_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_GetResult_type_support_data_t;

static _ExecuteBehavior_GetResult_type_support_data_t _ExecuteBehavior_GetResult_service_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_GetResult_service_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_GetResult_service_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_GetResult_service_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_GetResult_service_typesupport_data.data[0],
};

static const rosidl_service_type_support_t ExecuteBehavior_GetResult_service_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_GetResult_service_typesupport_map),
  ::rosidl_typesupport_cpp::get_service_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
get_service_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_GetResult_service_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_GetResult)() {
  return ::rosidl_typesupport_cpp::get_service_type_support_handle<hive_interfaces::action::ExecuteBehavior_GetResult>();
}

#ifdef __cplusplus
}
#endif

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _ExecuteBehavior_FeedbackMessage_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _ExecuteBehavior_FeedbackMessage_type_support_ids_t;

static const _ExecuteBehavior_FeedbackMessage_type_support_ids_t _ExecuteBehavior_FeedbackMessage_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _ExecuteBehavior_FeedbackMessage_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _ExecuteBehavior_FeedbackMessage_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _ExecuteBehavior_FeedbackMessage_type_support_symbol_names_t _ExecuteBehavior_FeedbackMessage_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, hive_interfaces, action, ExecuteBehavior_FeedbackMessage)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, hive_interfaces, action, ExecuteBehavior_FeedbackMessage)),
  }
};

typedef struct _ExecuteBehavior_FeedbackMessage_type_support_data_t
{
  void * data[2];
} _ExecuteBehavior_FeedbackMessage_type_support_data_t;

static _ExecuteBehavior_FeedbackMessage_type_support_data_t _ExecuteBehavior_FeedbackMessage_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _ExecuteBehavior_FeedbackMessage_message_typesupport_map = {
  2,
  "hive_interfaces",
  &_ExecuteBehavior_FeedbackMessage_message_typesupport_ids.typesupport_identifier[0],
  &_ExecuteBehavior_FeedbackMessage_message_typesupport_symbol_names.symbol_name[0],
  &_ExecuteBehavior_FeedbackMessage_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t ExecuteBehavior_FeedbackMessage_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_ExecuteBehavior_FeedbackMessage_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>()
{
  return &::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_FeedbackMessage_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior_FeedbackMessage)() {
  return get_message_type_support_handle<hive_interfaces::action::ExecuteBehavior_FeedbackMessage>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

#include "action_msgs/msg/goal_status_array.hpp"
#include "action_msgs/srv/cancel_goal.hpp"
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
#include "rosidl_runtime_c/action_type_support_struct.h"
#include "rosidl_typesupport_cpp/action_type_support.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support.hpp"

namespace hive_interfaces
{

namespace action
{

namespace rosidl_typesupport_cpp
{

static rosidl_action_type_support_t ExecuteBehavior_action_type_support_handle = {
  NULL, NULL, NULL, NULL, NULL};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace hive_interfaces

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_action_type_support_t *
get_action_type_support_handle<hive_interfaces::action::ExecuteBehavior>()
{
  using ::hive_interfaces::action::rosidl_typesupport_cpp::ExecuteBehavior_action_type_support_handle;
  // Thread-safe by always writing the same values to the static struct
  ExecuteBehavior_action_type_support_handle.goal_service_type_support = get_service_type_support_handle<::hive_interfaces::action::ExecuteBehavior::Impl::SendGoalService>();
  ExecuteBehavior_action_type_support_handle.result_service_type_support = get_service_type_support_handle<::hive_interfaces::action::ExecuteBehavior::Impl::GetResultService>();
  ExecuteBehavior_action_type_support_handle.cancel_service_type_support = get_service_type_support_handle<::hive_interfaces::action::ExecuteBehavior::Impl::CancelGoalService>();
  ExecuteBehavior_action_type_support_handle.feedback_message_type_support = get_message_type_support_handle<::hive_interfaces::action::ExecuteBehavior::Impl::FeedbackMessage>();
  ExecuteBehavior_action_type_support_handle.status_message_type_support = get_message_type_support_handle<::hive_interfaces::action::ExecuteBehavior::Impl::GoalStatusMessage>();
  return &ExecuteBehavior_action_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_action_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__ACTION_SYMBOL_NAME(rosidl_typesupport_cpp, hive_interfaces, action, ExecuteBehavior)() {
  return ::rosidl_typesupport_cpp::get_action_type_support_handle<hive_interfaces::action::ExecuteBehavior>();
}

#ifdef __cplusplus
}
#endif
