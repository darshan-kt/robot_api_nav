/**
 * @file nodes_goto_a.hpp
 * @brief Custom Behavior Tree Nodes for interacting with ROS 2 Nav2 Stack.
 *
 * Nodes defined here:
 *   - ApplyPayloadConfig  : SyncAction  — apply speed/priority from BB
 *   - SendNav2Goal        : SyncAction  — fire NavigateToPose, output UUID
 *   - MonitorNav2Status   : Stateful    — wait for UUID to reach terminal state
 *   - Wait                : Stateful    — non-blocking timed pause
 *   - IterateWaypoints    : Stateful    — loop over a JSON waypoints array,
 *                                         writing each WP's fields to BB and
 *                                         ticking the child subtree once per WP.
 *
 * @author [Darshan Gowda / Hive Robotics](https://hiverobotics.com)
 * @date 18/11/2025  (updated: multi-waypoint support)
 */

#pragma once
#include <behaviortree_cpp/bt_factory.h>
#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>

#include <geometry_msgs/msg/pose_stamped.hpp>
#include <nav2_msgs/action/navigate_to_pose.hpp>
#include <action_msgs/msg/goal_status_array.hpp>

#include <array>
#include <memory>
#include <atomic>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <string>
#include <vector>

#include "bt_runner/context.hpp"

