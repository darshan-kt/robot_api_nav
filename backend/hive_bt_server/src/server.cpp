#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>

#include <std_msgs/msg/string.hpp>
#include <atomic>
#include <chrono>
#include <future>
#include <string>
#include <unordered_map>

#include <nav2_msgs/action/navigate_to_pose.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include "hive_interfaces/action/execute_behavior.hpp"

using ExecuteBehavior = hive_interfaces::action::ExecuteBehavior;
using ServerHandle    = rclcpp_action::ServerGoalHandle<ExecuteBehavior>;
using ClientHandle    = rclcpp_action::ClientGoalHandle<ExecuteBehavior>;
using namespace std::chrono_literals;
using NavigateToPose  = nav2_msgs::action::NavigateToPose;


class HiveServerNode : public rclcpp::Node {
public:
  HiveServerNode() : rclcpp::Node("hive_bt_server")
  {
    // Routing table — id → behavior_name (Add new routes here)
    declare_parameter<std::string>("route_id_1",  "SimpleTurtle");
    declare_parameter<std::string>("route_id_2",  "GoToA");
    declare_parameter<std::string>("route_id_3",  "GoToB");
    declare_parameter<std::string>("route_id_4",  "GoToAA");
    declare_parameter<std::string>("route_id_5",  "GoToBB");
    declare_parameter<std::string>("route_id_6",  "GoToRouteNoReturn");
    declare_parameter<std::string>("route_id_7",  "GoToRouteWithReturn");
    declare_parameter<std::string>("route_id_10", "StopNow");

    // 20-series: generic coordinate goals
    declare_parameter<std::string>("route_id_21", "GoToPose");
    declare_parameter<std::string>("route_id_22", "GoToWaypoints");  // NEW

    // StopNow knobs
    declare_parameter<int>("stop_hold_ms",    1200);
    declare_parameter<int>("stop_cooldown_ms", 5000);
    declare_parameter<int>("stop_zero_hz",      25);

    pub_status_ = create_publisher<std_msgs::msg::String>("/hive/status", 10);

    // API-facing Action Server
    server_ = rclcpp_action::create_server<ExecuteBehavior>(
      this, "/hive/execute_behavior",
      std::bind(&HiveServerNode::handle_goal,     this, std::placeholders::_1, std::placeholders::_2),
      std::bind(&HiveServerNode::handle_cancel,   this, std::placeholders::_1),
      std::bind(&HiveServerNode::handle_accepted, this, std::placeholders::_1));

    // Runner-facing Action Client
    client_ = rclcpp_action::create_client<ExecuteBehavior>(this, "/bt_runner/execute_behavior");

    // Nav2 client — needed so StopNow can cancel Nav2 directly
    nav_client_ = rclcpp_action::create_client<NavigateToPose>(this, "/navigate_to_pose");

    RCLCPP_INFO(get_logger(), "HiveServer ready — id=22 → GoToWaypoints registered");
  }

private:
  enum class ServerState { IDLE, STOPPING };
  std::atomic<ServerState> state_{ServerState::IDLE};

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  void publish_status(const std::string& task_id,
                      const std::string& phase,
                      const std::string& detail)
  {
    std_msgs::msg::String msg;
    msg.data = std::string("{\"task_id\":\"") + task_id +
               "\",\"phase\":\""  + phase  +
               "\",\"detail\":\"" + detail + "\"}";
    pub_status_->publish(msg);
  }

  // ---------------------------------------------------------------------------
  // Action Server Callbacks
  // ---------------------------------------------------------------------------

  rclcpp_action::GoalResponse handle_goal(
      const rclcpp_action::GoalUUID&,
      std::shared_ptr<const ExecuteBehavior::Goal> goal)
  {
    if (state_.load() == ServerState::STOPPING) {
      RCLCPP_WARN(get_logger(), "Rejecting goal during STOP cooldown");
      return rclcpp_action::GoalResponse::REJECT;
    }
    if (goal->id <= 0 && goal->behavior_name.empty()) {
      RCLCPP_WARN(get_logger(), "Rejecting goal: empty id & behavior_name");
      return rclcpp_action::GoalResponse::REJECT;
    }

    RCLCPP_INFO(get_logger(), "Hive accepted: id=%d behavior='%s' task=%s",
                goal->id, goal->behavior_name.c_str(), goal->task_id.c_str());
    publish_status(goal->task_id, "ACCEPTED",
                   "id=" + std::to_string(goal->id) +
                   " behavior=" + goal->behavior_name);
    return rclcpp_action::GoalResponse::ACCEPT_AND_EXECUTE;
  }

  rclcpp_action::CancelResponse handle_cancel(const std::shared_ptr<ServerHandle> sh)
  {
    RCLCPP_WARN(get_logger(), "Cancel requested for task=%s",
                sh->get_goal()->task_id.c_str());
    publish_status(sh->get_goal()->task_id, "CANCEL_REQUESTED", "from API");
    cancel_requested_.store(true);
    return rclcpp_action::CancelResponse::ACCEPT;
  }

