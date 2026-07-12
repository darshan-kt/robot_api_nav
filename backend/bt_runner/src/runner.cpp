/**
 * @file runner.cpp
 * @brief General Purpose Behavior Tree Action Server for ROS 2
 *
 * Supports:
 *   id=21  behavior="GoToPose"       — single generic waypoint  (go_to_pose.xml)
 *   id=22  behavior="GoToWaypoints"  — multiple generic waypoints (go_to_waypoints.xml)  ← NEW
 *
 * For GoToWaypoints the runner parses the "waypoints" array from json_payload and
 * injects the serialised JSON string onto the blackboard as "waypoints_json".
 * The IterateWaypoints BT node then owns the per-waypoint iteration loop.
 *
 * @author [Darshan Gowda / Hive Robotics](https://hiverobotics.com)
 * @date 18/11/2025  (updated: multi-waypoint support)
 */

#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>
#include <ament_index_cpp/get_package_share_directory.hpp>

#include <behaviortree_cpp/bt_factory.h>
#include <behaviortree_cpp/loggers/groot2_publisher.h>
#include <behaviortree_cpp/loggers/bt_file_logger_v2.h>

#include <sensor_msgs/msg/laser_scan.hpp>
#include <geometry_msgs/msg/twist.hpp>

#include "hive_interfaces/action/execute_behavior.hpp"
#include "bt_runner/context.hpp"
#include "bt_runner/nodes_goto_a.hpp"

using ExecuteBehavior = hive_interfaces::action::ExecuteBehavior;
using GoalHandle      = rclcpp_action::ServerGoalHandle<ExecuteBehavior>;
using sensor_msgs::msg::LaserScan;

// =============================================================================
// Lightweight JSON helpers (reuse same pattern as nodes_goto_a.hpp)
// =============================================================================
namespace runner_json {

  /**
   * @brief Extract the raw JSON array bound to a key from a JSON object string.
   *        e.g.  find_array(payload, "waypoints")  →  "[{...},{...}]"
   */
  inline std::string find_array(const std::string& obj, const std::string& key)
  {
    auto k = "\"" + key + "\"";
    auto p = obj.find(k);
    if (p == std::string::npos) return "";
    p = obj.find(':', p);
    if (p == std::string::npos) return "";
    // skip whitespace
    size_t q = p + 1;
    while (q < obj.size() && obj[q] == ' ') ++q;
    if (q >= obj.size() || obj[q] != '[') return "";

    // Walk to the matching ']'
    int depth = 0;
    size_t start = q;
    for (size_t i = q; i < obj.size(); ++i) {
      if      (obj[i] == '[') ++depth;
      else if (obj[i] == ']') { --depth; if (depth == 0) return obj.substr(start, i - start + 1); }
    }
    return "";
  }

  inline bool find_num(const std::string& obj, const std::string& key, double& out)
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

  inline bool find_str(const std::string& obj, const std::string& key, std::string& out)
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

} // namespace runner_json

// =============================================================================
// BtRunnerNode
// =============================================================================

class BtRunnerNode : public rclcpp::Node {
public:
  BtRunnerNode() : rclcpp::Node("bt_runner")
  {
    declare_parameter<int>("tick_ms",      500);
    declare_parameter<int>("groot_port",  1667);
    declare_parameter<double>("max_lin",   0.6);
    declare_parameter<double>("max_ang",   1.0);
    declare_parameter<double>("front_deg",180.0);

    ctx_ = std::make_shared<bt_runner::Context>();
    ctx_->node = this;
    ctx_->pub_cmd = create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", 10);

    sub_scan_ = create_subscription<LaserScan>(
      "/scan", rclcpp::SensorDataQoS(),
      [this](const LaserScan::SharedPtr msg){
        const double fdeg = get_parameter("front_deg").as_double();
        ctx_->front_clear_m.store(bt_runner::compute_front_clear(*msg, fdeg));
      });

    server_ = rclcpp_action::create_server<ExecuteBehavior>(
      this, "/bt_runner/execute_behavior",
      std::bind(&BtRunnerNode::handle_goal,     this, std::placeholders::_1, std::placeholders::_2),
      std::bind(&BtRunnerNode::handle_cancel,   this, std::placeholders::_1),
      std::bind(&BtRunnerNode::handle_accepted, this, std::placeholders::_1));

    RCLCPP_INFO(get_logger(), "BT Runner Ready — waiting for goals...");
  }

private:
  // ---------------------------------------------------------------------------
  // Action Server Callbacks
  // ---------------------------------------------------------------------------

  rclcpp_action::GoalResponse handle_goal(
      const rclcpp_action::GoalUUID&,
      std::shared_ptr<const ExecuteBehavior::Goal> goal)
  {
    RCLCPP_INFO(get_logger(), "Runner received goal: id=%d behavior='%s' task=%s",
                goal->id, goal->behavior_name.c_str(), goal->task_id.c_str());
    return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
  }