namespace bt_runner_nav2 {

using NavigateToPose = nav2_msgs::action::NavigateToPose;
using Clock = std::chrono::steady_clock;

// =============================================================================
// Helper Functions & Structs
// =============================================================================

/**
 * @brief Converts a 16-byte UUID array to a hex string for comparison/logging.
 */
inline std::string uuid_to_hex(const std::array<uint8_t,16>& id)
{
  std::ostringstream oss;
  oss << std::hex << std::setfill('0');
  for (uint8_t b : id) {
    oss << std::setw(2) << static_cast<int>(b);
  }
  return oss.str();
}

/**
 * @brief Helper to extract the ROS Node pointer from the BehaviorTree Blackboard.
 */
struct NodeAccessor {
  static rclcpp::Node* node_from_bb(const BT::NodeConfiguration& cfg) {
    try {
      auto ctx = cfg.blackboard->get<std::shared_ptr<bt_runner::Context>>("ctx");
      if (ctx && ctx->node) return ctx->node;
    } catch (...) {}
    try {
      auto n = cfg.blackboard->get<rclcpp::Node*>("ros_node");
      if (n) return n;
    } catch (...) {}
    return nullptr;
  }
};

// =============================================================================
// Minimal JSON helpers (no external deps)
// =============================================================================

namespace json_util {

/**
 * @brief Extract all top-level array elements from a JSON array string.
 *        Handles nested objects/arrays by tracking brace/bracket depth.
 *        e.g.  "[{...},{...}]"  →  ["{...}", "{...}"]
 */
inline std::vector<std::string> split_json_array(const std::string& arr_str)
{
  std::vector<std::string> out;
  // Find the outer '[' ... ']'
  size_t start = arr_str.find('[');
  size_t end   = arr_str.rfind(']');
  if (start == std::string::npos || end == std::string::npos || end <= start)
    return out;

  int depth = 0;
  size_t elem_start = std::string::npos;
  for (size_t i = start + 1; i < end; ++i) {
    char c = arr_str[i];
    if (c == '{' || c == '[') {
      if (depth == 0) elem_start = i;
      ++depth;
    } else if (c == '}' || c == ']') {
      --depth;
      if (depth == 0 && elem_start != std::string::npos) {
        out.push_back(arr_str.substr(elem_start, i - elem_start + 1));
        elem_start = std::string::npos;
      }
    }
  }
  return out;
}

/**
 * @brief Parse a numeric value by key from a flat JSON object string.
 */
inline bool parse_num(const std::string& obj, const std::string& key, double& out)
{
  auto k = "\"" + key + "\"";
  auto p = obj.find(k);
  if (p == std::string::npos) return false;
  p = obj.find(':', p);
  if (p == std::string::npos) return false;
  size_t q = p + 1;
  while (q < obj.size() && obj[q] == ' ') ++q;
  size_t e = q;
  while (e < obj.size() && std::string("0123456789+-.eE").find(obj[e]) != std::string::npos) ++e;
  if (e > q) { out = std::stod(obj.substr(q, e - q)); return true; }
  return false;
}

/**
 * @brief Parse a string value by key from a flat JSON object string.
 */
inline bool parse_str(const std::string& obj, const std::string& key, std::string& out)
{
  auto k = "\"" + key + "\"";
  auto p = obj.find(k);
  if (p == std::string::npos) return false;
  p = obj.find(':', p);
  if (p == std::string::npos) return false;
  p = obj.find('"', p);
  if (p == std::string::npos) return false;
  size_t q = p + 1;
  size_t e = obj.find('"', q);
  if (e == std::string::npos) return false;
  out = obj.substr(q, e - q);
  return true;
}

/**
 * @brief Lightweight waypoint struct parsed from one JSON element.
 */
struct Waypoint {
  double x{0}, y{0}, z{0};
  double qx{0}, qy{0}, qz{0}, qw{1};
  std::string frame{"map"};
};

/**
 * @brief Parse a single JSON object into a Waypoint.
 *        Supports full quaternion OR yaw_deg (converted internally).
 */
inline Waypoint parse_waypoint(const std::string& obj)
{
  Waypoint wp;
  parse_num(obj, "x",   wp.x);
  parse_num(obj, "y",   wp.y);
  parse_num(obj, "z",   wp.z);
  parse_num(obj, "qx",  wp.qx);
  parse_num(obj, "qy",  wp.qy);
  parse_num(obj, "qz",  wp.qz);
  parse_num(obj, "qw",  wp.qw);
  parse_str(obj, "frame", wp.frame);

  // Legacy yaw_deg support
  double yaw_deg = 0.0;
  if (parse_num(obj, "yaw_deg", yaw_deg) && std::abs(yaw_deg) > 1e-4) {
    double yaw = yaw_deg * M_PI / 180.0;
    wp.qx = 0.0;
    wp.qy = 0.0;
    wp.qz = std::sin(yaw / 2.0);
    wp.qw = std::cos(yaw / 2.0);
  }
  return wp;
}

/**
 * @brief Parse full waypoints array JSON string into a vector of Waypoints.
 */
inline std::vector<Waypoint> parse_waypoints(const std::string& json)
{
  std::vector<Waypoint> wps;
  auto elements = split_json_array(json);
  wps.reserve(elements.size());
  for (const auto& el : elements) {
    wps.push_back(parse_waypoint(el));
  }
  return wps;
}

} // namespace json_util

// =============================================================================
// BT Node: ApplyPayloadConfig
// =============================================================================

/**
 * @class ApplyPayloadConfig
 * @brief SyncActionNode — reads Speed/Priority from BB and applies (logs) them.
 */
class ApplyPayloadConfig : public BT::SyncActionNode, public NodeAccessor {
public:
  ApplyPayloadConfig(const std::string& name, const BT::NodeConfiguration& cfg)
  : BT::SyncActionNode(name, cfg) {}

  static BT::PortsList providedPorts() {
    return {
      BT::InputPort<double>("speed",    0.0,      "Target Max Speed (m/s)"),
      BT::InputPort<std::string>("priority", "normal", "Task Priority (low/normal/high)")
    };
  }

  BT::NodeStatus tick() override {
    auto* node = node_from_bb(config());
    double speed = 0.0;
    std::string priority;
    getInput("speed",    speed);
    getInput("priority", priority);
    if (node) {
      RCLCPP_INFO(node->get_logger(),
        "\n>>> [ApplyPayloadConfig]\n    Speed: %.2f m/s | Priority: %s\n",
        speed, priority.c_str());
      // TODO: set /controller_server FollowPath.max_vel_x via param client
    }
    return BT::NodeStatus::SUCCESS;
  }
};

// =============================================================================
// BT Node: SendNav2Goal
// =============================================================================

/**
 * @class SendNav2Goal
 * @brief SyncActionNode — creates and sends a NavigateToPose goal to Nav2.
 *        Supports quaternion (qx/qy/qz/qw) or legacy yaw_deg input.
 *        Outputs the accepted goal UUID as a hex string.
 */
class SendNav2Goal : public BT::SyncActionNode, public NodeAccessor {
public:
  SendNav2Goal(const std::string& name, const BT::NodeConfiguration& cfg)
  : BT::SyncActionNode(name, cfg) {}

