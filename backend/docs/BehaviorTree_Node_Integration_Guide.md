## 🧭 BehaviorTree Node Integration Guide

This document explains how to add new custom nodes to the BehaviorTree (BT) system and use them in XML behavior trees.

---

### 📁 1. Where to Add New Nodes

All BT nodes are defined in the C++ header:
`bt_runner_nav2/nodes.hpp` (or equivalent in your project).

Each node is a C++ class derived from one of the BehaviorTree.CPP base types:

* `BT::SyncActionNode` → for simple, instantaneous actions
* `BT::StatefulActionNode` → for actions that run over time
* `BT::ConditionNode` → for conditions (true/false checks)
* `BT::DecoratorNode` → for wrappers that modify child behavior

---

### 🧩 2. Steps to Add a New Node

1. **Create the class**
   Example (simple “Wait” node):

   ```cpp
   class Wait : public BT::StatefulActionNode {
   public:
     Wait(const std::string& name, const BT::NodeConfiguration& cfg)
       : BT::StatefulActionNode(name, cfg) {}

     static BT::PortsList providedPorts() {
       return { BT::InputPort<unsigned>("msec", 0, "milliseconds to wait") };
     }

     BT::NodeStatus onStart() override {
       unsigned ms = 0; getInput("msec", ms);
       start_ = std::chrono::steady_clock::now();
       wait_ms_ = ms;
       return ms == 0 ? BT::NodeStatus::SUCCESS : BT::NodeStatus::RUNNING;
     }

     BT::NodeStatus onRunning() override {
       auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
         std::chrono::steady_clock::now() - start_).count();
       return (elapsed >= wait_ms_) ? BT::NodeStatus::SUCCESS : BT::NodeStatus::RUNNING;
     }

   private:
     std::chrono::steady_clock::time_point start_;
     unsigned wait_ms_{0};
   };
   ```

2. **Register it**
   Inside the `registerNav2Nodes()` function, add:

   ```cpp
   f.registerNodeType<Wait>("Wait");
   ```

   This makes `<Wait>` a recognized XML tag.

3. **Rebuild**

   ```bash
   colcon build --symlink-install
   source install/setup.bash
   ```

---

### 🧱 3. Using Your Node in XML

After registration, you can use your node by its registered name inside the XML:

```xml
<Wait name="pause_after_goal" msec="2000"/>
```

This example waits for 2 seconds before moving on in the sequence.

---

### ⚙️ 4. Typical BT Node Lifecycle

* **onStart()** → called when node starts running
* **onRunning()** → called repeatedly until SUCCESS/FAILURE
* **onHalted()** → called if the node is stopped/interrupted

For instant actions, use `BT::SyncActionNode` and implement only `tick()`.

---

### 🧠 5. Tips & Best Practices

* ✅ Keep node names consistent with XML tags.
* ⚡ Avoid blocking the thread (use stateful nodes for timed waits).
* 🧩 Add clear port descriptions (`providedPorts()`) for clarity.
* 🪶 Use logging with `RCLCPP_INFO` to debug node execution.
* 🧱 Register every node you add; unregistered tags will throw
  `BT::RuntimeError: Node not recognized`.

---

### ✅ Example Summary

Add → Register → Use:

```cpp
f.registerNodeType<Wait>("Wait");
```

```xml
<Wait msec="2000"/>
```

