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
#   make build_image_robotstore PLATFORM_ROBOTSTORE=linux/arm64
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

# ── Backend source tree (all ROS 2 packages live here — hive_api_gateway is
#    the one exception: it's plain Python now, see backend/hive_api_gateway) ──
BACKEND_DIR ?= $(PWD)/backend

# ── Robot map folder (mounted into gateway container as /robot_map) ───────────
MAP_DIR ?= $(PWD)/map

# ── Frontend image config ──────────────────────────────────────────────────────
PLATFORM_FRONTEND ?= $(HOST_PLATFORM)
ARCH_FRONTEND     := $(subst linux/,,$(PLATFORM_FRONTEND))
FRONTEND_IMAGE    ?= robot_appstore:$(ARCH_FRONTEND)

# ── RobotStore (hive_bt_server + bt_runner + hive_mqtt_bridge) ───────────────
HIVE_STORE_DIR      ?= $(BACKEND_DIR)
PLATFORM_ROBOTSTORE ?= $(HOST_PLATFORM)
ARCH_ROBOTSTORE     := $(subst linux/,,$(PLATFORM_ROBOTSTORE))
IMAGE_ROBOTSTORE    ?= robotstore_image:$(ARCH_ROBOTSTORE)

# =============================================================================
.PHONY: help platform \
        build run stop-all logs-api logs-robotstore logs-broker \
        build_hive_api run-api run-bash \
        build_image_robotstore build_robotstore \
        build_frontend \
        run_frontend \
        logs stop rm clean check-thermal

platform:
	@echo "Detected host: $(UNAME_M) → HOST_PLATFORM=$(HOST_PLATFORM)"
	@echo "  robotstore image      : $(IMAGE_ROBOTSTORE) (PLATFORM_ROBOTSTORE=$(PLATFORM_ROBOTSTORE))"
	@echo "  frontend image        : $(FRONTEND_IMAGE) (PLATFORM_FRONTEND=$(PLATFORM_FRONTEND))"
	@echo "  hive_api image        : built by docker compose from backend/hive_api_gateway/Dockerfile"
	@echo "                           (plain Python — no ROS base image, no PLATFORM override needed"
	@echo "                           today; add one if this ever needs cross-arch buildx builds)"
	@echo "Override any PLATFORM* var on the command line to cross-build, e.g.:"
	@echo "  make build_image_robotstore PLATFORM_ROBOTSTORE=linux/arm64"

help: platform
	@echo ""
	@echo "  ── Full system ──────────────────────────────────────────────────────"
	@echo "  make build                    Build ALL images + workspaces"
	@echo "  make run                      Start ALL services via docker compose"
	@echo "  make stop-all                 Stop and remove all compose containers"
	@echo ""
	@echo "  ── API (hive_api_gateway) — plain Python, no ROS 2, no colcon ───────"
	@echo "  make build_hive_api           docker compose build hive_api"
	@echo "  make run-api                  Launch gateway (+ its mqtt-broker dep) via compose"
	@echo "  make run-bash                 Open shell inside a throwaway gateway container"
	@echo ""
	@echo "  ── RobotStore (hive_bt_server + bt_runner + hive_mqtt_bridge) ──────"
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
	@echo "  make logs-broker              Tail MQTT broker container logs"
	@echo "  make stop                     Stop standalone containers"
	@echo "  make rm                       Remove stopped containers"
	@echo "  make clean                    Delete colcon build/install/log artifacts (robotstore only)"
	@echo "  make check-thermal            Pi5 thermal/under-voltage check (run ON the Pi5)"
	@echo ""

# =============================================================================
# Full system: build everything then start via docker compose
# =============================================================================

build: build_hive_api build_robotstore build_frontend
	@echo ""
	@echo "[build] All images and workspaces are ready."
	@echo "        Run 'make run' to start the full system."

