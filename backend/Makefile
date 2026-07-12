# ------- Config (API & Build) -------
IMAGE                  ?= ros2-fastapi:humble
CONTAINER              ?= ros2-fastapi
PORT                   ?= 1717
WORKSPACE              ?= /home/ros2_ws
DOCKERFILE             ?= ./docker/dev/Dockerfile-api
PLATFORM_API           ?= linux/arm64

# ------- Config (RobotStore) -------
IMAGE_ROBOTSTORE       ?= robotstore_image
CONTAINER_ROBOTSTORE   ?= robotstore_cont
WORKSPACE_ROBOTSTORE   ?= /home/charlie/ros2_ws
DOCKERFILE_ROBOTSTORE  ?= ./docker/dev/Dockerfile-arm
PLATFORM_ROBOTSTORE    ?= linux/arm64

# ------- Config (ROS 2) -------
ROS_DOMAIN_ID  = 0

# ------- Phony targets -------
.PHONY: help build_image_api run-build-api run-api run-bash build_image_robotstore run-build-robotstore run-robotstore run-bash-robotstore run-all stop-all logs stop rm clean

help:
	@echo "Targets:"
	@echo "  build_image_api         - Build API image for arm64"
	@echo "  run-build-api           - Build API workspace inside a temporary container"
	@echo "  run-api                 - INDIVIDUAL: Run API via entrypoint_api.sh (no build)"
	@echo "  run-bash                - Open interactive bash in the API container"
	@echo "  build_image_robotstore  - Build RobotStore image for arm64"
	@echo "  run-build-robotstore    - Build the ROS 2 workspace inside a temporary RobotStore container"
	@echo "  run-robotstore          - INDIVIDUAL: Run RobotStore container with local mounts"
	@echo "  run-bash-robotstore     - Open interactive bash in the RobotStore container"
	@echo "  =========================================================================="
	@echo "  run-all                 - COMPOSE: Start BOTH containers simultaneously"
	@echo "  stop-all                - COMPOSE: Stop BOTH containers simultaneously"
	@echo "  =========================================================================="
	@echo "  logs                    - Tail API container logs"
	@echo "  stop                    - Stop all standalone build/bash/run containers"
	@echo "  rm                      - Remove all standalone build/bash/run containers"
	@echo "  clean                   - Remove build/install/log artifacts for API and RobotStore"

# ============================================================================
# Docker Compose Targets (Run Everything)
# ============================================================================

# Run both containers simultaneously using compose.yaml
run-all:
	@echo "Setting up directories and permissions..."
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@sudo chmod -R 777 $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@mkdir -p $(PWD)/build $(PWD)/install $(PWD)/log
	@sudo chmod -R 777 $(PWD)/build $(PWD)/install $(PWD)/log
	@chmod +x $(PWD)/docker/dev/entrypoint_api.sh
	@chmod +x $(PWD)/docker/dev/entrypoint_robotstore.sh
	@echo "Starting Docker Compose..."
	docker compose up

# Stop and safely tear down the compose network
stop-all:
	@echo "Stopping Docker Compose containers..."
	docker compose down

# ============================================================================
# API & Workspace Build Targets
# ============================================================================

# Build API image using buildx
build_image_api:
	@echo "Building API Image for $(PLATFORM_API)..."
	docker buildx build \
		--platform $(PLATFORM_API) \
		--build-arg UID=$(shell id -u) \
		--build-arg GID=$(shell id -g) \
		-t $(IMAGE) \
		--load \
		-f $(DOCKERFILE) .

# Build + run API container via entrypoint
run-build-api:
	@echo "Building API Workspace..."
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@sudo chmod -R 777 $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod +x $(PWD)/docker/dev/entrypoint_api.sh
	docker run --rm -it \
		--name $(CONTAINER)-build \
		--net=host \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e BUILD_BASE=$(WORKSPACE)/build_api \
		-e INSTALL_BASE=$(WORKSPACE)/install_api \
		-e LOG_BASE=$(WORKSPACE)/log_api \
		-v $(PWD)/hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v $(PWD)/hive_interfaces:$(WORKSPACE)/src/hive_interfaces \
		-v $(PWD)/docker/dev/entrypoint_api.sh:$(WORKSPACE)/entrypoint_api.sh \
		-v $(PWD)/build_api:$(WORKSPACE)/build_api \
		-v $(PWD)/install_api:$(WORKSPACE)/install_api \
		-v $(PWD)/log_api:$(WORKSPACE)/log_api \
		$(IMAGE) \
		bash $(WORKSPACE)/entrypoint_api.sh build

