
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



// Corresponds to hive_interfaces__action__ExecuteBehavior_Goal

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Goal {

    // This member is not documented.
    #[allow(missing_docs)]
    pub id: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub behavior_name: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub task_id: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub pose: geometry_msgs::msg::PoseStamped,


    // This member is not documented.
    #[allow(missing_docs)]
    pub json_payload: std::string::String,

}



impl Default for ExecuteBehavior_Goal {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_Goal::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Goal {
  type RmwMsg = super::action::rmw::ExecuteBehavior_Goal;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        id: msg.id,
        behavior_name: msg.behavior_name.as_str().into(),
        task_id: msg.task_id.as_str().into(),
        pose: geometry_msgs::msg::PoseStamped::into_rmw_message(std::borrow::Cow::Owned(msg.pose)).into_owned(),
        json_payload: msg.json_payload.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      id: msg.id,
        behavior_name: msg.behavior_name.as_str().into(),
        task_id: msg.task_id.as_str().into(),
        pose: geometry_msgs::msg::PoseStamped::into_rmw_message(std::borrow::Cow::Borrowed(&msg.pose)).into_owned(),
        json_payload: msg.json_payload.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      id: msg.id,
      behavior_name: msg.behavior_name.to_string(),
      task_id: msg.task_id.to_string(),
      pose: geometry_msgs::msg::PoseStamped::from_rmw_message(msg.pose),
      json_payload: msg.json_payload.to_string(),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_Result

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Result {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub outcome_text: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub log_file: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub metrics_json: std::string::String,

}



impl Default for ExecuteBehavior_Result {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_Result::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Result {
  type RmwMsg = super::action::rmw::ExecuteBehavior_Result;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
        outcome_text: msg.outcome_text.as_str().into(),
        log_file: msg.log_file.as_str().into(),
        metrics_json: msg.metrics_json.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
        outcome_text: msg.outcome_text.as_str().into(),
        log_file: msg.log_file.as_str().into(),
        metrics_json: msg.metrics_json.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
      outcome_text: msg.outcome_text.to_string(),
      log_file: msg.log_file.to_string(),
      metrics_json: msg.metrics_json.to_string(),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_Feedback

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_Feedback {

    // This member is not documented.
    #[allow(missing_docs)]
    pub progress_percent: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub current_state: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub comment: std::string::String,

}



impl Default for ExecuteBehavior_Feedback {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_Feedback::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_Feedback {
  type RmwMsg = super::action::rmw::ExecuteBehavior_Feedback;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        progress_percent: msg.progress_percent,
        current_state: msg.current_state.as_str().into(),
        comment: msg.comment.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      progress_percent: msg.progress_percent,
        current_state: msg.current_state.as_str().into(),
        comment: msg.comment.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      progress_percent: msg.progress_percent,
      current_state: msg.current_state.to_string(),
      comment: msg.comment.to_string(),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_FeedbackMessage

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_FeedbackMessage {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub feedback: super::action::ExecuteBehavior_Feedback,

}



impl Default for ExecuteBehavior_FeedbackMessage {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_FeedbackMessage::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_FeedbackMessage {
  type RmwMsg = super::action::rmw::ExecuteBehavior_FeedbackMessage;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Owned(msg.goal_id)).into_owned(),
        feedback: super::action::ExecuteBehavior_Feedback::into_rmw_message(std::borrow::Cow::Owned(msg.feedback)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Borrowed(&msg.goal_id)).into_owned(),
        feedback: super::action::ExecuteBehavior_Feedback::into_rmw_message(std::borrow::Cow::Borrowed(&msg.feedback)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      goal_id: unique_identifier_msgs::msg::UUID::from_rmw_message(msg.goal_id),
      feedback: super::action::ExecuteBehavior_Feedback::from_rmw_message(msg.feedback),
    }
  }
}






// Corresponds to hive_interfaces__action__ExecuteBehavior_SendGoal_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_SendGoal_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub goal: super::action::ExecuteBehavior_Goal,

}



impl Default for ExecuteBehavior_SendGoal_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_SendGoal_Request::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_SendGoal_Request {
  type RmwMsg = super::action::rmw::ExecuteBehavior_SendGoal_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Owned(msg.goal_id)).into_owned(),
        goal: super::action::ExecuteBehavior_Goal::into_rmw_message(std::borrow::Cow::Owned(msg.goal)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Borrowed(&msg.goal_id)).into_owned(),
        goal: super::action::ExecuteBehavior_Goal::into_rmw_message(std::borrow::Cow::Borrowed(&msg.goal)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      goal_id: unique_identifier_msgs::msg::UUID::from_rmw_message(msg.goal_id),
      goal: super::action::ExecuteBehavior_Goal::from_rmw_message(msg.goal),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_SendGoal_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_SendGoal_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub accepted: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub stamp: builtin_interfaces::msg::Time,

}



impl Default for ExecuteBehavior_SendGoal_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_SendGoal_Response::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_SendGoal_Response {
  type RmwMsg = super::action::rmw::ExecuteBehavior_SendGoal_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        accepted: msg.accepted,
        stamp: builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Owned(msg.stamp)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      accepted: msg.accepted,
        stamp: builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Borrowed(&msg.stamp)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      accepted: msg.accepted,
      stamp: builtin_interfaces::msg::Time::from_rmw_message(msg.stamp),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_GetResult_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_GetResult_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::UUID,

}



impl Default for ExecuteBehavior_GetResult_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_GetResult_Request::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_GetResult_Request {
  type RmwMsg = super::action::rmw::ExecuteBehavior_GetResult_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Owned(msg.goal_id)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        goal_id: unique_identifier_msgs::msg::UUID::into_rmw_message(std::borrow::Cow::Borrowed(&msg.goal_id)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      goal_id: unique_identifier_msgs::msg::UUID::from_rmw_message(msg.goal_id),
    }
  }
}


// Corresponds to hive_interfaces__action__ExecuteBehavior_GetResult_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ExecuteBehavior_GetResult_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub status: i8,


