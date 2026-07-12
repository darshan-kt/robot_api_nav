# Nav2 MCP Server: Installation & Running Guide

This guide details how to install the server and resolve common compatibility issues with ROS 2 Humble (Python 3.10) and NumPy.

### 1. Installation

**Clone the repository:**

```bash
git clone https://github.com/ajtudela/nav2_mcp_server.git
cd nav2_mcp_server

```

**⚠️ Critical Fix: Configure `pyproject.toml**`
Before installing dependencies, you must edit `pyproject.toml` to prevent crashes caused by NumPy 2.x and Python version mismatches.

1. Open `pyproject.toml`.
2. Update the **`requires-python`** line:
```toml
requires-python = ">=3.10"

```


3. Update the **`dependencies`** list (downgrade NumPy):
```toml
dependencies = [
    "anyio",
    "empy>=4.2",
    "fastmcp>=2.12.3",
    "lark>=1.3.0",
    "numpy<2.0",   # FIX: Prevents "module compiled with NumPy 1.x" crash
]

```



### 2. Environment Setup

You must force `uv` to use the system's Python 3.10 so it can access the ROS 2 `rclpy` library.

```bash
# 1. Clean previous environments (if any)
rm -rf .venv uv.lock

# 2. Create venv using System Python 3.10 (required for ROS 2 Humble)
# The --seed flag ensures pip/setuptools are present
uv venv --python /usr/bin/python3.10 --seed

# 3. Activate the environment
source .venv/bin/activate

# 4. Install dependencies
uv pip install -e .

```

### 3. Running the Server

Always ensure ROS 2 is sourced before running the server.

```bash
# 1. Source ROS 2
source /opt/ros/humble/setup.bash

# 2. Set Domain ID (Optional, default is 0)
export ROS_DOMAIN_ID=0

# 3. Run the server
uv run nav2_mcp_server

Terminal successful output:
""
2025-12-27 22:23:02,701 - nav2_mcp_server - INFO - Starting Nav2 MCP Server...
2025-12-27 22:23:02,702 - nav2_mcp_server - INFO - ROS2 initialized
2025-12-27 22:23:02,702 - nav2_mcp_server - INFO - Navigation and transform managers initialized
2025-12-27 22:23:02,718 - nav2_mcp_server - INFO - Starting MCP server on stdio transport



""

```

---

### 🔍 Troubleshooting Known Errors

**Error 1: `A module that was compiled using NumPy 1.x cannot be run in NumPy 2.x**`

* **Cause:** `uv` installed the latest NumPy (2.x), but ROS 2 libraries expect NumPy 1.x.
* **Solution:** Ensure `numpy<2.0` is set in `pyproject.toml` as shown above.

**Error 2: `ModuleNotFoundError: No module named 'rclpy._rclpy_pybind11'**`

* **Cause:** The virtual environment is using Python 3.12, but ROS 2 Humble only works with Python 3.10.
* **Solution:** Delete the `.venv` folder and recreate it using `uv venv --python /usr/bin/python3.10`.