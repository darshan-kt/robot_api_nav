#!/usr/bin/env python3
"""
Measure the real gateway<->broker<->bridge round trip.

Feeds tests/unit/test_timeout_margins.py:

    HIVE_RTT_P99_MS=$(python3 scripts/measure_mqtt_rtt.py --quiet) \
        .venv-test/bin/python -m pytest tests/unit/test_timeout_margins.py -q

Run it FROM WHERE THE GATEWAY RUNS (the AWS box after the cutover, your
laptop today) and point it at the broker the gateway uses. It publishes
cmd/cancel_nav and times the matching cancel_nav/ack — a real command the
bridge answers immediately, with no robot motion: cancelling when nothing is
running is a documented no-op.
"""
import argparse
import json
import statistics
import sys
import time
import uuid

import paho.mqtt.client as mqtt


def measure(host: str, port: int, robot_id: str, samples: int,
            username=None, password=None) -> list[float]:
    prefix = f"hive/{robot_id}"
    acks: dict[str, float] = {}

    try:
        client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
                             client_id=f"rtt-probe-{uuid.uuid4().hex[:8]}")
    except (AttributeError, TypeError):
        client = mqtt.Client(client_id=f"rtt-probe-{uuid.uuid4().hex[:8]}")

    if username:
        client.username_pw_set(username, password)

    def on_message(c, u, msg):
        try:
            payload = json.loads(msg.payload)
        except ValueError:
            return
        rid = payload.get("request_id")
        if rid:
            acks[rid] = time.monotonic()

    client.on_message = on_message
    client.connect(host, port, keepalive=30)
    client.subscribe(f"{prefix}/cancel_nav/ack", qos=1)
    client.loop_start()
    time.sleep(0.5)

    rtts = []
    try:
        for _ in range(samples):
            rid = str(uuid.uuid4())
            started = time.monotonic()
            client.publish(f"{prefix}/cmd/cancel_nav", json.dumps({"request_id": rid}), qos=1)

            while rid not in acks and time.monotonic() - started < 10:
                time.sleep(0.002)

            if rid in acks:
                rtts.append((acks[rid] - started) * 1000)
            time.sleep(0.2)
    finally:
        client.loop_stop()
        client.disconnect()

    return rtts


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default="localhost")
    ap.add_argument("--port", type=int, default=1883)
    ap.add_argument("--robot-id", default="robot-1")
    ap.add_argument("--samples", type=int, default=30)
    ap.add_argument("--username")
    ap.add_argument("--password")
    ap.add_argument("--quiet", action="store_true",
                    help="print only the p99 in ms, for use in a shell substitution")
    args = ap.parse_args()

    rtts = measure(args.host, args.port, args.robot_id, args.samples,
                   args.username, args.password)

    if not rtts:
        print("no acks received — is the bridge running and ROBOT_ID correct?",
              file=sys.stderr)
        return 1

    rtts.sort()
    p99 = rtts[min(len(rtts) - 1, int(len(rtts) * 0.99))]

    if args.quiet:
        print(f"{p99:.0f}")
        return 0

    print(f"samples   {len(rtts)}")
    print(f"min       {min(rtts):.1f} ms")
    print(f"median    {statistics.median(rtts):.1f} ms")
    print(f"p99       {p99:.1f} ms")
    print(f"max       {max(rtts):.1f} ms")
    print()
    print(f"Feed this into the margin gate:")
    print(f"  HIVE_RTT_P99_MS={p99:.0f} .venv-test/bin/python -m pytest "
          f"tests/unit/test_timeout_margins.py -q -s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