# Run API container individually (just mode, no build)
run-api:
	@echo "Running API Container individually (just mode, no build)..."
	@mkdir -p $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@sudo chmod -R 777 $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	@chmod +x $(PWD)/docker/dev/entrypoint_api.sh
	docker run --rm -it \
		--name $(CONTAINER)-api \
		--net=host \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e BUILD_BASE=$(WORKSPACE)/build_api \
		-e INSTALL_BASE=$(WORKSPACE)/install_api \
		-e LOG_BASE=$(WORKSPACE)/log_api \
		-v $(PWD)/hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v $(PWD)/hive_interfaces:$(WORKSPACE)/src/hive_interfaces \
		-v $(PWD)/docker/dev/entrypoint_api.sh:$(WORKSPACE)/entrypoint_api.sh \
		-v $(PWD)/build_api:$(WORKSPACE)/build_api \
		-v $(PWD)/install_api:$(WORKSPACE)/install_api \
		-v $(PWD)/log_api:$(WORKSPACE)/log_api \
		$(IMAGE) \
		bash $(WORKSPACE)/entrypoint_api.sh just

# Debug shell for API
run-bash:
	docker run --rm -it \
		--name $(CONTAINER)-bash \
		-p $(PORT):8080 \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-v ./hive_api_gateway:$(WORKSPACE)/src/hive_api_gateway \
		-v ./hive_interfaces:$(WORKSPACE)/src/hive_interfaces \
		-v ./docker/dev/entrypoint_api.sh:$(WORKSPACE)/entrypoint_api.sh \
		--entrypoint bash \
		$(IMAGE)

# ============================================================================
# RobotStore Targets
# ============================================================================

# Build RobotStore image using buildx
build_image_robotstore:
	@echo "Building RobotStore Image for $(PLATFORM_ROBOTSTORE)..."
	docker buildx build \
		--platform $(PLATFORM_ROBOTSTORE) \
		--build-arg UID=$(shell id -u) \
		--build-arg GID=$(shell id -g) \
		-t $(IMAGE_ROBOTSTORE) \
		--load \
		-f $(DOCKERFILE_ROBOTSTORE) .

# Build workspace inside RobotStore
run-build-robotstore:
	@echo "Building ROS 2 Workspace inside RobotStore Container..."
	@mkdir -p $(PWD)/build $(PWD)/install $(PWD)/log
	@sudo chmod -R 777 $(PWD)/build $(PWD)/install $(PWD)/log
	@chmod +x $(PWD)/docker/dev/entrypoint_robotstore.sh
	docker run --rm -it \
		--name $(CONTAINER_ROBOTSTORE)-build \
		--network host \
		--privileged \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e CYCLONEDDS_URI=file://$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/bt_runner:$(WORKSPACE_ROBOTSTORE)/src/bt_runner \
		-v $(PWD)/bt_turtle_demo:$(WORKSPACE_ROBOTSTORE)/src/bt_turtle_demo \
		-v $(PWD)/hive_bt_server:$(WORKSPACE_ROBOTSTORE)/src/hive_bt_server \
		-v $(PWD)/hive_interfaces:$(WORKSPACE_ROBOTSTORE)/src/hive_interfaces \
		-v $(PWD)/cyclonedds.xml:$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/docker:$(WORKSPACE_ROBOTSTORE)/docker \
		-v $(PWD)/build:$(WORKSPACE_ROBOTSTORE)/build \
		-v $(PWD)/install:$(WORKSPACE_ROBOTSTORE)/install \
		-v $(PWD)/log:$(WORKSPACE_ROBOTSTORE)/log \
		-v $(PWD)/docker/dev/entrypoint_robotstore.sh:$(WORKSPACE_ROBOTSTORE)/entrypoint_robotstore.sh \
		$(IMAGE_ROBOTSTORE) \
		bash $(WORKSPACE_ROBOTSTORE)/entrypoint_robotstore.sh build

