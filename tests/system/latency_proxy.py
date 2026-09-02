"""
A TCP proxy that adds a fixed one-way delay in both directions.

Used to model the AWS split on one machine: the gateway reaches the broker
THROUGH this proxy (the long haul, gateway on AWS), while the bridge talks
to the broker directly (robot-local, no added latency). That's the real
topology — only the gateway<->broker hop crosses the internet.
"""
import asyncio
import threading


class LatencyProxy:
    """
    listen on 127.0.0.1:<port> -> forward to (target_host, target_port),
    delaying every chunk by `one_way_s` in each direction. A request and its
    reply therefore cost 2 * one_way_s extra, which is the round trip.
    """

    def __init__(self, target_host: str, target_port: int, one_way_s: float):
        self.target_host = target_host
        self.target_port = target_port
        self.one_way_s = one_way_s

        self.port: int | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._server: asyncio.Server | None = None
        self._stop: asyncio.Event | None = None
        self._ready = threading.Event()

    # -- plumbing ----------------------------------------------------------

    async def _pump(self, reader: asyncio.StreamReader, writer: asyncio.StreamWriter):
        try:
            while True:
                chunk = await reader.read(65536)
                if not chunk:
                    break
                if self.one_way_s > 0:
                    await asyncio.sleep(self.one_way_s)
                writer.write(chunk)
                await writer.drain()
        except (ConnectionResetError, BrokenPipeError, asyncio.CancelledError):
            pass
        finally:
            try:
                writer.close()
            except Exception:
                pass

    async def _handle(self, client_reader, client_writer):
        try:
            up_reader, up_writer = await asyncio.open_connection(
                self.target_host, self.target_port)
        except OSError:
            client_writer.close()
            return

        await asyncio.gather(
            self._pump(client_reader, up_writer),
            self._pump(up_reader, client_writer),
            return_exceptions=True,
        )

    async def _serve(self):
        self._server = await asyncio.start_server(self._handle, "127.0.0.1", 0)
        self.port = self._server.sockets[0].getsockname()[1]
        self._ready.set()

        # Wait on an explicit stop signal rather than serve_forever(), so
        # shutdown closes the listener and drains in-flight pumps instead of
        # yanking the loop out from under them.
        self._stop = asyncio.Event()
        await self._stop.wait()

        self._server.close()
        await self._server.wait_closed()

    def _run(self):
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._serve())
        except asyncio.CancelledError:
            pass
        finally:
            for task in asyncio.all_tasks(self._loop):
                task.cancel()
            self._loop.run_until_complete(asyncio.sleep(0))
            self._loop.close()

    # -- lifecycle ---------------------------------------------------------

    def start(self) -> "LatencyProxy":
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        if not self._ready.wait(timeout=10):
            raise RuntimeError("latency proxy failed to start")
        return self

    def stop(self):
        if self._loop and self._loop.is_running():
            self._loop.call_soon_threadsafe(self._stop.set)
        if self._thread:
            self._thread.join(timeout=10)

    def __enter__(self):
        return self.start()

    def __exit__(self, *exc):
        self.stop()

    @property
    def round_trip_s(self) -> float:
        return self.one_way_s * 2
