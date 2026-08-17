# Map loading fix

How `map/*.pgm` goes from a file on disk to pixels on the Route Planner canvas,
and the four separate bugs that were breaking it along the way. Companion to
[aws_migration_execution.md](aws_migration_execution.md) — that doc covers the
deployment shape, this one covers what was actually wrong with map loading
inside it.

## The intended flow

```
map/*.pgm + map/*.yaml          (source of truth, one folder, any filename)
        │
        ▼  bind-mounted read-only: ./map:/robot_map:ro
hive_api gateway (ROBOT_MAP_DIR)
        │  GET /api/map        → live pgm→PNG, re-read every request, no cache
        │  GET /api/map/meta   → resolution / origin from the matching .yaml
        ▼
SimpleRoutePlannerPage.tsx     fetch(`${GATEWAY_URL}/api/map`) → canvas
```

Drop a new `.pgm`/`.yaml` pair into `map/`, reload the page — nothing else
should be needed. Getting to that point took fixing four independent breaks,
two in code and two in AWS config.

## 1. Frontend was reading a stale bundled file, not the gateway

**Symptom:** dropping a new map into `map/` never showed up in the UI, no
matter what.

**Cause:** `SimpleRoutePlannerPage.tsx` fetched `/map.pgm` — a copy of the map
manually baked into `public/map.pgm` at some point in the past and bundled
into the frontend at build time. It had no connection to the `map/` folder or
to the gateway's already-working `GET /api/map` endpoint.

**Fix:** point the fetch at `${GATEWAY_URL}/api/map` instead, and delete the
stale `public/map.pgm` duplicate so there's one source of truth. The gateway
already returns PNG bytes, so the client-side PGM parser (`pgmParser.ts`) is
no longer needed for this path — only for the separate "upload a map from
your machine" feature, which is unrelated and untouched.

Commit: `9c4b115` ("map file path fixed!")

## 2. Gateway hardcoded the filenames `map.pgm` / `map.yaml`

**Symptom:** after fix #1, renaming the operational map to `home.pgm` /
`home.yaml` made `/api/map` 404 — *"map.pgm not found in /robot_map"* — even
though the file was right there.

**Cause:** `GET /api/map` and `GET /api/map/meta` in `main.py` assumed the
files were always literally named `map.pgm` and `map.yaml`.

**Fix:** added `config.resolve_map_files(map_dir)` — scans `ROBOT_MAP_DIR`
(non-recursively, so `map/backup_maps/` is safely ignored) for a `.yaml`
whose `image:` field points at a real `.pgm` next to it (the standard ROS
map_server convention), and falls back to the most-recently-modified
`.pgm`/`.yaml` if no `.yaml` resolves. Both endpoints call this instead of
hardcoding names. `/api/map/meta` now also reports `map_file` so you can see
which file is currently active.

Verified live: swapped the active map file while the gateway was running —
`/api/map/meta` picked up the new file and its correct resolution/origin
immediately, no restart.

Commit: `de6dafc` ("Auto-discover the active map .pgm/.yaml instead of
hardcoding filenames")

## 3. Fixes existed locally but were never shipped to AWS

**Symptom:** code fixes verified working on the laptop; AWS UI still showed
the old behavior.

**Cause:** `hive_api` and `appstore` on the EC2 instance run from Docker
images built **9 days** prior — long before fixes #1 and #2 existed. The EC2
box's own git checkout (`~/robot_api_nav`) hadn't pulled the new commits, and
the new map files (`home.pgm`, `home.yaml`) weren't even committed yet on the
laptop.

**Fix:** committed the remaining changes, pushed to `origin/mqtt`, then on
the EC2 box:

```bash
cd ~/robot_api_nav
git pull
make -f Makefile.aws aws_build   # rebuilds hive_api + appstore images
make -f Makefile.aws aws_run     # restarts appstore + mqtt-broker + hive_api
```

Worth remembering: `make -f Makefile.aws build_robot` / `run_robot` only
manage `robotstore` (the ROS 2 side, pointed at the AWS broker) — they never
touch `hive_api` or `appstore`. Rebuilding/restarting the robot side has zero
effect on what the map API serves or what the frontend renders.

## 4. Two unfilled placeholders in `.env.aws`

Even with current code and current images, the UI still showed the seeded
demo map ("Warehouse Floor A" — not a stale map, the app's own placeholder
shown whenever the real map fetch fails). Two separate template values in
`.env.aws` had never been replaced with real ones:

**4a. `VITE_GATEWAY_URL`** — still the literal template string
`http://<ec2-public-ip-or-domain>:1717`. This is a Vite **build-time**
variable, baked into the JS bundle as a string constant, not read at
runtime. The browser tried to `fetch()` that literal string, which isn't a
valid URL, threw immediately, and the map fetch failed before any network
request went out. Confirmed via a headless-browser capture of the console
error.

  Fix: set it to the real address (`http://13.51.74.241:1717`) and rebuild
  — a restart alone can never pick this up, only `aws_build` recompiles the
  bundle.

**4b. `CORS_ALLOWED_ORIGINS`** — still the template value
`https://appstore.yourdomain.com`. Once 4a was fixed, WebSocket-driven data
(AMCL localisation) started working — WebSocket upgrades aren't subject to
the same CORS enforcement — which made it look like the fix was incomplete
rather than a second, separate bug. Plain `fetch()` calls to `/api/map` and
`/api/map/meta`, however, were being rejected by the browser because the
gateway's CORS middleware didn't recognize `http://13.51.74.241:5174` as an
allowed origin. Confirmed with a manual CORS preflight check
(`curl -X OPTIONS ... -H "Origin: ..."` → `400 Disallowed CORS origin`).

  Fix: set it to the real frontend origin (`http://13.51.74.241:5174`).
  Unlike `VITE_GATEWAY_URL`, this one's read from the environment at
  container start, not baked into a build — `aws_run` alone (no rebuild)
  is enough to apply it.

## Quick reference — inspecting the map API from the CLI

```bash
curl -s http://<host>:1717/health                # is the gateway up
curl -s http://<host>:1717/api/map/meta           # which file is active + resolution/origin
curl -s -o map.png http://<host>:1717/api/map     # download the rendered map
file map.png                                      # confirm it's a real PNG, not an error JSON
docker exec hive_api-api-arm ls -la /robot_map    # what the container actually sees on disk
docker logs -f hive_api-api-arm                   # tail gateway logs
```

## Lesson for next time

When a fetch silently fails in a distributed, multi-stage-build deployment
like this one, check in this order — each layer can hide the next:

1. Does the endpoint work at all? (`curl` directly against the gateway)
2. Is the *code* serving it current? (git log, image build timestamp)
3. Is the *config* baked into that code correct? (build-time env vars —
   `VITE_GATEWAY_URL` — need a rebuild, not a restart, to change)
4. Is the *runtime* config correct? (env vars like `CORS_ALLOWED_ORIGINS` —
   need a restart/recreate, not necessarily a rebuild)
5. Only then look at the browser — by that point a screen recording +
   console log usually confirms the diagnosis in seconds rather than being
   the starting point of the search.