# Run RobotStore environment individually with local mounts
run-robotstore:
	@echo "Running RobotStore Container individually (with local volume mounts)..."
	@mkdir -p $(PWD)/build $(PWD)/install $(PWD)/log
	@sudo chmod -R 777 $(PWD)/build $(PWD)/install $(PWD)/log
	@chmod +x $(PWD)/docker/dev/entrypoint_robotstore.sh
	docker run --rm -it \
		--name $(CONTAINER_ROBOTSTORE)-run \
		--network host \
		--privileged \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e CYCLONEDDS_URI=file://$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/bt_runner:$(WORKSPACE_ROBOTSTORE)/src/bt_runner \
		-v $(PWD)/bt_turtle_demo:$(WORKSPACE_ROBOTSTORE)/src/bt_turtle_demo \
		-v $(PWD)/hive_bt_server:$(WORKSPACE_ROBOTSTORE)/src/hive_bt_server \
		-v $(PWD)/hive_interfaces:$(WORKSPACE_ROBOTSTORE)/src/hive_interfaces \
		-v $(PWD)/cyclonedds.xml:$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/docker:$(WORKSPACE_ROBOTSTORE)/docker \
		-v $(PWD)/build:$(WORKSPACE_ROBOTSTORE)/build \
		-v $(PWD)/install:$(WORKSPACE_ROBOTSTORE)/install \
		-v $(PWD)/log:$(WORKSPACE_ROBOTSTORE)/log \
		-v $(PWD)/docker/dev/entrypoint_robotstore.sh:$(WORKSPACE_ROBOTSTORE)/entrypoint_robotstore.sh \
		$(IMAGE_ROBOTSTORE) \
		bash $(WORKSPACE_ROBOTSTORE)/entrypoint_robotstore.sh

# Debug shell for RobotStore
run-bash-robotstore:
	docker run --rm -it \
		--name $(CONTAINER_ROBOTSTORE)-bash \
		--network host \
		--privileged \
		-e ROS_DOMAIN_ID=$(ROS_DOMAIN_ID) \
		-e RMW_IMPLEMENTATION=rmw_cyclonedds_cpp \
		-e CYCLONEDDS_URI=file://$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/bt_runner:$(WORKSPACE_ROBOTSTORE)/src/bt_runner \
		-v $(PWD)/bt_turtle_demo:$(WORKSPACE_ROBOTSTORE)/src/bt_turtle_demo \
		-v $(PWD)/hive_bt_server:$(WORKSPACE_ROBOTSTORE)/src/hive_bt_server \
		-v $(PWD)/hive_interfaces:$(WORKSPACE_ROBOTSTORE)/src/hive_interfaces \
		-v $(PWD)/cyclonedds.xml:$(WORKSPACE_ROBOTSTORE)/cyclonedds.xml \
		-v $(PWD)/docker:$(WORKSPACE_ROBOTSTORE)/docker \
		-v $(PWD)/build:$(WORKSPACE_ROBOTSTORE)/build \
		-v $(PWD)/install:$(WORKSPACE_ROBOTSTORE)/install \
		-v $(PWD)/log:$(WORKSPACE_ROBOTSTORE)/log \
		-v $(PWD)/docker/dev/entrypoint_robotstore.sh:$(WORKSPACE_ROBOTSTORE)/entrypoint_robotstore.sh \
		$(IMAGE_ROBOTSTORE) bash

# ============================================================================
# Utils
# ============================================================================

logs:
	docker logs -f $(CONTAINER)-api

stop:
	-@docker stop $(CONTAINER)-api >/dev/null 2>&1 || true
	-@docker stop $(CONTAINER)-build >/dev/null 2>&1 || true
	-@docker stop $(CONTAINER)-bash >/dev/null 2>&1 || true
	-@docker stop $(CONTAINER_ROBOTSTORE)-run >/dev/null 2>&1 || true
	-@docker stop $(CONTAINER_ROBOTSTORE)-build >/dev/null 2>&1 || true
	-@docker stop $(CONTAINER_ROBOTSTORE)-bash >/dev/null 2>&1 || true

rm:
	-@docker rm $(CONTAINER)-api >/dev/null 2>&1 || true
	-@docker rm $(CONTAINER)-build >/dev/null 2>&1 || true
	-@docker rm $(CONTAINER)-bash >/dev/null 2>&1 || true
	-@docker rm $(CONTAINER_ROBOTSTORE)-run >/dev/null 2>&1 || true
	-@docker rm $(CONTAINER_ROBOTSTORE)-build >/dev/null 2>&1 || true
	-@docker rm $(CONTAINER_ROBOTSTORE)-bash >/dev/null 2>&1 || true

clean:
	@echo "Removing workspace build/install/log artifacts..."
	-@rm -rf $(PWD)/build $(PWD)/install $(PWD)/log
	-@rm -rf $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api
	-@sudo rm -rf $(PWD)/build $(PWD)/install $(PWD)/log
	-@sudo rm -rf $(PWD)/build_api $(PWD)/install_api $(PWD)/log_api