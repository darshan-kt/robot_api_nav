/**
 * @file bt_nav_executor.cpp
 * @brief Simple Behavior Tree Navigation Executor triggered via ROS2 Service
 * 
 * This node:
 * 1. Exposes a ROS2 service to trigger BT execution
 * 2. Loads BT XML files with hardcoded navigation coordinates
 * 3. Supports Groot2 visualization
 * 4. Executes waypoints sequentially using Nav2
 * 
 * @author Darshan Gowda / Hive Robotics
 * @date 2025
 */

#include <rclcpp/rclcpp.hpp>
#include <ament_index_cpp/get_package_share_directory.hpp>

#include <behaviortree_cpp/bt_factory.h>
#include <behaviortree_cpp/loggers/groot2_publisher.h>

#include <std_srvs/srv/trigger.hpp>
#include <std_msgs/msg/string.hpp>

#include "bt_nav_executor/nodes.hpp"

using namespace std::chrono_literals;

/**
 * @class BTNavExecutor
 * @brief Main node that executes behavior trees for navigation
 */
class BTNavExecutor : public rclcpp::Node
{
public:
    BTNavExecutor() : Node("bt_nav_executor")
    {
        // Parameters
        declare_parameter<std::string>("tree_file", "go_to_route_no_return.xml");
        declare_parameter<int>("groot_port", 1667);
        declare_parameter<int>("tick_rate_ms", 100);
        declare_parameter<bool>("enable_groot", true);
        
        tree_file_ = get_parameter("tree_file").as_string();
        groot_port_ = get_parameter("groot_port").as_int();
        tick_rate_ms_ = get_parameter("tick_rate_ms").as_int();
        enable_groot_ = get_parameter("enable_groot").as_bool();
        
        // Register BT nodes
        bt_runner_nav2::registerNav2Nodes(factory_);
        
        // Service to trigger BT execution
        service_ = create_service<std_srvs::srv::Trigger>(
            "execute_navigation",
            std::bind(&BTNavExecutor::handle_execute, this,
                     std::placeholders::_1, std::placeholders::_2));
        
        // Status publisher
        status_pub_ = create_publisher<std_msgs::msg::String>(
            "bt_status", 10);
        
        RCLCPP_INFO(get_logger(), 
            "========================================");
        RCLCPP_INFO(get_logger(), 
            "BT Navigation Executor Ready");
        RCLCPP_INFO(get_logger(), 
            "  Tree file: %s", tree_file_.c_str());
        RCLCPP_INFO(get_logger(), 
            "  Groot port: %d (enabled: %s)", 
            groot_port_, enable_groot_ ? "YES" : "NO");
        RCLCPP_INFO(get_logger(), 
            "  Tick rate: %d ms", tick_rate_ms_);
        RCLCPP_INFO(get_logger(), 
            "========================================");
        RCLCPP_INFO(get_logger(), 
            "Call service: ros2 service call /execute_navigation std_srvs/srv/Trigger");
    }

private:
    /**
     * @brief Service callback to execute the behavior tree
     */
    void handle_execute(
        const std::shared_ptr<std_srvs::srv::Trigger::Request>,
        std::shared_ptr<std_srvs::srv::Trigger::Response> response)
    {
        if (is_executing_.load()) {
            response->success = false;
            response->message = "Already executing a behavior tree";
            RCLCPP_WARN(get_logger(), "Rejected: Tree already executing");
            return;
        }
        
        RCLCPP_INFO(get_logger(), "Service triggered - Starting BT execution");
        
        // Start execution in separate thread
        is_executing_.store(true);
        std::thread{&BTNavExecutor::execute_tree, this}.detach();
        
        response->success = true;
        response->message = "Behavior tree execution started";
    }
    
    /**
     * @brief Main execution function - runs in separate thread
     */
    void execute_tree()
    {
        publish_status("LOADING");
        
        // Load tree file
        std::string tree_path;
        try {
            const auto share = ament_index_cpp::get_package_share_directory("bt_nav_executor");
            tree_path = share + "/trees/" + tree_file_;
            RCLCPP_INFO(get_logger(), "Loading tree from: %s", tree_path.c_str());
        } catch (const std::exception& e) {
            RCLCPP_ERROR(get_logger(), "Failed to find package: %s", e.what());
            publish_status("FAILED");
            is_executing_.store(false);
            return;
        }
        
        // Create blackboard and set ROS node pointer
        auto blackboard = BT::Blackboard::create();
        blackboard->set<rclcpp::Node*>("ros_node", this);
        
        // Create tree
        BT::Tree tree;
        try {
            tree = factory_.createTreeFromFile(tree_path, blackboard);
            RCLCPP_INFO(get_logger(), "✓ Tree loaded successfully");
        } catch (const std::exception& e) {
            RCLCPP_ERROR(get_logger(), "Failed to load tree: %s", e.what());
            publish_status("FAILED");
            is_executing_.store(false);
            return;
        }
        
        // Setup Groot2 publisher
        std::unique_ptr<BT::Groot2Publisher> groot_pub;
        if (enable_groot_) {
            try {
                groot_pub = std::make_unique<BT::Groot2Publisher>(
                    tree, static_cast<unsigned>(groot_port_));
                RCLCPP_INFO(get_logger(), 
                    "✓ Groot2 connected on port %d", groot_port_);
            } catch (const std::exception& e) {
                RCLCPP_WARN(get_logger(), 
                    "Groot2 connection failed: %s", e.what());
            }
        }
        
        publish_status("RUNNING");
        RCLCPP_INFO(get_logger(), 
            "========================================");
        RCLCPP_INFO(get_logger(), 
            "Executing Behavior Tree...");
        RCLCPP_INFO(get_logger(), 
            "========================================");
        
        // Execution loop
        rclcpp::WallRate rate{std::chrono::milliseconds(tick_rate_ms_)};
        BT::NodeStatus status = BT::NodeStatus::RUNNING;
        
        while (rclcpp::ok() && status == BT::NodeStatus::RUNNING) {
            status = tree.tickOnce();
            rate.sleep();
        }
        
        // Handle result
        if (status == BT::NodeStatus::SUCCESS) {
            RCLCPP_INFO(get_logger(), 
                "========================================");
            RCLCPP_INFO(get_logger(), 
                "✓ Navigation sequence COMPLETED");
            RCLCPP_INFO(get_logger(), 
                "========================================");
            publish_status("SUCCESS");
        } else {
            RCLCPP_ERROR(get_logger(), 
                "========================================");
            RCLCPP_ERROR(get_logger(), 
                "✗ Navigation sequence FAILED");
            RCLCPP_ERROR(get_logger(), 
                "========================================");
            publish_status("FAILED");
        }
        
        is_executing_.store(false);
    }
    
    /**
     * @brief Publish current execution status
     */
    void publish_status(const std::string& status)
    {
        std_msgs::msg::String msg;
        msg.data = status;
        status_pub_->publish(msg);
    }
    
    // Members
    BT::BehaviorTreeFactory factory_;
    rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr service_;
    rclcpp::Publisher<std_msgs::msg::String>::SharedPtr status_pub_;
    
    std::string tree_file_;
    int groot_port_;
    int tick_rate_ms_;
    bool enable_groot_;
    
    std::atomic<bool> is_executing_{false};
};

int main(int argc, char** argv)
{
    rclcpp::init(argc, argv);
    auto node = std::make_shared<BTNavExecutor>();
    rclcpp::spin(node);
    rclcpp::shutdown();
    return 0;
}