    // This member is not documented.
    #[allow(missing_docs)]
    pub result: super::action::ExecuteBehavior_Result,

}



impl Default for ExecuteBehavior_GetResult_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::action::rmw::ExecuteBehavior_GetResult_Response::default())
  }
}

impl rosidl_runtime_rs::Message for ExecuteBehavior_GetResult_Response {
  type RmwMsg = super::action::rmw::ExecuteBehavior_GetResult_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        status: msg.status,
        result: super::action::ExecuteBehavior_Result::into_rmw_message(std::borrow::Cow::Owned(msg.result)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      status: msg.status,
        result: super::action::ExecuteBehavior_Result::into_rmw_message(std::borrow::Cow::Borrowed(&msg.result)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      status: msg.status,
      result: super::action::ExecuteBehavior_Result::from_rmw_message(msg.result),
    }
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






#[link(name = "hive_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_action_type_support_handle__hive_interfaces__action__ExecuteBehavior() -> *const std::ffi::c_void;
}

// Corresponds to hive_interfaces__action__ExecuteBehavior
#[allow(missing_docs, non_camel_case_types)]
pub struct ExecuteBehavior;

impl rosidl_runtime_rs::Action for ExecuteBehavior {
  // --- Associated types for client library users ---
  /// The goal message defined in the action definition.
  type Goal = ExecuteBehavior_Goal;

  /// The result message defined in the action definition.
  type Result = ExecuteBehavior_Result;

  /// The feedback message defined in the action definition.
  type Feedback = ExecuteBehavior_Feedback;

  // --- Associated types for client library implementation ---
  /// The feedback message with generic fields which wraps the feedback message.
  type FeedbackMessage = super::action::ExecuteBehavior_FeedbackMessage;

  /// The send_goal service using a wrapped version of the goal message as a request.
  type SendGoalService = super::action::ExecuteBehavior_SendGoal;

  /// The generic service to cancel a goal.
  type CancelGoalService = action_msgs::srv::rmw::CancelGoal;

  /// The get_result service using a wrapped version of the result message as a response.
  type GetResultService = super::action::ExecuteBehavior_GetResult;

  // --- Methods for client library implementation ---
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_action_type_support_handle__hive_interfaces__action__ExecuteBehavior() }
  }

  fn create_goal_request(
    goal_id: &[u8; 16],
    goal: super::action::rmw::ExecuteBehavior_Goal,
  ) -> super::action::rmw::ExecuteBehavior_SendGoal_Request {
   super::action::rmw::ExecuteBehavior_SendGoal_Request {
      goal_id: unique_identifier_msgs::msg::rmw::UUID { uuid: *goal_id },
      goal,
    }
  }

  fn split_goal_request(
    request: super::action::rmw::ExecuteBehavior_SendGoal_Request,
  ) -> (
    [u8; 16],
   super::action::rmw::ExecuteBehavior_Goal,
  ) {
    (request.goal_id.uuid, request.goal)
  }

  fn create_goal_response(
    accepted: bool,
    stamp: (i32, u32),
  ) -> super::action::rmw::ExecuteBehavior_SendGoal_Response {
   super::action::rmw::ExecuteBehavior_SendGoal_Response {
      accepted,
      stamp: builtin_interfaces::msg::rmw::Time {
        sec: stamp.0,
        nanosec: stamp.1,
      },
    }
  }

  fn get_goal_response_accepted(
    response: &super::action::rmw::ExecuteBehavior_SendGoal_Response,
  ) -> bool {
    response.accepted
  }

  fn get_goal_response_stamp(
    response: &super::action::rmw::ExecuteBehavior_SendGoal_Response,
  ) -> (i32, u32) {
    (response.stamp.sec, response.stamp.nanosec)
  }

  fn create_feedback_message(
    goal_id: &[u8; 16],
    feedback: super::action::rmw::ExecuteBehavior_Feedback,
  ) -> super::action::rmw::ExecuteBehavior_FeedbackMessage {
    let mut message = super::action::rmw::ExecuteBehavior_FeedbackMessage::default();
    message.goal_id.uuid = *goal_id;
    message.feedback = feedback;
    message
  }

  fn split_feedback_message(
    feedback: super::action::rmw::ExecuteBehavior_FeedbackMessage,
  ) -> (
    [u8; 16],
   super::action::rmw::ExecuteBehavior_Feedback,
  ) {
    (feedback.goal_id.uuid, feedback.feedback)
  }

  fn create_result_request(
    goal_id: &[u8; 16],
  ) -> super::action::rmw::ExecuteBehavior_GetResult_Request {
   super::action::rmw::ExecuteBehavior_GetResult_Request {
      goal_id: unique_identifier_msgs::msg::rmw::UUID { uuid: *goal_id },
    }
  }

  fn get_result_request_uuid(
    request: &super::action::rmw::ExecuteBehavior_GetResult_Request,
  ) -> &[u8; 16] {
    &request.goal_id.uuid
  }

  fn create_result_response(
    status: i8,
    result: super::action::rmw::ExecuteBehavior_Result,
  ) -> super::action::rmw::ExecuteBehavior_GetResult_Response {
   super::action::rmw::ExecuteBehavior_GetResult_Response {
      status,
      result,
    }
  }

  fn split_result_response(
    response: super::action::rmw::ExecuteBehavior_GetResult_Response
  ) -> (
    i8,
   super::action::rmw::ExecuteBehavior_Result,
  ) {
    (response.status, response.result)
  }
}