  static BT::PortsList providedPorts() {
    using BT::InputPort; using BT::OutputPort;
    return {
      InputPort<double>("x", 0.0, "target x (m)"),
      InputPort<double>("y", 0.0, "target y (m)"),
      InputPort<double>("z", 0.0, "target z (m)"),
      InputPort<double>("yaw_deg", 0.0,  "heading degrees — optional legacy"),
      InputPort<double>("qx", 0.0, "Orientation X"),
      InputPort<double>("qy", 0.0, "Orientation Y"),
      InputPort<double>("qz", 0.0, "Orientation Z"),
      InputPort<double>("qw", 1.0, "Orientation W"),
      InputPort<std::string>("frame_id", std::string("map"), "Global frame id"),
      OutputPort<std::string>("goal_id", "Hex UUID of the accepted goal")
    };
  }

  BT::NodeStatus tick() override
  {
    auto* node = node_from_bb(config());
    if (!node) return BT::NodeStatus::FAILURE;

    if (!client_) {
      client_ = rclcpp_action::create_client<NavigateToPose>(
        node->get_node_base_interface(),
        node->get_node_graph_interface(),
        node->get_node_logging_interface(),
        node->get_node_waitables_interface(),
        "/navigate_to_pose");
    }

    if (!client_->wait_for_action_server(std::chrono::seconds(2))) {
      RCLCPP_ERROR(node->get_logger(), "[SendNav2Goal] Nav2 action server not available");
      return BT::NodeStatus::FAILURE;
    }

    NavigateToPose::Goal goal;
    goal.pose.header.stamp = node->now();

    std::string frame = "map";
    getInput("frame_id", frame);
    goal.pose.header.frame_id = frame;

    getInput("x", goal.pose.pose.position.x);
    getInput("y", goal.pose.pose.position.y);
    getInput("z", goal.pose.pose.position.z);

    double qx = 0.0, qy = 0.0, qz = 0.0, qw = 1.0;
    double yaw_deg = 0.0;

    // Legacy yaw
    if (getInput("yaw_deg", yaw_deg) && std::abs(yaw_deg) > 1e-4) {
      double yaw = yaw_deg * M_PI / 180.0;
      qz = std::sin(yaw / 2.0);
      qw = std::cos(yaw / 2.0);
    }
    // Quaternion overrides yaw
    double tmp;
    if (getInput("qx", tmp)) qx = tmp;
    if (getInput("qy", tmp)) qy = tmp;
    if (getInput("qz", tmp)) qz = tmp;
    if (getInput("qw", tmp)) qw = tmp;

    goal.pose.pose.orientation.x = qx;
    goal.pose.pose.orientation.y = qy;
    goal.pose.pose.orientation.z = qz;
    goal.pose.pose.orientation.w = qw;

    auto opts = rclcpp_action::Client<NavigateToPose>::SendGoalOptions{};
    opts.result_callback = [](auto){};

    auto future_handle = client_->async_send_goal(goal, opts);
    if (future_handle.wait_for(std::chrono::seconds(2)) != std::future_status::ready) {
      RCLCPP_ERROR(node->get_logger(), "[SendNav2Goal] Timed out waiting for acceptance");
      return BT::NodeStatus::FAILURE;
    }

    auto handle = future_handle.get();
    if (!handle) {
      RCLCPP_ERROR(node->get_logger(), "[SendNav2Goal] Goal rejected by server");
      return BT::NodeStatus::FAILURE;
    }

    const auto gid_hex = uuid_to_hex(handle->get_goal_id());
    setOutput("goal_id", gid_hex);

    RCLCPP_INFO(node->get_logger(),
      "[SendNav2Goal] → (%.2f, %.2f) frame=%s id=%s",
      goal.pose.pose.position.x, goal.pose.pose.position.y,
      frame.c_str(), gid_hex.c_str());

    return BT::NodeStatus::SUCCESS;
  }

private:
  rclcpp_action::Client<NavigateToPose>::SharedPtr client_;
};

// =============================================================================
// BT Node: MonitorNav2Status
// =============================================================================

/**
 * @class MonitorNav2Status
 * @brief StatefulActionNode — subscribes to Nav2 status topic and blocks until
 *        the tracked goal UUID reaches a terminal state or timeout expires.
 */
class MonitorNav2Status : public BT::StatefulActionNode, public NodeAccessor {
public:
  MonitorNav2Status(const std::string& name, const BT::NodeConfiguration& cfg)
  : BT::StatefulActionNode(name, cfg) {}

