
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Goal() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_Goal__init(msg: *mut ExecuteBehavior_Goal) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Goal__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Goal>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Goal__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Goal>);
    fn hive_interfaces__action__ExecuteBehavior_Goal__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_Goal>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Goal>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_Goal
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Goal {

    // This member is not documented.
    #[allow(missing_docs)]
    pub id: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub behavior_name: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub task_id: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub pose: geometry_msgs::msg::rmw::PoseStamped,


    // This member is not documented.
    #[allow(missing_docs)]
    pub json_payload: rosidl_runtime_rs::String,

}



impl Default for ExecuteBehavior_Goal {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_Goal__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_Goal__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_Goal {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Goal__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Goal__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Goal__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Goal {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_Goal where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_Goal";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Goal() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Result() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_Result__init(msg: *mut ExecuteBehavior_Result) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Result__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Result>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Result__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Result>);
    fn hive_interfaces__action__ExecuteBehavior_Result__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_Result>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Result>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_Result
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Result {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub outcome_text: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub log_file: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub metrics_json: rosidl_runtime_rs::String,

}



impl Default for ExecuteBehavior_Result {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_Result__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_Result__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_Result {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Result__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Result__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Result__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Result {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_Result where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_Result";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Result() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Feedback() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_Feedback__init(msg: *mut ExecuteBehavior_Feedback) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Feedback>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Feedback>);
    fn hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_Feedback>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_Feedback>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_Feedback
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Feedback {

    // This member is not documented.
    #[allow(missing_docs)]
    pub progress_percent: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub current_state: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub comment: rosidl_runtime_rs::String,

}



impl Default for ExecuteBehavior_Feedback {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_Feedback__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_Feedback__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_Feedback {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_Feedback__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Feedback {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_Feedback where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_Feedback";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_Feedback() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_FeedbackMessage() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(msg: *mut ExecuteBehavior_FeedbackMessage) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_FeedbackMessage>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_FeedbackMessage>);
    fn hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_FeedbackMessage>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_FeedbackMessage>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_FeedbackMessage
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_FeedbackMessage {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub feedback: super::super::action::rmw::ExecuteBehavior_Feedback,

}



impl Default for ExecuteBehavior_FeedbackMessage {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_FeedbackMessage__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_FeedbackMessage {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_FeedbackMessage__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_FeedbackMessage {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_FeedbackMessage where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_FeedbackMessage";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_FeedbackMessage() }
  }
}




#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal_Request() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(msg: *mut ExecuteBehavior_SendGoal_Request) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Request>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Request>);
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Request>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_SendGoal_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_SendGoal_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub goal: super::super::action::rmw::ExecuteBehavior_Goal,

}



impl Default for ExecuteBehavior_SendGoal_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_SendGoal_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_SendGoal_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_SendGoal_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_SendGoal_Request where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_SendGoal_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal_Request() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal_Response() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(msg: *mut ExecuteBehavior_SendGoal_Response) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Response>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Response>);
    fn hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_SendGoal_Response>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_SendGoal_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_SendGoal_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub accepted: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub stamp: builtin_interfaces::msg::rmw::Time,

}



impl Default for ExecuteBehavior_SendGoal_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_SendGoal_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_SendGoal_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_SendGoal_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_SendGoal_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_SendGoal_Response where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_SendGoal_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal_Response() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult_Request() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(msg: *mut ExecuteBehavior_GetResult_Request) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Request>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Request>);
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Request>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_GetResult_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_GetResult_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,

}



impl Default for ExecuteBehavior_GetResult_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_GetResult_Request__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_GetResult_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_GetResult_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_GetResult_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_GetResult_Request where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_GetResult_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult_Request() }
  }
}


#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult_Response() -> *const std::ffi::c_void;
}

#[link(name = "hive_interfaces__rosidl_generator_c")]
extern "C" {
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(msg: *mut ExecuteBehavior_GetResult_Response) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Response>, size: usize) -> bool;
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Response>);
    fn hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<ExecuteBehavior_GetResult_Response>) -> bool;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_GetResult_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_GetResult_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub status: i8,


    // This member is not documented.
    #[allow(missing_docs)]
    pub result: super::super::action::rmw::ExecuteBehavior_Result,

}



impl Default for ExecuteBehavior_GetResult_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !hive_interfaces__action__ExecuteBehavior_GetResult_Response__init(&mut msg as *mut _) {
        panic!("Call to hive_interfaces__action__ExecuteBehavior_GetResult_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ExecuteBehavior_GetResult_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { hive_interfaces__action__ExecuteBehavior_GetResult_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_GetResult_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ExecuteBehavior_GetResult_Response where Self: Sized {
  const TYPE_NAME: &'static str = "hive_interfaces/action/ExecuteBehavior_GetResult_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult_Response() }
  }
}






#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal() -> *const std::ffi::c_void;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_SendGoal
#[allow(missing_docs, non_camel_case_types)]
pub struct ExecuteBehavior_SendGoal;

impl rosidl_runtime_rs::Service for ExecuteBehavior_SendGoal {
    type Request = ExecuteBehavior_SendGoal_Request;
    type Response = ExecuteBehavior_SendGoal_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__hive_interfaces__action__ExecuteBehavior_SendGoal() }
    }
}




#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult() -> *const std::ffi::c_void;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior_GetResult
#[allow(missing_docs, non_camel_case_types)]
pub struct ExecuteBehavior_GetResult;

impl rosidl_runtime_rs::Service for ExecuteBehavior_GetResult {
    type Request = ExecuteBehavior_GetResult_Request;
    type Response = ExecuteBehavior_GetResult_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__hive_interfaces__action__ExecuteBehavior_GetResult() }
    }
}


