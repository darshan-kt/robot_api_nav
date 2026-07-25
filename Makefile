# =============================================================================
# Makefile – RoboStore Appstore
# =============================================================================

# ── Host architecture auto-detect ─────────────────────────────────────────────
# Every build target resolves its target platform from a PLATFORM* var, which
# defaults to the machine's own arch: linux/amd64 on a dev box, linux/arm64
# natively on a Raspberry Pi 5 — no manual arch switch needed, `make build`
# just does the right thing on whichever machine it runs on. Override on the
# command line to cross-build under QEMU (requires buildx + qemu binfmt — see
# README), e.g.:
#   make build_image_api PLATFORM=linux/arm64
#
# Image tags and standalone container names are suffixed with the resolved
# arch (…:amd64 / …:arm64, name-amd64 / name-arm64) so an amd64 build and an
# arm64 build of the same image/container can coexist on one machine without
# clobbering each other — this matters when cross-building/testing arm64 on
# an amd64 dev host, and is a no-op in normal single-arch use since only one
# tag ever gets built/run there.
UNAME_M := $(shell uname -m)
ifeq ($(UNAME_M),x86_64)
  HOST_PLATFORM := linux/amd64
else ifeq ($(UNAME_M),aarch64)
  HOST_PLATFORM := linux/arm64
else ifeq ($(UNAME_M),arm64)
  HOST_PLATFORM := linux/arm64
else
  HOST_PLATFORM := linux/amd64
endif
ARCH := $(subst linux/,,$(HOST_PLATFORM))

# ── API image config ──────────────────────────────────────────────────────────
PLATFORM     ?= $(HOST_PLATFORM)
ARCH_API     := $(subst linux/,,$(PLATFORM))
IMAGE        ?= hive_api:$(ARCH_API)
CONTAINER    ?= hive_api-$(ARCH_API)
PORT         ?= 1717
WORKSPACE    ?= /home/ros2_ws
DOCKERFILE   ?= backend/docker/dev/Dockerfile-api

# ── ROS config ────────────────────────────────────────────────────────────────
ROS_DOMAIN_ID ?= 0




# ── Backend source tree (all ROS 2 packages live here) ────────────────────────
BACKEND_DIR     ?= $(PWD)/backend
HIVE_INTERFACES ?= $(BACKEND_DIR)/hive_interfaces
API_ENTRYPOINT  ?= $(BACKEND_DIR)/docker/dev/entrypoint_api.sh

# ── Robot map folder (mounted into gateway container as /robot_map) ───────────
MAP_DIR ?= $(PWD)/map

# ── Frontend image config ──────────────────────────────────────────────────────
PLATFORM_FRONTEND ?= $(HOST_PLATFORM)
ARCH_FRONTEND     := $(subst linux/,,$(PLATFORM_FRONTEND))
FRONTEND_IMAGE    ?= robot_appstore:$(ARCH_FRONTEND)

# ── RobotStore (hive_bt_server + bt_runner) ───────────────────────────────────
HIVE_STORE_DIR      ?= $(BACKEND_DIR)
PLATFORM_ROBOTSTORE ?= $(HOST_PLATFORM)
ARCH_ROBOTSTORE     := $(subst linux/,,$(PLATFORM_ROBOTSTORE))
IMAGE_ROBOTSTORE    ?= robotstore_image:$(ARCH_ROBOTSTORE)

# =============================================================================
.PHONY: help platform \
        build run stop-all logs-api logs-robotstore \
        build_image_api build_hive_api \
        build_image_robotstore build_robotstore \
        build_frontend \
        run-api run-bash run_frontend \
        logs stop rm clean

platform:
	@echo "Detected host: $(UNAME_M) → HOST_PLATFORM=$(HOST_PLATFORM)"
	@echo "  hive_api image        : $(IMAGE)          (PLATFORM=$(PLATFORM))"
	@echo "  robotstore image      : $(IMAGE_ROBOTSTORE) (PLATFORM_ROBOTSTORE=$(PLATFORM_ROBOTSTORE))"
	@echo "  frontend image        : $(FRONTEND_IMAGE) (PLATFORM_FRONTEND=$(PLATFORM_FRONTEND))"
	@echo "Override any PLATFORM* var on the command line to cross-build, e.g.:"
	@echo "  make build_image_api PLATFORM=linux/arm64"