  static BT::PortsList providedPorts() {
    using BT::InputPort;
    return {
      InputPort<std::string>("goal_id",      "Hex UUID to track"),
      InputPort<int64_t>("timeout_ms",   600000, "Timeout ms (default 10 min)"),
      InputPort<std::string>("status_topic",
                             std::string("/navigate_to_pose/_action/status"),
                             "Action status topic")
    };
  }

  BT::NodeStatus onStart() override {
    auto* node = node_from_bb(config());
    if (!node) return BT::NodeStatus::FAILURE;

    target_id_hex_.clear();
    getInput("goal_id",    target_id_hex_);
    getInput("timeout_ms", timeout_ms_);

    if (target_id_hex_.empty()) {
      RCLCPP_ERROR(node->get_logger(), "[MonitorNav2Status] No goal_id provided");
      return BT::NodeStatus::FAILURE;
    }

    std::string topic = "/navigate_to_pose/_action/status";
    getInput("status_topic", topic);

    if (!sub_primary_) {
      sub_primary_ = node->create_subscription<action_msgs::msg::GoalStatusArray>(
        topic, rclcpp::SystemDefaultsQoS(),
        [this, node](const action_msgs::msg::GoalStatusArray& msg){
          ingest_status(msg, node);
        });
    }
    if (!sub_compat_) {
      sub_compat_ = node->create_subscription<action_msgs::msg::GoalStatusArray>(
        "/navigate_to_pose/status", rclcpp::SystemDefaultsQoS(),
        [this, node](const action_msgs::msg::GoalStatusArray& msg){
          ingest_status(msg, node);
        });
    }

    start_       = Clock::now();
    last_state_.store(-1);
    return BT::NodeStatus::RUNNING;
  }

  BT::NodeStatus onRunning() override {
    const auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
      Clock::now() - start_).count();
    if (elapsed >= timeout_ms_) return BT::NodeStatus::FAILURE;

    const int st = last_state_.load();
    if (st < 0) return BT::NodeStatus::RUNNING;
    if (st == 4) return BT::NodeStatus::SUCCESS;              // SUCCEEDED
    if (st == 5 || st == 6) return BT::NodeStatus::FAILURE;  // CANCELED / ABORTED
    return BT::NodeStatus::RUNNING;
  }

  void onHalted() override {}

private:
  void ingest_status(const action_msgs::msg::GoalStatusArray& msg, rclcpp::Node*) {
    for (const auto& st : msg.status_list) {
      if (uuid_to_hex(st.goal_info.goal_id.uuid) == target_id_hex_) {
        last_state_.store(static_cast<int>(st.status));
        break;
      }
    }
  }

  std::string  target_id_hex_;
  int64_t      timeout_ms_{600000};
  std::atomic<int> last_state_{-1};
  Clock::time_point start_;
  rclcpp::Subscription<action_msgs::msg::GoalStatusArray>::SharedPtr sub_primary_;
  rclcpp::Subscription<action_msgs::msg::GoalStatusArray>::SharedPtr sub_compat_;
};

// =============================================================================
// BT Node: Wait
// =============================================================================

/**
 * @class Wait
 * @brief Simple non-blocking timed wait.
 *        Reads either `msec` (unsigned) or `wait_duration` (seconds, float).
 */
class Wait : public BT::StatefulActionNode {
public:
  Wait(const std::string& name, const BT::NodeConfiguration& cfg)
  : BT::StatefulActionNode(name, cfg) {}

  static BT::PortsList providedPorts() {
    return {
      BT::InputPort<unsigned>("msec",          0u,  "Wait time in milliseconds"),
      BT::InputPort<double>("wait_duration", 0.0, "Wait time in seconds (overrides msec)")
    };
  }

