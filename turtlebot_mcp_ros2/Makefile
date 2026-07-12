# =============================================================================
# Makefile – turtlebot_mcp_ros2 (TurtleBot3 Gazebo simulation + Nav2 in Docker)
# =============================================================================

IMAGE_SIM  ?= turtlebot3_sim:latest
CONTAINER  ?= turtlebot3-sim

.PHONY: help build_sim run_sim run_sim_headless run_bash logs stop rm

help:
	@echo ""
	@echo "  make build_sim          Build TurtleBot3 sim Docker image (Gazebo + Nav2)"
	@echo "  make run_sim            Start sim with GUI (Gazebo + RViz on your desktop)"
	@echo "  make run_sim_headless   Start sim headless (gzserver only, no RViz)"
	@echo "  make run_bash           Debug shell inside the sim image"
	@echo "  make logs               Tail sim container logs"
	@echo "  make stop               Stop the sim container"
	@echo "  make rm                 Remove the sim container"
	@echo ""

build_sim:
	@echo "[build_sim] Building $(IMAGE_SIM) ..."
	docker compose build turtlebot_sim
	@echo "[build_sim] Done → $(IMAGE_SIM)"

# GUI mode — allow the container to talk to the host X server first
run_sim:
	@xhost +local:docker >/dev/null
	docker compose up turtlebot_sim

run_sim_headless:
	docker compose run --rm --name $(CONTAINER) turtlebot_sim headless

run_bash:
	@xhost +local:docker >/dev/null
	docker compose run --rm --name $(CONTAINER)-bash turtlebot_sim bash

logs:
	docker logs -f $(CONTAINER)

stop:
	-@docker stop $(CONTAINER)        2>/dev/null || true
	-@docker stop $(CONTAINER)-bash   2>/dev/null || true

rm: stop
	-@docker rm $(CONTAINER)          2>/dev/null || true
	-@docker rm $(CONTAINER)-bash     2>/dev/null || true
