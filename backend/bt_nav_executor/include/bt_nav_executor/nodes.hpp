/**
 * @file nodes.hpp
 * @brief Custom Behavior Tree Nodes for Nav2 integration
 * 
 * Provides:
 * - SendNav2Goal: Sends navigation goals to Nav2
 * - MonitorNav2Status: Monitors goal completion status
 * - Wait: Non-blocking wait node
 * 
 * @author Darshan Gowda / Hive Robotics
 * @date 2025
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

namespace bt_runner_nav2 {

using NavigateToPose = nav2_msgs::action::NavigateToPose;
using Clock = std::chrono::steady_clock;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * @brief Convert UUID array to hex string
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
 * @brief Get ROS node from blackboard
 */
inline rclcpp::Node* get_node_from_blackboard(const BT::NodeConfiguration& config)
{
    try {
        return config.blackboard->get<rclcpp::Node*>("ros_node");
    } catch (...) {
        return nullptr;
    }
}

// =============================================================================
// BT Node: SendNav2Goal
// =============================================================================

/**
 * @class SendNav2Goal
 * @brief Sends a navigation goal to Nav2 action server
 */
class SendNav2Goal : public BT::SyncActionNode
{
public:
    SendNav2Goal(const std::string& name, const BT::NodeConfiguration& config)
        : BT::SyncActionNode(name, config) {}

    static BT::PortsList providedPorts()
    {
        return {
            BT::InputPort<double>("x", "X position (m)"),
            BT::InputPort<double>("y", "Y position (m)"),
            BT::InputPort<double>("z", 0.0, "Z position (m)"),
            BT::InputPort<double>("yaw_deg", 0.0, "Yaw in degrees"),
            BT::InputPort<double>("qx", 0.0, "Quaternion X"),
            BT::InputPort<double>("qy", 0.0, "Quaternion Y"),
            BT::InputPort<double>("qz", 0.0, "Quaternion Z"),
            BT::InputPort<double>("qw", 1.0, "Quaternion W"),
            BT::InputPort<std::string>("frame_id", "map", "Frame ID"),
            BT::OutputPort<std::string>("goal_id", "Goal UUID")
        };
    }