help: platform
	@echo ""
	@echo "  ── Full system ──────────────────────────────────────────────────────"
	@echo "  make build                    Build ALL images + workspaces"
	@echo "  make run                      Start ALL services via docker compose"
	@echo "  make stop-all                 Stop and remove all compose containers"
	@echo ""
	@echo "  ── API (hive_api_gateway) ───────────────────────────────────────────"
	@echo "  make build_image_api          Build base ROS 2 Docker image (Dockerfile-api)"
	@echo "  make build_hive_api           colcon-build hive_api_gateway inside image"
	@echo "  make run-api                  Launch gateway standalone (no compose)"
	@echo "  make run-bash                 Open shell inside API container for debugging"
	@echo ""
	@echo "  ── RobotStore (hive_bt_server + bt_runner) ──────────────────────────"
	@echo "  make build_image_robotstore   Build robotstore Docker image"
	@echo "  make build_robotstore         colcon-build robotstore workspace inside image"
	@echo ""
	@echo "  ── Frontend ─────────────────────────────────────────────────────────"
	@echo "  make build_frontend           Build React frontend Docker image"
	@echo "  make run_frontend             Start frontend only via docker-compose"
	@echo ""
	@echo "  ── Utils ────────────────────────────────────────────────────────────"
	@echo "  make logs-api                 Tail API container logs"
	@echo "  make logs-robotstore          Tail robotstore container logs"
	@echo "  make stop                     Stop standalone containers"
	@echo "  make rm                       Remove stopped containers"
	@echo "  make clean                    Delete colcon build/install/log artifacts"
	@echo ""

# =============================================================================
# Full system: build everything then start via docker compose
# =============================================================================

build: build_hive_api build_robotstore build_frontend
	@echo ""
	@echo "[build] All images and workspaces are ready."
	@echo "        Run 'make run' to start the full system."

run:
	@echo "[run] Starting full system (appstore + hive_api + robotstore) on $(HOST_PLATFORM) — ARCH_TAG=$(ARCH) ..."
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod +x $(API_ENTRYPOINT)
	@mkdir -p $(HIVE_STORE_DIR)/build $(HIVE_STORE_DIR)/install $(HIVE_STORE_DIR)/log
	@chmod +x $(HIVE_STORE_DIR)/docker/dev/entrypoint_robotstore.sh
	ARCH_TAG=$(ARCH) docker compose up

stop-all:
	@echo "[stop-all] Stopping and removing all compose containers ..."
	docker compose down

# =============================================================================
# Build base Docker image (ROS 2 Humble + Python deps, no package source)
# =============================================================================
build_image_api:
	@echo "[build_image_api] Building $(IMAGE) from $(DOCKERFILE) ..."
	docker buildx build \
		--platform $(PLATFORM) \
		-t $(IMAGE) \
		--load \
		-f $(DOCKERFILE) .
	@echo "[build_image_api] Done → $(IMAGE)"

