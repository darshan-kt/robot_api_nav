#!/usr/bin/env bash
set -e

echo "==============================================="
echo " Nav2 MCP Server Setup Script (Student Version)"
echo "==============================================="

# Step 1: Navigate to the MCP server directory
MCP_DIR="$HOME/turtlebot_ws/src/turtlebot_mcp_ros2/nav2_mcp_server"

echo ""
echo "[1/4] Moving to MCP server folder..."
echo "📁 $MCP_DIR"
cd "$MCP_DIR"

# Step 2: Create virtual environment only if it doesn't exist
if [ ! -d ".venv" ]; then
  echo ""
  echo "[2/4] Creating Python virtual environment (.venv)..."
  python3 -m venv .venv
else
  echo ""
  echo "[2/4] Virtual environment already exists ✅"
fi

# Step 3: Activate the virtual environment
echo ""
echo "[3/4] Activating virtual environment..."
source .venv/bin/activate

# Step 4: Install dependencies + editable install
echo ""
echo "[4/4] Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -e .

echo ""
echo "✅ Setup complete!"
echo "-----------------------------------------------"
echo "To run the server manually, use:"
echo "   cd $MCP_DIR"
echo "   source .venv/bin/activate"
echo "   python -m nav2_mcp_server"
echo "-----------------------------------------------"
