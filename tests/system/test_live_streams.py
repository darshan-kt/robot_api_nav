"""
The live WebSocket streams, exercised the way the browser uses them.

These are what the dashboard, route planner and remote controller are built
on — if a stream is silent the UI shows stale data with no error anywhere.
"""
import asyncio
import json

import pytest
import websockets

pytestmark = pytest.mark.system

RECV_TIMEOUT = 12.0


async def _first_message(url: str, send: str | None = None, timeout: float = RECV_TIMEOUT):
    async with websockets.connect(url, open_timeout=10) as ws:
        if send:
            await ws.send(send)
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        return json.loads(raw)


def test_telemetry_stream_delivers_live_odometry(ws_url):
    msg = asyncio.run(_first_message(f"{ws_url}/api/telemetry"))
    assert msg["type"] == "telemetry"
    assert {"x", "y", "theta"} <= set(msg)


def test_localisation_stream_delivers_a_typed_pose(ws_url):
    msg = asyncio.run(_first_message(f"{ws_url}/api/localisation"))
    assert msg["type"] == "localisation"
    assert msg["frame_id"] == "map"


def test_plan_stream_always_answers_even_with_no_active_route(ws_url):
    msg = asyncio.run(_first_message(f"{ws_url}/api/plan"))
    assert msg["type"] == "plan"
    assert isinstance(msg["points"], list)


def test_scan_stream_stays_silent_until_the_client_opts_in(ws_url):
    """The bandwidth guard, verified end to end rather than in a fake."""
    async def _run():
        async with websockets.connect(f"{ws_url}/api/scan", open_timeout=10) as ws:
            await ws.send(json.dumps({"type": "scan_toggle", "enabled": False}))
            with pytest.raises(asyncio.TimeoutError):
                await asyncio.wait_for(ws.recv(), timeout=4.0)

    asyncio.run(_run())


def test_scan_stream_delivers_lidar_after_opting_in(ws_url):
    msg = asyncio.run(_first_message(
        f"{ws_url}/api/scan", send=json.dumps({"type": "scan_toggle", "enabled": True})))
    assert msg["type"] == "scan"
    assert len(msg["ranges"]) > 0


def test_streams_survive_a_reconnect(ws_url):
    """Browsers reconnect constantly (tab sleep, wifi). Two sequential
    connections must both get data."""
    for _ in range(2):
        msg = asyncio.run(_first_message(f"{ws_url}/api/telemetry"))
        assert msg["type"] == "telemetry"


def test_several_dashboards_can_watch_at_once(ws_url):
    """Multiple operators is the normal case, not an edge case."""
    async def _run():
        conns = [await websockets.connect(f"{ws_url}/api/telemetry", open_timeout=10)
                 for _ in range(3)]
        try:
            msgs = await asyncio.gather(*[
                asyncio.wait_for(c.recv(), timeout=RECV_TIMEOUT) for c in conns])
            assert all(json.loads(m)["type"] == "telemetry" for m in msgs)
        finally:
            for c in conns:
                await c.close()

    asyncio.run(_run())


def test_teleop_channel_accepts_a_zero_frame(ws_url):
    """
    Connect, send an explicit stop, disconnect. Safe by construction — a
    zero twist cannot start motion — and it proves the whole teleop path is
    open before an operator relies on it.
    """
    async def _run():
        async with websockets.connect(f"{ws_url}/api/velocity_ctrl", open_timeout=10) as ws:
            await ws.send(json.dumps({"type": "cmd_vel", "linear": 0.0, "angular": 0.0}))
            await asyncio.sleep(0.2)

    asyncio.run(_run())


def test_teleop_channel_ignores_junk_without_dropping_the_operator(ws_url):
    async def _run():
        async with websockets.connect(f"{ws_url}/api/velocity_ctrl", open_timeout=10) as ws:
            await ws.send("not json")
            await ws.send(json.dumps({"type": "cmd_vel", "linear": 0.0, "angular": 0.0}))
            await asyncio.sleep(0.2)
            assert ws.state.name == "OPEN"

    asyncio.run(_run())
