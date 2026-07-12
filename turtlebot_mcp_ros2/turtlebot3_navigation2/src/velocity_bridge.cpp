#include "rclcpp/rclcpp.hpp"
#include "geometry_msgs/msg/twist.hpp"
#include "std_msgs/msg/string.hpp"

class VelocityBridge : public rclcpp::Node
{
public:
    VelocityBridge() : Node("velocity_bridge")
    {
        // --- Parameters ---
        medium_scale_ = 0.5;
        current_safety_level_ = "LOW_LEVEL";

        // --- Quality of Service ---
        auto qos = rclcpp::QoS(rclcpp::KeepLast(10));

        // --- Subscribers ---
        // 1. Input Velocity from Nav2
        cmd_vel_sub_ = this->create_subscription<geometry_msgs::msg::Twist>(
            "/cmd_vel_nav", qos,
            std::bind(&VelocityBridge::cmd_vel_callback, this, std::placeholders::_1));

        // 2. Safety Level Input
        safety_sub_ = this->create_subscription<std_msgs::msg::String>(
            "/safety_level", qos,
            std::bind(&VelocityBridge::safety_callback, this, std::placeholders::_1));

        // --- Publisher ---
        cmd_vel_pub_ = this->create_publisher<geometry_msgs::msg::Twist>("/cmd_vel", qos);

        RCLCPP_INFO(this->get_logger(), "Velocity Bridge Initialized. Default: LOW_LEVEL");
    }

private:
    // Member variables
    double medium_scale_;
    std::string current_safety_level_;

    // ROS Handles
    rclcpp::Subscription<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_sub_;
    rclcpp::Subscription<std_msgs::msg::String>::SharedPtr safety_sub_;
    rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_pub_;

    // Callbacks
    void safety_callback(const std_msgs::msg::String::SharedPtr msg)
    {
        if (current_safety_level_ != msg->data) {
            RCLCPP_INFO(this->get_logger(), "Safety Level Changed: %s -> %s", 
                        current_safety_level_.c_str(), msg->data.c_str());
            current_safety_level_ = msg->data;
        }
    }

    void cmd_vel_callback(const geometry_msgs::msg::Twist::SharedPtr msg)
    {
        geometry_msgs::msg::Twist safe_cmd;

        if (current_safety_level_ == "LOW_LEVEL") {
            // Pass through directly
            safe_cmd = *msg;
        }
        else if (current_safety_level_ == "MEDIUM_LEVEL") {
            // Scale down by 50%
            safe_cmd.linear.x = msg->linear.x * medium_scale_;
            safe_cmd.linear.y = msg->linear.y * medium_scale_; // For holonomic robots
            safe_cmd.angular.z = msg->angular.z * medium_scale_;
        }
        else if (current_safety_level_ == "HIGH_LEVEL") {
            // Hard Stop
            safe_cmd.linear.x = 0.0;
            safe_cmd.linear.y = 0.0;
            safe_cmd.angular.z = 0.0;
        }
        else {
            // Failsafe for unknown strings
            RCLCPP_ERROR(this->get_logger(), "Unknown Safety Level: %s", current_safety_level_.c_str());
            safe_cmd.linear.x = 0.0;
            safe_cmd.angular.z = 0.0;
        }

        // Publish
        cmd_vel_pub_->publish(safe_cmd);
    }
};

int main(int argc, char * argv[])
{
    rclcpp::init(argc, argv);
    rclcpp::spin(std::make_shared<VelocityBridge>());
    rclcpp::shutdown();
    return 0;
}