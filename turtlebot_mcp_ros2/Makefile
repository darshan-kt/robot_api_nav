# =============================================================================
# Makefile – turtlebot_mcp_ros2 (TurtleBot3 Gazebo simulation + Nav2 in Docker)
# =============================================================================

IMAGE_SIM      ?= turtlebot3_sim:latest
CONTAINER      ?= turtlebot3-sim

IMAGE_RPLIDAR     ?= rplidar_ros2:latest
CONTAINER_RPLIDAR ?= rplidar-ros2
PLATFORM_RPLIDAR  ?= linux/amd64

.PHONY: help build_sim run_sim run_sim_headless run_bash logs stop rm \
        build_rplidar run_rplidar run_rplidar_bash logs_rplidar stop_rplidar rm_rplidar

help:
	@echo ""
	@echo "  ── TurtleBot3 Gazebo simulation (amd64 only, see docker/Dockerfile-sim) ──"
	@echo "  make build_sim          Build TurtleBot3 sim Docker image (Gazebo + Nav2)"
	@echo "  make run_sim            Start sim with GUI (Gazebo + RViz on your desktop)"
	@echo "  make run_sim_headless   Start sim headless (gzserver only, no RViz)"
	@echo "  make run_bash           Debug shell inside the sim image"
	@echo "  make logs               Tail sim container logs"
	@echo "  make stop               Stop the sim container"
	@echo "  make rm                 Remove the sim container"
	@echo ""
	@echo "  ── RPLIDAR ROS 2 driver (multi-arch: amd64 + arm64) ─────────────────"
	@echo "  make build_rplidar      Build RPLIDAR driver image (colcon build)"
	@echo "  make run_rplidar        Launch the driver (needs /dev/ttyUSB0)"
	@echo "  make run_rplidar_bash   Debug shell inside the rplidar image"
	@echo "  make logs_rplidar       Tail rplidar container logs"
	@echo "  make stop_rplidar       Stop the rplidar container"
	@echo "  make rm_rplidar         Remove the rplidar container"
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

# =============================================================================
# RPLIDAR ROS 2 driver — colcon-built from vendored src (rplidar_ros2/).
# Multi-arch: builds and runs the same on a dev box (amd64) or the Pi5 with
# the sensor attached (arm64). Override PLATFORM_RPLIDAR to cross-build,
# e.g.: make build_rplidar PLATFORM_RPLIDAR=linux/arm64
# =============================================================================
build_rplidar:
	@echo "[build_rplidar] Building $(IMAGE_RPLIDAR) for $(PLATFORM_RPLIDAR) ..."
	docker buildx build \
		--platform $(PLATFORM_RPLIDAR) \
		-f docker/Dockerfile-rplidar \
		-t $(IMAGE_RPLIDAR) \
		--load \
		.
	@echo "[build_rplidar] Done → $(IMAGE_RPLIDAR)"

run_rplidar:
	docker compose up rplidar

run_rplidar_bash:
	docker compose run --rm --name $(CONTAINER_RPLIDAR)-bash rplidar bash

logs_rplidar:
	docker logs -f $(CONTAINER_RPLIDAR)

stop_rplidar:
	-@docker stop $(CONTAINER_RPLIDAR)        2>/dev/null || true
	-@docker stop $(CONTAINER_RPLIDAR)-bash   2>/dev/null || true

rm_rplidar: stop_rplidar
	-@docker rm $(CONTAINER_RPLIDAR)          2>/dev/null || true
	-@docker rm $(CONTAINER_RPLIDAR)-bash     2>/dev/null || true
