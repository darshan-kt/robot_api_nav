# hive_api_gateway — plain Python/FastAPI image. NO ROS 2 base image, NO
# colcon, NO apt-get ros-humble-*. This is the concrete payoff of the MQTT
# split: this image builds in seconds and is ~100x smaller than the old
# ros:humble-ros-base-derived gateway image.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 1717

CMD ["python", "-m", "app.main"]
