// generated from rosidl_generator_c/resource/idl__functions.c.em
// with input from hive_interfaces:action/ExecuteBehavior.idl
// generated code does not contain a copyright notice
#include "hive_interfaces/action/detail/execute_behavior__functions.h"

#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "rcutils/allocator.h"


// Include directives for member types
// Member `behavior_name`
// Member `task_id`
// Member `json_payload`
#include "rosidl_runtime_c/string_functions.h"
// Member `pose`
#include "geometry_msgs/msg/detail/pose_stamped__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_Goal__init(hive_interfaces__action__ExecuteBehavior_Goal * msg)
{
  if (!msg) {
    return false;
  }
  // id
  // behavior_name
  if (!rosidl_runtime_c__String__init(&msg->behavior_name)) {
    hive_interfaces__action__ExecuteBehavior_Goal__fini(msg);
    return false;
  }
  // task_id
  if (!rosidl_runtime_c__String__init(&msg->task_id)) {
    hive_interfaces__action__ExecuteBehavior_Goal__fini(msg);
    return false;
  }
  // pose
  if (!geometry_msgs__msg__PoseStamped__init(&msg->pose)) {
    hive_interfaces__action__ExecuteBehavior_Goal__fini(msg);
    return false;
  }
  // json_payload
  if (!rosidl_runtime_c__String__init(&msg->json_payload)) {
    hive_interfaces__action__ExecuteBehavior_Goal__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Goal__fini(hive_interfaces__action__ExecuteBehavior_Goal * msg)
{
  if (!msg) {
    return;
  }
  // id
  // behavior_name
  rosidl_runtime_c__String__fini(&msg->behavior_name);
  // task_id
  rosidl_runtime_c__String__fini(&msg->task_id);
  // pose
  geometry_msgs__msg__PoseStamped__fini(&msg->pose);
  // json_payload
  rosidl_runtime_c__String__fini(&msg->json_payload);
}

bool
hive_interfaces__action__ExecuteBehavior_Goal__are_equal(const hive_interfaces__action__ExecuteBehavior_Goal * lhs, const hive_interfaces__action__ExecuteBehavior_Goal * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // id
  if (lhs->id != rhs->id) {
    return false;
  }
  // behavior_name
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->behavior_name), &(rhs->behavior_name)))
  {
    return false;
  }
  // task_id
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->task_id), &(rhs->task_id)))
  {
    return false;
  }
  // pose
  if (!geometry_msgs__msg__PoseStamped__are_equal(
      &(lhs->pose), &(rhs->pose)))
  {
    return false;
  }
  // json_payload
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->json_payload), &(rhs->json_payload)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Goal__copy(
  const hive_interfaces__action__ExecuteBehavior_Goal * input,
  hive_interfaces__action__ExecuteBehavior_Goal * output)
{
  if (!input || !output) {
    return false;
  }
  // id
  output->id = input->id;
  // behavior_name
  if (!rosidl_runtime_c__String__copy(
      &(input->behavior_name), &(output->behavior_name)))
  {
    return false;
  }
  // task_id
  if (!rosidl_runtime_c__String__copy(
      &(input->task_id), &(output->task_id)))
  {
    return false;
  }
  // pose
  if (!geometry_msgs__msg__PoseStamped__copy(
      &(input->pose), &(output->pose)))
  {
    return false;
  }
  // json_payload
  if (!rosidl_runtime_c__String__copy(
      &(input->json_payload), &(output->json_payload)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_Goal *
hive_interfaces__action__ExecuteBehavior_Goal__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Goal * msg = (hive_interfaces__action__ExecuteBehavior_Goal *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Goal), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_Goal));
  bool success = hive_interfaces__action__ExecuteBehavior_Goal__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_Goal__destroy(hive_interfaces__action__ExecuteBehavior_Goal * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_Goal__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__init(hive_interfaces__action__ExecuteBehavior_Goal__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Goal * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_Goal *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_Goal), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_Goal__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_Goal__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__fini(hive_interfaces__action__ExecuteBehavior_Goal__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_Goal__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_Goal__Sequence *
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Goal__Sequence * array = (hive_interfaces__action__ExecuteBehavior_Goal__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Goal__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_Goal__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_Goal__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_Goal__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_Goal__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_Goal__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Goal__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Goal__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_Goal__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_Goal__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_Goal);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_Goal * data =
      (hive_interfaces__action__ExecuteBehavior_Goal *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_Goal__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_Goal__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Goal__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `outcome_text`
// Member `log_file`
// Member `metrics_json`
// already included above
// #include "rosidl_runtime_c/string_functions.h"

bool
hive_interfaces__action__ExecuteBehavior_Result__init(hive_interfaces__action__ExecuteBehavior_Result * msg)
{
  if (!msg) {
    return false;
  }
  // success
  // outcome_text
  if (!rosidl_runtime_c__String__init(&msg->outcome_text)) {
    hive_interfaces__action__ExecuteBehavior_Result__fini(msg);
    return false;
  }
  // log_file
  if (!rosidl_runtime_c__String__init(&msg->log_file)) {
    hive_interfaces__action__ExecuteBehavior_Result__fini(msg);
    return false;
  }
  // metrics_json
  if (!rosidl_runtime_c__String__init(&msg->metrics_json)) {
    hive_interfaces__action__ExecuteBehavior_Result__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Result__fini(hive_interfaces__action__ExecuteBehavior_Result * msg)
{
  if (!msg) {
    return;
  }
  // success
  // outcome_text
  rosidl_runtime_c__String__fini(&msg->outcome_text);
  // log_file
  rosidl_runtime_c__String__fini(&msg->log_file);
  // metrics_json
  rosidl_runtime_c__String__fini(&msg->metrics_json);
}

bool
hive_interfaces__action__ExecuteBehavior_Result__are_equal(const hive_interfaces__action__ExecuteBehavior_Result * lhs, const hive_interfaces__action__ExecuteBehavior_Result * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // success
  if (lhs->success != rhs->success) {
    return false;
  }
  // outcome_text
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->outcome_text), &(rhs->outcome_text)))
  {
    return false;
  }
  // log_file
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->log_file), &(rhs->log_file)))
  {
    return false;
  }
  // metrics_json
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->metrics_json), &(rhs->metrics_json)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Result__copy(
  const hive_interfaces__action__ExecuteBehavior_Result * input,
  hive_interfaces__action__ExecuteBehavior_Result * output)
{
  if (!input || !output) {
    return false;
  }
  // success
  output->success = input->success;
  // outcome_text
  if (!rosidl_runtime_c__String__copy(
      &(input->outcome_text), &(output->outcome_text)))
  {
    return false;
  }
  // log_file
  if (!rosidl_runtime_c__String__copy(
      &(input->log_file), &(output->log_file)))
  {
    return false;
  }
  // metrics_json
  if (!rosidl_runtime_c__String__copy(
      &(input->metrics_json), &(output->metrics_json)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_Result *
hive_interfaces__action__ExecuteBehavior_Result__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Result * msg = (hive_interfaces__action__ExecuteBehavior_Result *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Result), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_Result));
  bool success = hive_interfaces__action__ExecuteBehavior_Result__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_Result__destroy(hive_interfaces__action__ExecuteBehavior_Result * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_Result__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_Result__Sequence__init(hive_interfaces__action__ExecuteBehavior_Result__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Result * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_Result *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_Result), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_Result__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_Result__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Result__Sequence__fini(hive_interfaces__action__ExecuteBehavior_Result__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_Result__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_Result__Sequence *
hive_interfaces__action__ExecuteBehavior_Result__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Result__Sequence * array = (hive_interfaces__action__ExecuteBehavior_Result__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Result__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_Result__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_Result__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_Result__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_Result__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_Result__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_Result__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_Result__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Result__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Result__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_Result__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_Result__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_Result);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_Result * data =
      (hive_interfaces__action__ExecuteBehavior_Result *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_Result__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_Result__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Result__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `current_state`
// Member `comment`
// already included above
// #include "rosidl_runtime_c/string_functions.h"

bool
hive_interfaces__action__ExecuteBehavior_Feedback__init(hive_interfaces__action__ExecuteBehavior_Feedback * msg)
{
  if (!msg) {
    return false;
  }
  // progress_percent
  // current_state
  if (!rosidl_runtime_c__String__init(&msg->current_state)) {
    hive_interfaces__action__ExecuteBehavior_Feedback__fini(msg);
    return false;
  }
  // comment
  if (!rosidl_runtime_c__String__init(&msg->comment)) {
    hive_interfaces__action__ExecuteBehavior_Feedback__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Feedback__fini(hive_interfaces__action__ExecuteBehavior_Feedback * msg)
{
  if (!msg) {
    return;
  }
  // progress_percent
  // current_state
  rosidl_runtime_c__String__fini(&msg->current_state);
  // comment
  rosidl_runtime_c__String__fini(&msg->comment);
}

bool
hive_interfaces__action__ExecuteBehavior_Feedback__are_equal(const hive_interfaces__action__ExecuteBehavior_Feedback * lhs, const hive_interfaces__action__ExecuteBehavior_Feedback * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // progress_percent
  if (lhs->progress_percent != rhs->progress_percent) {
    return false;
  }
  // current_state
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->current_state), &(rhs->current_state)))
  {
    return false;
  }
  // comment
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->comment), &(rhs->comment)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Feedback__copy(
  const hive_interfaces__action__ExecuteBehavior_Feedback * input,
  hive_interfaces__action__ExecuteBehavior_Feedback * output)
{
  if (!input || !output) {
    return false;
  }
  // progress_percent
  output->progress_percent = input->progress_percent;
  // current_state
  if (!rosidl_runtime_c__String__copy(
      &(input->current_state), &(output->current_state)))
  {
    return false;
  }
  // comment
  if (!rosidl_runtime_c__String__copy(
      &(input->comment), &(output->comment)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_Feedback *
hive_interfaces__action__ExecuteBehavior_Feedback__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Feedback * msg = (hive_interfaces__action__ExecuteBehavior_Feedback *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Feedback), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_Feedback));
  bool success = hive_interfaces__action__ExecuteBehavior_Feedback__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_Feedback__destroy(hive_interfaces__action__ExecuteBehavior_Feedback * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_Feedback__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__init(hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Feedback * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_Feedback *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_Feedback), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_Feedback__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_Feedback__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__fini(hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_Feedback__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_Feedback__Sequence *
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * array = (hive_interfaces__action__ExecuteBehavior_Feedback__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_Feedback__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Feedback__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_Feedback__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_Feedback);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_Feedback * data =
      (hive_interfaces__action__ExecuteBehavior_Feedback *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_Feedback__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_Feedback__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_Feedback__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
#include "unique_identifier_msgs/msg/detail/uuid__functions.h"
// Member `goal`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(hive_interfaces__action__ExecuteBehavior_SendGoal_Request * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(msg);
    return false;
  }
  // goal
  if (!hive_interfaces__action__ExecuteBehavior_Goal__init(&msg->goal)) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(hive_interfaces__action__ExecuteBehavior_SendGoal_Request * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
  // goal
  hive_interfaces__action__ExecuteBehavior_Goal__fini(&msg->goal);
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__are_equal(const hive_interfaces__action__ExecuteBehavior_SendGoal_Request * lhs, const hive_interfaces__action__ExecuteBehavior_SendGoal_Request * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  // goal
  if (!hive_interfaces__action__ExecuteBehavior_Goal__are_equal(
      &(lhs->goal), &(rhs->goal)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__copy(
  const hive_interfaces__action__ExecuteBehavior_SendGoal_Request * input,
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  // goal
  if (!hive_interfaces__action__ExecuteBehavior_Goal__copy(
      &(input->goal), &(output->goal)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_SendGoal_Request *
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request * msg = (hive_interfaces__action__ExecuteBehavior_SendGoal_Request *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request));
  bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__destroy(hive_interfaces__action__ExecuteBehavior_SendGoal_Request * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__init(hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_SendGoal_Request *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__fini(hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence *
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * array = (hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Request__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Request);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_SendGoal_Request * data =
      (hive_interfaces__action__ExecuteBehavior_SendGoal_Request *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_SendGoal_Request__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Request__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `stamp`
#include "builtin_interfaces/msg/detail/time__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(hive_interfaces__action__ExecuteBehavior_SendGoal_Response * msg)
{
  if (!msg) {
    return false;
  }
  // accepted
  // stamp
  if (!builtin_interfaces__msg__Time__init(&msg->stamp)) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(hive_interfaces__action__ExecuteBehavior_SendGoal_Response * msg)
{
  if (!msg) {
    return;
  }
  // accepted
  // stamp
  builtin_interfaces__msg__Time__fini(&msg->stamp);
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__are_equal(const hive_interfaces__action__ExecuteBehavior_SendGoal_Response * lhs, const hive_interfaces__action__ExecuteBehavior_SendGoal_Response * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // accepted
  if (lhs->accepted != rhs->accepted) {
    return false;
  }
  // stamp
  if (!builtin_interfaces__msg__Time__are_equal(
      &(lhs->stamp), &(rhs->stamp)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__copy(
  const hive_interfaces__action__ExecuteBehavior_SendGoal_Response * input,
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response * output)
{
  if (!input || !output) {
    return false;
  }
  // accepted
  output->accepted = input->accepted;
  // stamp
  if (!builtin_interfaces__msg__Time__copy(
      &(input->stamp), &(output->stamp)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_SendGoal_Response *
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response * msg = (hive_interfaces__action__ExecuteBehavior_SendGoal_Response *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response));
  bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__destroy(hive_interfaces__action__ExecuteBehavior_SendGoal_Response * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__init(hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_SendGoal_Response *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__fini(hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence *
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * array = (hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Response__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_SendGoal_Response);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_SendGoal_Response * data =
      (hive_interfaces__action__ExecuteBehavior_SendGoal_Response *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_SendGoal_Response__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_SendGoal_Response__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(hive_interfaces__action__ExecuteBehavior_GetResult_Request * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(hive_interfaces__action__ExecuteBehavior_GetResult_Request * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__are_equal(const hive_interfaces__action__ExecuteBehavior_GetResult_Request * lhs, const hive_interfaces__action__ExecuteBehavior_GetResult_Request * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__copy(
  const hive_interfaces__action__ExecuteBehavior_GetResult_Request * input,
  hive_interfaces__action__ExecuteBehavior_GetResult_Request * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_GetResult_Request *
hive_interfaces__action__ExecuteBehavior_GetResult_Request__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Request * msg = (hive_interfaces__action__ExecuteBehavior_GetResult_Request *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request));
  bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Request__destroy(hive_interfaces__action__ExecuteBehavior_GetResult_Request * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__init(hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Request * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_GetResult_Request *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__fini(hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence *
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * array = (hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_GetResult_Request__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Request);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_GetResult_Request * data =
      (hive_interfaces__action__ExecuteBehavior_GetResult_Request *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_GetResult_Request__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_GetResult_Request__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `result`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(hive_interfaces__action__ExecuteBehavior_GetResult_Response * msg)
{
  if (!msg) {
    return false;
  }
  // status
  // result
  if (!hive_interfaces__action__ExecuteBehavior_Result__init(&msg->result)) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(hive_interfaces__action__ExecuteBehavior_GetResult_Response * msg)
{
  if (!msg) {
    return;
  }
  // status
  // result
  hive_interfaces__action__ExecuteBehavior_Result__fini(&msg->result);
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__are_equal(const hive_interfaces__action__ExecuteBehavior_GetResult_Response * lhs, const hive_interfaces__action__ExecuteBehavior_GetResult_Response * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // status
  if (lhs->status != rhs->status) {
    return false;
  }
  // result
  if (!hive_interfaces__action__ExecuteBehavior_Result__are_equal(
      &(lhs->result), &(rhs->result)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__copy(
  const hive_interfaces__action__ExecuteBehavior_GetResult_Response * input,
  hive_interfaces__action__ExecuteBehavior_GetResult_Response * output)
{
  if (!input || !output) {
    return false;
  }
  // status
  output->status = input->status;
  // result
  if (!hive_interfaces__action__ExecuteBehavior_Result__copy(
      &(input->result), &(output->result)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_GetResult_Response *
hive_interfaces__action__ExecuteBehavior_GetResult_Response__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Response * msg = (hive_interfaces__action__ExecuteBehavior_GetResult_Response *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response));
  bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Response__destroy(hive_interfaces__action__ExecuteBehavior_GetResult_Response * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__init(hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Response * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_GetResult_Response *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__fini(hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence *
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * array = (hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_GetResult_Response__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_GetResult_Response);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_GetResult_Response * data =
      (hive_interfaces__action__ExecuteBehavior_GetResult_Response *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_GetResult_Response__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_GetResult_Response__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__functions.h"
// Member `feedback`
// already included above
// #include "hive_interfaces/action/detail/execute_behavior__functions.h"

bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(hive_interfaces__action__ExecuteBehavior_FeedbackMessage * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(msg);
    return false;
  }
  // feedback
  if (!hive_interfaces__action__ExecuteBehavior_Feedback__init(&msg->feedback)) {
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(msg);
    return false;
  }
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(hive_interfaces__action__ExecuteBehavior_FeedbackMessage * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
  // feedback
  hive_interfaces__action__ExecuteBehavior_Feedback__fini(&msg->feedback);
}

bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__are_equal(const hive_interfaces__action__ExecuteBehavior_FeedbackMessage * lhs, const hive_interfaces__action__ExecuteBehavior_FeedbackMessage * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  // feedback
  if (!hive_interfaces__action__ExecuteBehavior_Feedback__are_equal(
      &(lhs->feedback), &(rhs->feedback)))
  {
    return false;
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__copy(
  const hive_interfaces__action__ExecuteBehavior_FeedbackMessage * input,
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  // feedback
  if (!hive_interfaces__action__ExecuteBehavior_Feedback__copy(
      &(input->feedback), &(output->feedback)))
  {
    return false;
  }
  return true;
}

hive_interfaces__action__ExecuteBehavior_FeedbackMessage *
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage * msg = (hive_interfaces__action__ExecuteBehavior_FeedbackMessage *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage));
  bool success = hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__destroy(hive_interfaces__action__ExecuteBehavior_FeedbackMessage * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__init(hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage * data = NULL;

  if (size) {
    data = (hive_interfaces__action__ExecuteBehavior_FeedbackMessage *)allocator.zero_allocate(size, sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__fini(hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence *
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * array = (hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence *)allocator.allocate(sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__destroy(hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__are_equal(const hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * lhs, const hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_FeedbackMessage__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__copy(
  const hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * input,
  hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(hive_interfaces__action__ExecuteBehavior_FeedbackMessage);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    hive_interfaces__action__ExecuteBehavior_FeedbackMessage * data =
      (hive_interfaces__action__ExecuteBehavior_FeedbackMessage *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          hive_interfaces__action__ExecuteBehavior_FeedbackMessage__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!hive_interfaces__action__ExecuteBehavior_FeedbackMessage__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}