# =============================================================================
# colcon-build hive_api_gateway (+ hive_interfaces) inside the image
#
# Flow:
#   1. Pre-create host-side build/install/log directories
#   2. Mount package sources read-only into workspace/src/
#   3. Mount the entrypoint script into the workspace root
#   4. Run container with MODE=build → entrypoint calls colcon build
#   5. Artifacts persist on the host in build_api/ install_api/ log_api/
# =============================================================================
build_hive_api: build_image_api
	@echo "[build_hive_api] Cleaning stale build/install artifacts ..."
	@sudo rm -rf $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod -R 777 $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod +x $(API_ENTRYPOINT)
	@echo "[build_hive_api] Running colcon build inside container ..."
	docker run --rm -it \
		--name $(CONTAINER)-build \
		--net=host \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e BUILD_BASE=$(WORKSPACE)/build_api \
		-e INSTALL_BASE=$(WORKSPACE)/install_api \
		-e LOG_BASE=$(WORKSPACE)/log_api \
		-v $(BACKEND_DIR)/hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v $(HIVE_INTERFACES):$(WORKSPACE)/src/hive_interfaces \
		-v $(API_ENTRYPOINT):$(WORKSPACE)/entrypoint_api.sh \
		-v $(PWD)/build_api:$(WORKSPACE)/build_api \
		-v $(PWD)/install_api:$(WORKSPACE)/install_api \
		-v $(PWD)/log_api:$(WORKSPACE)/log_api \
		$(IMAGE) \
		bash $(WORKSPACE)/entrypoint_api.sh build
	@echo "[build_hive_api] Build complete. Install overlay at $(PWD)/install_api"

# =============================================================================
# Launch the gateway (run mode — skips colcon, sources overlay, starts node)
# =============================================================================
run-api:
	@echo "[run-api] Starting hive_api_gateway on port $(PORT) ..."
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@sudo chmod -R 777 $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod +x $(API_ENTRYPOINT)
	docker run --rm -it \
		--name $(CONTAINER)-api \
		--net=host \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e BUILD_BASE=$(WORKSPACE)/build_api \
		-e INSTALL_BASE=$(WORKSPACE)/install_api \
		-e LOG_BASE=$(WORKSPACE)/log_api \
		-e ROBOT_MAP_DIR=/robot_map \
		-v $(BACKEND_DIR)/hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v $(HIVE_INTERFACES):$(WORKSPACE)/src/hive_interfaces \
		-v $(API_ENTRYPOINT):$(WORKSPACE)/entrypoint_api.sh \
		-v $(PWD)/build_api:$(WORKSPACE)/build_api \
		-v $(PWD)/install_api:$(WORKSPACE)/install_api \
		-v $(PWD)/log_api:$(WORKSPACE)/log_api \
		-v $(MAP_DIR):/robot_map:ro \
		$(IMAGE) \
		bash $(WORKSPACE)/entrypoint_api.sh just

# =============================================================================
# Debug shell — drop into an interactive bash inside the API container
# =============================================================================
run-bash:
	docker run --rm -it \
		--name $(CONTAINER)-bash \
		--net=host \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e BUILD_BASE=$(WORKSPACE)/build_api \
		-e INSTALL_BASE=$(WORKSPACE)/install_api \
		-e LOG_BASE=$(WORKSPACE)/log_api \
		-v $(BACKEND_DIR)/hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v $(HIVE_INTERFACES):$(WORKSPACE)/src/hive_interfaces \
		-v $(API_ENTRYPOINT):$(WORKSPACE)/entrypoint_api.sh \
		-v $(PWD)/build_api:$(WORKSPACE)/build_api \
		-v $(PWD)/install_api:$(WORKSPACE)/install_api \
		-v $(PWD)/log_api:$(WORKSPACE)/log_api \
		--entrypoint bash \
		$(IMAGE)

# =============================================================================
# RobotStore image + workspace build
# =============================================================================
build_image_robotstore:
	@echo "[build_image_robotstore] Building $(IMAGE_ROBOTSTORE) ..."
	docker buildx build \
		--platform $(PLATFORM_ROBOTSTORE) \
		-t $(IMAGE_ROBOTSTORE) \
		--load \
		-f $(HIVE_STORE_DIR)/docker/dev/Dockerfile-arm \
		$(HIVE_STORE_DIR)
	@echo "[build_image_robotstore] Done → $(IMAGE_ROBOTSTORE)"