  void handle_accepted(const std::shared_ptr<ServerHandle> sh)
  {
    std::thread{std::bind(&HiveServerNode::execute, this, sh)}.detach();
  }

  // ---------------------------------------------------------------------------
  // execute()
  // ---------------------------------------------------------------------------

  void execute(const std::shared_ptr<ServerHandle> sh)
  {
    cancel_requested_.store(false);
    auto in  = sh->get_goal();
    ExecuteBehavior::Goal fwd = *in;

    // ---- Special case: StopNow (id=10) ----
    const bool is_stopnow = (fwd.behavior_name == "StopNow") || (fwd.id == 10);
    if (is_stopnow) {
      state_.store(ServerState::STOPPING);
      publish_status(in->task_id, "STOP_REQUESTED", "server-level stop");
      RCLCPP_WARN(get_logger(), "[StopNow] Cancelling runner + forcing zero twist");

      try {
        if (client_ && client_->wait_for_action_server(300ms)) {
          if (last_runner_goal_) {
            (void)client_->async_cancel_goal(last_runner_goal_);
          } else {
            (void)client_->async_cancel_all_goals();
          }
        }
        if (nav_client_ && nav_client_->wait_for_action_server(300ms)) {
          (void)nav_client_->async_cancel_all_goals();
          RCLCPP_WARN(get_logger(), "[StopNow] cancel_all sent to /navigate_to_pose");
        }
      } catch (const std::exception& e) {
        RCLCPP_WARN(get_logger(), "[StopNow] cancel threw: %s", e.what());
      }

      const int hold_ms = get_parameter("stop_hold_ms").as_int();
      const int hz      = get_parameter("stop_zero_hz").as_int();
      const int period  = std::max(1, 1000 / std::max(1, hz));
      geometry_msgs::msg::Twist zero;
      for (int e = 0; rclcpp::ok() && e < hold_ms; e += period) {
        if (pub_cmd_) pub_cmd_->publish(zero);
        std::this_thread::sleep_for(std::chrono::milliseconds(period));
      }

      const int cooldown_ms = get_parameter("stop_cooldown_ms").as_int();
      publish_status(in->task_id, "STOP_COOLDOWN", std::to_string(cooldown_ms) + " ms");
      for (int c = 0; rclcpp::ok() && c < cooldown_ms; c += 50)
        std::this_thread::sleep_for(50ms);

      auto res = std::make_shared<ExecuteBehavior::Result>();
      res->success = true;
      res->outcome_text = "Stopped";
      publish_status(in->task_id, "RESULT", "SUCCESS stop complete");
      state_.store(ServerState::IDLE);
      sh->succeed(res);
      return;
    }

    // ---- ID -> behavior_name mapping ----
    // Only runs when the client didn't provide a behavior_name directly.
    if (fwd.behavior_name.empty()) {
      const std::map<int, std::string> route_params = {
        {1,  "route_id_1"},  {2,  "route_id_2"},  {3,  "route_id_3"},
        {4,  "route_id_4"},  {5,  "route_id_5"},  {6,  "route_id_6"},
        {7,  "route_id_7"},  {10, "route_id_10"}, {21, "route_id_21"},
        {22, "route_id_22"},
      };
      auto it = route_params.find(fwd.id);
      if (it != route_params.end()) {
        fwd.behavior_name = get_parameter(it->second).as_string();
      } else {
        auto res = std::make_shared<ExecuteBehavior::Result>();
        res->success = false; res->outcome_text = "Unknown id";
        publish_status(in->task_id, "ERROR", "Unknown id=" + std::to_string(fwd.id));
        sh->abort(res); return;
      }
    }

    // ---- Alias normalisation ----
    // Translates friendly/external behavior names to canonical runner names.
    // Runs ALWAYS (whether name came from ID map or directly from the client)
    // so the runner switch-case always sees a name it recognises.
    {
      static const std::unordered_map<std::string, std::string> kAliases = {
        // Multi-waypoint aliases  (id=22)
        {"FollowRoute",       "GoToWaypoints"},
        {"MultiWaypoint",     "GoToWaypoints"},
        {"NavigateWaypoints", "GoToWaypoints"},
        {"WaypointRoute",     "GoToWaypoints"},
        // Single-pose aliases  (id=21)
        {"GoToPose2D",        "GoToPose"},
        {"NavigateToPose",    "GoToPose"},
      };
      auto alias_it = kAliases.find(fwd.behavior_name);
      if (alias_it != kAliases.end()) {
        RCLCPP_INFO(get_logger(), "Alias resolved: '%s' -> '%s'",
                    fwd.behavior_name.c_str(), alias_it->second.c_str());
        fwd.behavior_name = alias_it->second;
      }
    }

    RCLCPP_INFO(get_logger(), "Routing task=%s id=%d → behavior='%s'",
                in->task_id.c_str(), in->id, fwd.behavior_name.c_str());
    publish_status(in->task_id, "ROUTED", "behavior=" + fwd.behavior_name);

    // ---- Wait for runner ----
    if (!client_->wait_for_action_server(5s)) {
      auto res = std::make_shared<ExecuteBehavior::Result>();
      res->success = false; res->outcome_text = "Runner unavailable";
      publish_status(in->task_id, "ERROR", "Runner unavailable");
      sh->abort(res); return;
    }

    // ---- Forward goal with feedback relay ----
    auto opts = rclcpp_action::Client<ExecuteBehavior>::SendGoalOptions();
    opts.feedback_callback =
      [this, sh](ClientHandle::SharedPtr,
                 const std::shared_ptr<const ExecuteBehavior::Feedback> fb)
      {
        if (!sh->is_executing()) return;
        RCLCPP_INFO_THROTTLE(get_logger(), *get_clock(), 1000,
          "Runner fb: state='%s' progress=%.1f%% comment='%s'",
          fb->current_state.c_str(), fb->progress_percent, fb->comment.c_str());
        publish_status(sh->get_goal()->task_id, "FEEDBACK",
                       "state=" + fb->current_state +
                       ", progress=" + std::to_string(fb->progress_percent) +
                       ", comment=" + fb->comment);
        sh->publish_feedback(std::make_shared<ExecuteBehavior::Feedback>(*fb));
      };

    auto gh_future = client_->async_send_goal(fwd, opts);
    if (gh_future.wait_for(5s) != std::future_status::ready) {
      auto res = std::make_shared<ExecuteBehavior::Result>();
      res->success = false; res->outcome_text = "Failed to send goal to runner";
      publish_status(in->task_id, "ERROR", "Failed to send to runner");
      sh->abort(res); return;
    }

    auto runner_handle = gh_future.get();
    if (!runner_handle) {
      auto res = std::make_shared<ExecuteBehavior::Result>();
      res->success = false; res->outcome_text = "Runner rejected goal";
      publish_status(in->task_id, "ERROR", "Runner rejected goal");
      sh->abort(res); return;
    }
    last_runner_goal_ = runner_handle;

    auto result_future = client_->async_get_result(runner_handle);

    // ---- Wait loop ----
    while (rclcpp::ok()) {
      if (cancel_requested_.load() || sh->is_canceling()) {
        RCLCPP_WARN(get_logger(), "Forwarding cancel for task=%s", in->task_id.c_str());
        publish_status(in->task_id, "CANCELLED", "Forwarded to runner");
        client_->async_cancel_goal(runner_handle);
        (void)result_future.wait_for(1s);
        auto res = std::make_shared<ExecuteBehavior::Result>();
        res->success = false; res->outcome_text = "Cancelled";
        sh->canceled(res);
        return;
      }

      if (result_future.wait_for(200ms) == std::future_status::ready) {
        auto wrapped = result_future.get();
        auto res     = wrapped.result;
        if (wrapped.code == rclcpp_action::ResultCode::SUCCEEDED && res && res->success) {
          RCLCPP_INFO(get_logger(), "Runner SUCCESS task=%s", in->task_id.c_str());
          publish_status(in->task_id, "RESULT", "SUCCESS log=" + (res ? res->log_file : ""));
          sh->succeed(res);
          last_runner_goal_.reset();
        } else {
          const std::string outcome = res ? res->outcome_text : "no result";
          RCLCPP_WARN(get_logger(), "Runner FAILURE task=%s outcome=%s",
                      in->task_id.c_str(), outcome.c_str());
          publish_status(in->task_id, "RESULT", "FAILURE outcome=" + outcome);
          sh->abort(res ? res : std::make_shared<ExecuteBehavior::Result>());
          last_runner_goal_.reset();
        }
        return;
      }
      std::this_thread::sleep_for(50ms);
    }

    auto res = std::make_shared<ExecuteBehavior::Result>();
    res->success = false; res->outcome_text = "Server shutdown";
    publish_status(in->task_id, "ERROR", "Server shutdown");
    sh->abort(res);
  }

  // ---------------------------------------------------------------------------
  // Members
  // ---------------------------------------------------------------------------
  rclcpp_action::Server<ExecuteBehavior>::SharedPtr  server_;
  rclcpp_action::Client<ExecuteBehavior>::SharedPtr  client_;
  rclcpp_action::Client<NavigateToPose>::SharedPtr   nav_client_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr pub_status_;
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr pub_cmd_;
  std::shared_ptr<ClientHandle>                      last_runner_goal_;
  std::atomic<bool>                                  cancel_requested_{false};
};

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<HiveServerNode>());
  rclcpp::shutdown();
  return 0;
}