  BT::NodeStatus onStart() override {
    unsigned msec = 0;   getInput("msec", msec);
    double   secs = 0.0; getInput("wait_duration", secs);
    wait_ms_ = (secs > 0.0) ? static_cast<uint64_t>(secs * 1000.0)
                             : static_cast<uint64_t>(msec);
    start_ = Clock::now();
    return (wait_ms_ == 0) ? BT::NodeStatus::SUCCESS : BT::NodeStatus::RUNNING;
  }

  BT::NodeStatus onRunning() override {
    const auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
      Clock::now() - start_).count();
    return (elapsed >= static_cast<int64_t>(wait_ms_))
             ? BT::NodeStatus::SUCCESS : BT::NodeStatus::RUNNING;
  }

  void onHalted() override {}

private:
  uint64_t          wait_ms_{0};
  Clock::time_point start_{};
};

// =============================================================================
// BT Node: IterateWaypoints  ← NEW
// =============================================================================

/**
 * @class IterateWaypoints
 * @brief DecoratorNode that iterates over a JSON waypoints array on the blackboard.
 *
 * Must inherit from BT::DecoratorNode — NOT StatefulActionNode — because it
 * wraps a child subtree and needs child_node_->executeTick() / haltNode().
 * DecoratorNode provides child_node_, executeTick(), resetStatus(), haltNode().
 *
 * tick() lifecycle (called by the BT engine each tree tick):
 *   • First call (IDLE status): parse JSON, validate, write WP[0] to BB.
 *   • Subsequent calls: forward tick to child.
 *     - Child RUNNING  → return RUNNING (engine will tick us again next cycle)
 *     - Child FAILURE  → halt child, return FAILURE (fail-fast)
 *     - Child SUCCESS  → advance index; if more WPs remain: reset child,
 *                        write next WP to BB, return RUNNING;
 *                        if all done: return SUCCESS.
 *
 * Blackboard outputs written per waypoint iteration:
 *   out_x, out_y, out_z, out_qx, out_qy, out_qz, out_qw, out_frame,
 *   current_index (0-based), total_count
 *
 * Expected "waypoints_json" format (injected by runner.cpp):
 *   [
 *     {"x":1.0,"y":2.0,"z":0.0,"qw":1.0,"frame":"map"},
 *     {"x":3.0,"y":4.0,"z":0.0,"yaw_deg":90.0},
 *     ...
 *   ]
 */
class IterateWaypoints : public BT::DecoratorNode, public NodeAccessor
{
public:
  IterateWaypoints(const std::string& name, const BT::NodeConfiguration& cfg)
  : BT::DecoratorNode(name, cfg) {}

  static BT::PortsList providedPorts() {
    using BT::InputPort; using BT::OutputPort;
    return {
      // Input: raw JSON array string (injected by runner.cpp)
      InputPort<std::string>("waypoints_json", "JSON array of waypoint objects"),

      // Per-iteration outputs — consumed by child SendNav2Goal
      OutputPort<double>("out_x",          "current waypoint x"),
      OutputPort<double>("out_y",          "current waypoint y"),
      OutputPort<double>("out_z",          "current waypoint z"),
      OutputPort<double>("out_qx",         "current waypoint qx"),
      OutputPort<double>("out_qy",         "current waypoint qy"),
      OutputPort<double>("out_qz",         "current waypoint qz"),
      OutputPort<double>("out_qw",         "current waypoint qw"),
      OutputPort<std::string>("out_frame", "current waypoint frame_id"),

      // Progress (read by runner.cpp for feedback %)
      OutputPort<int>("current_index", "0-based index of current waypoint"),
      OutputPort<int>("total_count",   "total number of waypoints"),
    };
  }

