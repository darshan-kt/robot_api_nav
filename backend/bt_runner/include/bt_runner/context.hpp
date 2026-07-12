#pragma once
#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/laser_scan.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include <atomic>
#include <cmath>
#include <limits>
#include <memory>

namespace bt_runner {

struct Context {
  rclcpp::Node* node {nullptr};
  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr pub_cmd;
  std::atomic<double> front_clear_m { std::numeric_limits<double>::infinity() };
};

inline double compute_front_clear(const sensor_msgs::msg::LaserScan& scan,
                                   double front_deg = 180.0)
{
  const double half  = front_deg * M_PI / 360.0;
  const double inc   = scan.angle_increment;
  const double start = scan.angle_min;
  const int i_min = std::max(0, (int)std::floor((-half - start) / inc));
  const int i_max = std::min((int)scan.ranges.size()-1, (int)std::ceil((half - start) / inc));
  double min_r = std::numeric_limits<double>::infinity();
  for (int i = i_min; i <= i_max; ++i) {
    const float r = scan.ranges[i];
    if (std::isfinite(r) && r > 0.0f) min_r = std::min(min_r, (double)r);
  }
  return min_r;
}

} // namespace bt_runner