  rclcpp_action::CancelResponse handle_cancel(const std::shared_ptr<GoalHandle>)
  {
    RCLCPP_WARN(get_logger(), "Cancel requested → halting tree");
    halt_requested_.store(true);
    return rclcpp_action::CancelResponse::ACCEPT;
  }

  void handle_accepted(const std::shared_ptr<GoalHandle> gh)
  {
    std::thread{std::bind(&BtRunnerNode::execute, this, gh)}.detach();
  }

  // ---------------------------------------------------------------------------
  // execute() — main goal handler
  // ---------------------------------------------------------------------------

  void execute(const std::shared_ptr<GoalHandle> gh)
  {
    auto goal   = gh->get_goal();
    auto result = std::make_shared<ExecuteBehavior::Result>();
    halt_requested_.store(false);

    // -------------------------------------------------------------------------
    // 1. Behavior Name Resolution
    // -------------------------------------------------------------------------
    std::string behavior = goal->behavior_name;
    if (behavior.empty()) {
      switch (goal->id) {
        case 2:  behavior = "GoToA";                break;
        case 3:  behavior = "GoToB";                break;
        case 4:  behavior = "GoToAA";               break;
        case 5:  behavior = "GoToBB";               break;
        case 6:  behavior = "GoToRouteNoReturn";    break;
        case 7:  behavior = "GoToRouteWithReturn";  break;
        case 21: behavior = "GoToPose";             break;
        case 22: behavior = "GoToWaypoints";        break;  // NEW
        default:
          result->success      = false;
          result->outcome_text = "Unknown id and empty behavior_name";
          gh->abort(result);
          return;
      }
    }

    // -------------------------------------------------------------------------
    // 2. Factory Registration
    // -------------------------------------------------------------------------
    BT::BehaviorTreeFactory factory;
    bt_runner_nav2::registerNav2Nodes(factory);   // includes IterateWaypoints

    // -------------------------------------------------------------------------
    // 3. Blackboard Configuration
    // -------------------------------------------------------------------------
    auto bb = BT::Blackboard::create();
    bb->set("ctx",     ctx_);
    bb->set("max_lin", get_parameter("max_lin").as_double());
    bb->set("max_ang", get_parameter("max_ang").as_double());

    // --- A. Pose Injection (used by GoToPose / id=21) ---
    const auto& gpose = goal->pose;
    const std::string frame = gpose.header.frame_id.empty() ? "map" : gpose.header.frame_id;
    bb->set("goal_frame", frame);
    bb->set("goal_x",     gpose.pose.position.x);
    bb->set("goal_y",     gpose.pose.position.y);
    bb->set("goal_z",     gpose.pose.position.z);
    bb->set("goal_qx",    gpose.pose.orientation.x);
    bb->set("goal_qy",    gpose.pose.orientation.y);
    bb->set("goal_qz",    gpose.pose.orientation.z);
    bb->set("goal_qw",    gpose.pose.orientation.w);

    // --- B. JSON Payload Parsing ---
    const auto& payload = goal->json_payload;
    auto to_lower = [](std::string s){
      std::transform(s.begin(), s.end(), s.begin(), ::tolower); return s;
    };

    double      speed_val    = get_parameter("max_lin").as_double();
    std::string priority_val = "normal";
    unsigned    pause_ms     = 500;  // default inter-waypoint pause

    try {
      runner_json::find_num(payload, "speed",    speed_val);
      runner_json::find_str(payload, "priority", priority_val);
      double pause_s = 0.0;
      if (runner_json::find_num(payload, "pause_ms", pause_s))
        pause_ms = static_cast<unsigned>(pause_s);
    } catch (...) {}

    // Shared payload BB keys (GoToPose + GoToWaypoints both read these)
    bb->set("req_speed",    speed_val);
    bb->set("req_priority", to_lower(priority_val));
    bb->set("speed",        speed_val);   // legacy
    bb->set("priority",     to_lower(priority_val)); // legacy
    bb->set("wp_pause_ms",  pause_ms);   // inter-waypoint pause for IterateWaypoints

    // --- C. Waypoints JSON Injection (GoToWaypoints / id=22) --- NEW
    if (behavior == "GoToWaypoints") {
      // The API is expected to send json_payload like:
      //   {
      //     "speed": 0.5,
      //     "priority": "normal",
      //     "pause_ms": 500,
      //     "waypoints": [
      //       {"x":1.0,"y":2.0,"z":0.0,"qw":1.0,"frame":"map"},
      //       {"x":3.0,"y":4.0,"z":0.0,"yaw_deg":90.0},
      //       ...
      //     ]
      //   }
      const std::string waypoints_json = runner_json::find_array(payload, "waypoints");

      if (waypoints_json.empty()) {
        RCLCPP_ERROR(get_logger(),
          "[Runner] GoToWaypoints: 'waypoints' array not found in json_payload.\n"
          "  Expected format: {\"waypoints\":[{\"x\":...},{\"x\":...}]}");
        result->success      = false;
        result->outcome_text = "GoToWaypoints: missing 'waypoints' array in json_payload";
        gh->abort(result);
        return;
      }

      bb->set("waypoints_json", waypoints_json);

      RCLCPP_INFO(get_logger(),
        "[Runner] GoToWaypoints: injected %zu chars of waypoints JSON",
        waypoints_json.size());
    }

    // -------------------------------------------------------------------------
    // 4. Tree Selection & Loading
    // -------------------------------------------------------------------------
    std::string xml_path;
    const auto share = ament_index_cpp::get_package_share_directory("bt_runner");

    if      (behavior == "GoToA")               xml_path = share + "/trees/go_to_a.xml";
    else if (behavior == "GoToB")               xml_path = share + "/trees/go_to_b.xml";
    else if (behavior == "GoToAA")              xml_path = share + "/trees/go_to_aa.xml";
    else if (behavior == "GoToBB")              xml_path = share + "/trees/go_to_bb.xml";
    else if (behavior == "GoToRouteNoReturn")   xml_path = share + "/trees/go_to_route_no_return.xml";
    else if (behavior == "GoToRouteWithReturn") xml_path = share + "/trees/go_to_route_with_return.xml";
    else if (behavior == "GoToPose")            xml_path = share + "/trees/go_to_pose.xml";
    else if (behavior == "GoToWaypoints")       xml_path = share + "/trees/go_to_waypoints.xml"; // NEW
    else {
      result->success      = false;
      result->outcome_text = "Unknown behavior_name: " + behavior;
      gh->abort(result);
      return;
    }

    BT::Tree tree;
    try {
      tree = factory.createTreeFromFile(xml_path, bb);
    } catch (const std::exception& e) {
      result->success      = false;
      result->outcome_text = "XML Load Error: " + std::string(e.what());
      gh->abort(result);
      return;
    }

    // -------------------------------------------------------------------------
    // 5. Execution & Monitoring
    // -------------------------------------------------------------------------
    BT::Groot2Publisher groot(tree,
      static_cast<unsigned>(get_parameter("groot_port").as_int()));

    {
      auto fb = std::make_shared<ExecuteBehavior::Feedback>();
      fb->progress_percent = 0.0f;
      fb->current_state    = "STARTING";
      fb->comment          = "Tree loaded: " + behavior;
      gh->publish_feedback(fb);
    }

    const int tick_ms = get_parameter("tick_ms").as_int();
    rclcpp::WallRate rate{std::chrono::milliseconds(tick_ms)};

    while (rclcpp::ok() && !halt_requested_.load()) {
      auto status = tree.tickWhileRunning();

      // --- Feedback: include waypoint progress for multi-WP tasks ---
      auto fb = std::make_shared<ExecuteBehavior::Feedback>();

      if (behavior == "GoToWaypoints") {
        // Pull progress from BB (written by IterateWaypoints)
        int cur = 0, tot = 0;
        try { cur = bb->get<int>("wp_index");   } catch (...) {}
        try { tot = bb->get<int>("wp_total");   } catch (...) {}
        fb->progress_percent = (tot > 0)
          ? static_cast<float>(cur) / static_cast<float>(tot) * 100.0f
          : (status == BT::NodeStatus::SUCCESS ? 100.0f : 0.0f);
        fb->comment = behavior + " wp " + std::to_string(cur) + "/" + std::to_string(tot);
      } else {
        fb->progress_percent = (status == BT::NodeStatus::RUNNING)  ? 50.0f  :
                               (status == BT::NodeStatus::SUCCESS)   ? 100.0f : 0.0f;
        fb->comment = behavior;
      }

      fb->current_state = BT::toStr(tree.rootNode()->status(), true);
      gh->publish_feedback(fb);

      if (status == BT::NodeStatus::SUCCESS || status == BT::NodeStatus::FAILURE) {
        geometry_msgs::msg::Twist zero;
        ctx_->pub_cmd->publish(zero);

        result->success      = (status == BT::NodeStatus::SUCCESS);
        result->outcome_text = BT::toStr(status, true);
        result->log_file     = "task_" + goal->task_id + ".btlog";
        gh->succeed(result);
        return;
      }

      rate.sleep();
    }

    // Cancelled
    geometry_msgs::msg::Twist zero;
    ctx_->pub_cmd->publish(zero);
    result->success      = false;
    result->outcome_text = "Cancelled by User";
    gh->canceled(result);
  }

  // ---------------------------------------------------------------------------
  // Members
  // ---------------------------------------------------------------------------
  std::shared_ptr<bt_runner::Context>               ctx_;
  rclcpp::Subscription<LaserScan>::SharedPtr         sub_scan_;
  rclcpp_action::Server<ExecuteBehavior>::SharedPtr  server_;
  std::atomic<bool>                                  halt_requested_{false};
};

// =============================================================================
int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<BtRunnerNode>());
  rclcpp::shutdown();
  return 0;
}