  /**
   * @brief Core tick — called every BT engine cycle.
   *
   * We use status() == IDLE as the "first call" sentinel so that JSON is
   * parsed exactly once per goal, not on every tick.
   */
  BT::NodeStatus tick() override
  {
    auto* ros_node = node_from_bb(config());

    // ---- First call: initialise ----
    if (status() == BT::NodeStatus::IDLE) {
      std::string json;
      if (!getInput("waypoints_json", json) || json.empty()) {
        if (ros_node) RCLCPP_ERROR(ros_node->get_logger(),
          "[IterateWaypoints] waypoints_json is empty or missing");
        return BT::NodeStatus::FAILURE;
      }

      waypoints_ = json_util::parse_waypoints(json);
      if (waypoints_.empty()) {
        if (ros_node) RCLCPP_ERROR(ros_node->get_logger(),
          "[IterateWaypoints] No waypoints parsed from JSON");
        return BT::NodeStatus::FAILURE;
      }

      current_idx_ = 0;
      setOutput("total_count", static_cast<int>(waypoints_.size()));
      write_current_waypoint(ros_node);

      if (ros_node) RCLCPP_INFO(ros_node->get_logger(),
        "[IterateWaypoints] Route started: %zu waypoints", waypoints_.size());
    }

    // ---- Tick the child subtree ----
    const BT::NodeStatus child_status = child_node_->executeTick();

    if (child_status == BT::NodeStatus::RUNNING) {
      return BT::NodeStatus::RUNNING;
    }

    if (child_status == BT::NodeStatus::FAILURE) {
      if (ros_node) RCLCPP_ERROR(ros_node->get_logger(),
        "[IterateWaypoints] WP[%d/%zu] FAILED — aborting route",
        current_idx_ + 1, waypoints_.size());
      // halt the child cleanly before returning failure
      haltChild();
      return BT::NodeStatus::FAILURE;
    }

    // child SUCCESS — waypoint reached
    if (ros_node) RCLCPP_INFO(ros_node->get_logger(),
      "[IterateWaypoints] WP[%d/%zu] reached ✓",
      current_idx_ + 1, waypoints_.size());

    ++current_idx_;

    if (current_idx_ >= static_cast<int>(waypoints_.size())) {
      if (ros_node) RCLCPP_INFO(ros_node->get_logger(),
        "[IterateWaypoints] All %zu waypoints completed ✓", waypoints_.size());
      return BT::NodeStatus::SUCCESS;
    }

    // More waypoints remain — halt+reset child state and load next WP onto BB
    // haltNode() is the public API in BT.CPP v4; it halts and resets to IDLE.
    child_node_->haltNode();
    write_current_waypoint(ros_node);
    return BT::NodeStatus::RUNNING;
  }

  // DecoratorNode halt — propagates to child automatically via base class,
  // but we override to be explicit and reset our own state.
  void halt() override {
    haltChild();
    BT::DecoratorNode::halt();
  }

private:
  void write_current_waypoint(rclcpp::Node* ros_node)
  {
    const auto& wp = waypoints_[current_idx_];
    setOutput("out_x",         wp.x);
    setOutput("out_y",         wp.y);
    setOutput("out_z",         wp.z);
    setOutput("out_qx",        wp.qx);
    setOutput("out_qy",        wp.qy);
    setOutput("out_qz",        wp.qz);
    setOutput("out_qw",        wp.qw);
    setOutput("out_frame",     wp.frame);
    setOutput("current_index", current_idx_);

    if (ros_node) RCLCPP_INFO(ros_node->get_logger(),
      "[IterateWaypoints] → WP[%d] (%.2f, %.2f, %.2f) frame=%s",
      current_idx_, wp.x, wp.y, wp.z, wp.frame.c_str());
  }

  // haltChild() — haltNode() is safe to call in any state and resets to IDLE.
  void haltChild() {
    child_node_->haltNode();
  }

  std::vector<json_util::Waypoint> waypoints_;
  int current_idx_{0};
};

// =============================================================================
// Factory Registration
// =============================================================================

inline void registerNav2Nodes(BT::BehaviorTreeFactory& f) {
  f.registerNodeType<ApplyPayloadConfig>("ApplyPayloadConfig");
  f.registerNodeType<SendNav2Goal>("SendNav2Goal");
  f.registerNodeType<MonitorNav2Status>("MonitorNav2Status");
  f.registerNodeType<Wait>("Wait");
  f.registerNodeType<IterateWaypoints>("IterateWaypoints");  // NEW
}

} // namespace bt_runner_nav2