build_robotstore: build_image_robotstore
	@echo "[build_robotstore] Cleaning stale build/install artifacts ..."
	@sudo rm -rf $(HIVE_STORE_DIR)/build $(HIVE_STORE_DIR)/install $(HIVE_STORE_DIR)/log
	@mkdir -p $(HIVE_STORE_DIR)/build $(HIVE_STORE_DIR)/install $(HIVE_STORE_DIR)/log
	@chmod -R 777 $(HIVE_STORE_DIR)/build $(HIVE_STORE_DIR)/install $(HIVE_STORE_DIR)/log
	@chmod +x $(HIVE_STORE_DIR)/docker/dev/entrypoint_robotstore.sh
	@echo "[build_robotstore] Building robotstore ROS 2 workspace ..."
	docker run --rm -it \
		--name robotstore-build \
		--net=host \
		--privileged \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e CYCLONEDDS_URI=file:///home/charlie/ros2_ws/cyclonedds.xml \
		-e BUILD_BASE=/home/charlie/ros2_ws/build \
		-e INSTALL_BASE=/home/charlie/ros2_ws/install \
		-e LOG_BASE=/home/charlie/ros2_ws/log \
		-v $(HIVE_STORE_DIR)/bt_runner:/home/charlie/ros2_ws/src/bt_runner \
		-v $(HIVE_STORE_DIR)/hive_bt_server:/home/charlie/ros2_ws/src/hive_bt_server \
		-v $(HIVE_STORE_DIR)/hive_interfaces:/home/charlie/ros2_ws/src/hive_interfaces \
		-v $(HIVE_STORE_DIR)/cyclonedds.xml:/home/charlie/ros2_ws/cyclonedds.xml \
		-v $(HIVE_STORE_DIR)/docker:/home/charlie/ros2_ws/docker \
		-v $(HIVE_STORE_DIR)/build:/home/charlie/ros2_ws/build \
		-v $(HIVE_STORE_DIR)/install:/home/charlie/ros2_ws/install \
		-v $(HIVE_STORE_DIR)/log:/home/charlie/ros2_ws/log \
		-v $(HIVE_STORE_DIR)/docker/dev/entrypoint_robotstore.sh:/home/charlie/ros2_ws/entrypoint_robotstore.sh \
		$(IMAGE_ROBOTSTORE) \
		bash /home/charlie/ros2_ws/entrypoint_robotstore.sh build
	@echo "[build_robotstore] Done."

# =============================================================================
# Frontend
# =============================================================================
build_frontend:
	@echo "[build_frontend] Building $(FRONTEND_IMAGE) for $(PLATFORM_FRONTEND) ..."
	docker buildx build \
		--platform $(PLATFORM_FRONTEND) \
		-f docker/Dockerfile \
		-t $(FRONTEND_IMAGE) \
		--load \
		.

run_frontend:
	ARCH_TAG=$(ARCH) docker compose up appstore

# =============================================================================
# Utils
# =============================================================================
logs-api:
	docker logs -f hive_api-api

logs-robotstore:
	docker logs -f robotstore_cont-run

stop:
	-@docker stop hive_api-api          2>/dev/null || true
	-@docker stop $(CONTAINER)-build    2>/dev/null || true
	-@docker stop $(CONTAINER)-bash     2>/dev/null || true
	-@docker stop $(CONTAINER)-api      2>/dev/null || true
	-@docker stop robotstore_cont-run   2>/dev/null || true
	-@docker stop robotstore-build      2>/dev/null || true
	-@docker stop robot_appstore        2>/dev/null || true

rm: stop
	-@docker rm hive_api-api            2>/dev/null || true
	-@docker rm $(CONTAINER)-build      2>/dev/null || true
	-@docker rm $(CONTAINER)-bash       2>/dev/null || true
	-@docker rm $(CONTAINER)-api        2>/dev/null || true
	-@docker rm robot_appstore          2>/dev/null || true
	-@docker rm robotstore_cont-run     2>/dev/null || true
	-@docker rm robotstore-build        2>/dev/null || true

clean:
	@echo "[clean] Removing colcon artifacts ..."
	-sudo rm -rf $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	-sudo rm -rf $(BACKEND_DIR)/build $(BACKEND_DIR)/install $(BACKEND_DIR)/log