run:
	@echo "[run] Starting full system (appstore + mqtt-broker + hive_api + robotstore) on $(HOST_PLATFORM) — ARCH_TAG=$(ARCH) ..."
	@mkdir -p $(HIVE_STORE_DIR)/build $(HIVE_STORE_DIR)/install $(HIVE_STORE_DIR)/log
	@chmod +x $(HIVE_STORE_DIR)/docker/dev/entrypoint_robotstore.sh
	ARCH_TAG=$(ARCH) docker compose up --build

stop-all:
	@echo "[stop-all] Stopping and removing all compose containers ..."
	docker compose down

# =============================================================================
# hive_api_gateway — plain Python/FastAPI, built straight from its own
# Dockerfile (backend/hive_api_gateway/Dockerfile). No ROS base image, no
# colcon build step, no separate "image" vs "workspace" build stage the way
# the ROS packages need — docker-compose's `build:` block is the whole story.
# =============================================================================
build_hive_api:
	@echo "[build_hive_api] Building hive_api via docker compose ..."
	ARCH_TAG=$(ARCH) docker compose build hive_api
	@echo "[build_hive_api] Done."

run-api:
	@echo "[run-api] Starting hive_api (+ mqtt-broker) via docker compose ..."
	ARCH_TAG=$(ARCH) docker compose up hive_api

run-bash:
	ARCH_TAG=$(ARCH) docker compose run --rm --entrypoint bash hive_api

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
	@echo "[build_robotstore] Building robotstore ROS 2 workspace (hive_bt_server, bt_runner, hive_mqtt_bridge) ..."
	docker run --rm -it \
		--name robotstore-build \
		--net=host \
		--privileged \
		-e ROS_DOMAIN_ID=0 \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e CYCLONEDDS_URI=file:///home/charlie/ros2_ws/cyclonedds.xml \
		-e BUILD_BASE=/home/charlie/ros2_ws/build \
		-e INSTALL_BASE=/home/charlie/ros2_ws/install \
		-e LOG_BASE=/home/charlie/ros2_ws/log \
		-v $(HIVE_STORE_DIR)/bt_runner:/home/charlie/ros2_ws/src/bt_runner \
		-v $(HIVE_STORE_DIR)/hive_bt_server:/home/charlie/ros2_ws/src/hive_bt_server \
		-v $(HIVE_STORE_DIR)/hive_interfaces:/home/charlie/ros2_ws/src/hive_interfaces \
		-v $(HIVE_STORE_DIR)/hive_mqtt_bridge:/home/charlie/ros2_ws/src/hive_mqtt_bridge \
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
	docker logs -f hive_api-api-arm

logs-robotstore:
	docker logs -f robotstore_cont-run-arm

logs-broker:
	docker logs -f hive_mqtt_broker-arm

stop:
	-@docker stop hive_api-api-arm        2>/dev/null || true
	-@docker stop hive_mqtt_broker-arm    2>/dev/null || true
	-@docker stop robotstore_cont-run-arm 2>/dev/null || true
	-@docker stop robotstore-build        2>/dev/null || true
	-@docker stop robot_appstore-arm      2>/dev/null || true

rm: stop
	-@docker rm hive_api-api-arm          2>/dev/null || true
	-@docker rm hive_mqtt_broker-arm      2>/dev/null || true
	-@docker rm robot_appstore-arm        2>/dev/null || true
	-@docker rm robotstore_cont-run-arm   2>/dev/null || true
	-@docker rm robotstore-build          2>/dev/null || true

clean:
	@echo "[clean] Removing colcon artifacts (robotstore workspace only — hive_api has none anymore) ..."
	-sudo rm -rf $(BACKEND_DIR)/build $(BACKEND_DIR)/install $(BACKEND_DIR)/log

# =============================================================================
# Pi5 thermal/power check — only meaningful when run ON the Pi5 itself
# (vcgencmd talks to the SoC firmware; it isn't reachable from a dev box).
# =============================================================================
check-thermal:
	@./scripts/check_pi5_health.sh