    BT::NodeStatus tick() override
    {
        auto* node = get_node_from_blackboard(config());
        if (!node) {
            RCLCPP_ERROR(rclcpp::get_logger("SendNav2Goal"), 
                "No ROS node in blackboard");
            return BT::NodeStatus::FAILURE;
        }

        // Create action client if needed
        if (!client_) {
            client_ = rclcpp_action::create_client<NavigateToPose>(
                node->get_node_base_interface(),
                node->get_node_graph_interface(),
                node->get_node_logging_interface(),
                node->get_node_waitables_interface(),
                "/navigate_to_pose");
        }

        // Wait for action server
        if (!client_->wait_for_action_server(std::chrono::seconds(5))) {
            RCLCPP_ERROR(node->get_logger(), 
                "Nav2 action server not available");
            return BT::NodeStatus::FAILURE;
        }

        // Build goal
        NavigateToPose::Goal goal;
        goal.pose.header.stamp = node->now();
        
        std::string frame = "map";
        getInput("frame_id", frame);
        goal.pose.header.frame_id = frame;

        double x = 0.0, y = 0.0, z = 0.0;
        if (!getInput("x", x) || !getInput("y", y)) {
            RCLCPP_ERROR(node->get_logger(), "Missing x or y coordinate");
            return BT::NodeStatus::FAILURE;
        }
        getInput("z", z);
        
        goal.pose.pose.position.x = x;
        goal.pose.pose.position.y = y;
        goal.pose.pose.position.z = z;

        // Handle orientation
        double qx = 0.0, qy = 0.0, qz = 0.0, qw = 1.0;
        double yaw_deg = 0.0;
        
        // Check if yaw is provided
        if (getInput("yaw_deg", yaw_deg) && std::abs(yaw_deg) > 1e-4) {
            double yaw_rad = yaw_deg * M_PI / 180.0;
            qz = std::sin(yaw_rad / 2.0);
            qw = std::cos(yaw_rad / 2.0);
        }
        
        // Check if quaternion is provided (overrides yaw)
        double temp;
        if (getInput("qx", temp)) qx = temp;
        if (getInput("qy", temp)) qy = temp;
        if (getInput("qz", temp)) qz = temp;
        if (getInput("qw", temp)) qw = temp;

        goal.pose.pose.orientation.x = qx;
        goal.pose.pose.orientation.y = qy;
        goal.pose.pose.orientation.z = qz;
        goal.pose.pose.orientation.w = qw;

        // Send goal
        auto send_options = rclcpp_action::Client<NavigateToPose>::SendGoalOptions{};
        send_options.result_callback = [](auto){};

        auto future = client_->async_send_goal(goal, send_options);
        
        if (future.wait_for(std::chrono::seconds(5)) != std::future_status::ready) {
            RCLCPP_ERROR(node->get_logger(), "Timeout waiting for goal acceptance");
            return BT::NodeStatus::FAILURE;
        }

        auto handle = future.get();
        if (!handle) {
            RCLCPP_ERROR(node->get_logger(), "Goal rejected by server");
            return BT::NodeStatus::FAILURE;
        }

        // Output goal ID
        const auto goal_id = uuid_to_hex(handle->get_goal_id());
        setOutput("goal_id", goal_id);
        
        RCLCPP_INFO(node->get_logger(), 
            "→ Goal sent: (%.2f, %.2f, yaw=%.1f°) ID=%s", 
            x, y, yaw_deg, goal_id.substr(0, 8).c_str());

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
 * @brief Monitors Nav2 goal status until completion or timeout
 */
class MonitorNav2Status : public BT::StatefulActionNode
{
public:
    MonitorNav2Status(const std::string& name, const BT::NodeConfiguration& config)
        : BT::StatefulActionNode(name, config) {}

    static BT::PortsList providedPorts()
    {
        return {
            BT::InputPort<std::string>("goal_id", "Goal UUID to monitor"),
            BT::InputPort<int64_t>("timeout_ms", 600000, "Timeout in ms"),
            BT::InputPort<std::string>("status_topic", 
                "/navigate_to_pose/_action/status", "Status topic")
        };
    }

    BT::NodeStatus onStart() override
    {
        auto* node = get_node_from_blackboard(config());
        if (!node) {
            return BT::NodeStatus::FAILURE;
        }

        target_id_.clear();
        if (!getInput("goal_id", target_id_) || target_id_.empty()) {
            RCLCPP_ERROR(node->get_logger(), "No goal_id provided");
            return BT::NodeStatus::FAILURE;
        }

        getInput("timeout_ms", timeout_ms_);
        
        std::string status_topic = "/navigate_to_pose/_action/status";
        getInput("status_topic", status_topic);

        // Create subscription
        if (!sub_) {
            sub_ = node->create_subscription<action_msgs::msg::GoalStatusArray>(
                status_topic, 
                rclcpp::SystemDefaultsQoS(),
                [this, node](const action_msgs::msg::GoalStatusArray& msg) {
                    process_status(msg, node);
                });
        }

        start_time_ = Clock::now();
        last_status_.store(-1);
        
        RCLCPP_INFO(node->get_logger(), 
            "⏳ Monitoring goal: %s", target_id_.substr(0, 8).c_str());
        
        return BT::NodeStatus::RUNNING;
    }

    BT::NodeStatus onRunning() override
    {
        // Check timeout
        const auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            Clock::now() - start_time_).count();
        
        if (elapsed >= timeout_ms_) {
            auto* node = get_node_from_blackboard(config());
            if (node) {
                RCLCPP_ERROR(node->get_logger(), 
                    "✗ Timeout after %ld ms", timeout_ms_);
            }
            return BT::NodeStatus::FAILURE;
        }

        // Check status
        const int status = last_status_.load();
        if (status < 0) {
            return BT::NodeStatus::RUNNING;
        }

        // Status codes: 4=SUCCEEDED, 5=CANCELED, 6=ABORTED
        auto* node = get_node_from_blackboard(config());
        
        if (status == 4) {
            if (node) {
                RCLCPP_INFO(node->get_logger(), 
                    "✓ Goal reached successfully");
            }
            return BT::NodeStatus::SUCCESS;
        }
        
        if (status == 5 || status == 6) {
            if (node) {
                RCLCPP_ERROR(node->get_logger(), 
                    "✗ Goal failed (status=%d)", status);
            }
            return BT::NodeStatus::FAILURE;
        }

        return BT::NodeStatus::RUNNING;
    }

    void onHalted() override
    {
        // Cleanup if needed
    }

private:
    void process_status(
        const action_msgs::msg::GoalStatusArray& msg, 
        rclcpp::Node* /*node*/)
    {
        for (const auto& status : msg.status_list) {
            if (uuid_to_hex(status.goal_info.goal_id.uuid) == target_id_) {
                last_status_.store(static_cast<int>(status.status));
                break;
            }
        }
    }

    std::string target_id_;
    int64_t timeout_ms_{600000};
    std::atomic<int> last_status_{-1};
    Clock::time_point start_time_;
    rclcpp::Subscription<action_msgs::msg::GoalStatusArray>::SharedPtr sub_;
};

// =============================================================================
// BT Node: Wait
// =============================================================================

/**
 * @class Wait
 * @brief Non-blocking wait node
 */
class Wait : public BT::StatefulActionNode
{
public:
    Wait(const std::string& name, const BT::NodeConfiguration& config)
        : BT::StatefulActionNode(name, config) {}

    static BT::PortsList providedPorts()
    {
        return {
            BT::InputPort<unsigned>("msec", 0u, "Wait time in milliseconds"),
            BT::InputPort<double>("wait_duration", 0.0, "Wait time in seconds")
        };
    }

    BT::NodeStatus onStart() override
    {
        unsigned msec = 0;
        getInput("msec", msec);
        
        double seconds = 0.0;
        getInput("wait_duration", seconds);

        wait_ms_ = (seconds > 0.0) ? 
            static_cast<uint64_t>(seconds * 1000.0) : 
            static_cast<uint64_t>(msec);
        
        start_ = Clock::now();
        
        return (wait_ms_ == 0) ? 
            BT::NodeStatus::SUCCESS : 
            BT::NodeStatus::RUNNING;
    }

    BT::NodeStatus onRunning() override
    {
        const auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            Clock::now() - start_).count();
        
        if (elapsed >= static_cast<int64_t>(wait_ms_)) {
            return BT::NodeStatus::SUCCESS;
        }
        
        return BT::NodeStatus::RUNNING;
    }

    void onHalted() override {}

private:
    uint64_t wait_ms_{0};
    Clock::time_point start_;
};

// =============================================================================
// Factory Registration
// =============================================================================

inline void registerNav2Nodes(BT::BehaviorTreeFactory& factory)
{
    factory.registerNodeType<SendNav2Goal>("SendNav2Goal");
    factory.registerNodeType<MonitorNav2Status>("MonitorNav2Status");
    factory.registerNodeType<Wait>("Wait");
}

} // namespace bt_runner_nav2