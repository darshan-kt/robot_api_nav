"""
Static contract tests for the C++ behavior layer.

A mission dispatched from the browser crosses four independent name spaces
before it reaches a tree:

    frontend id/behavior_name
      -> hive_bt_server route_id_<n> parameter  (id -> canonical name)
      -> hive_bt_server kAliases                (friendly name -> canonical)
      -> bt_runner switch                       (canonical -> XML path)
      -> bt_runner/trees/*.xml                  (the tree itself)

Nothing enforces that chain at build time — a rename in one place surfaces
only as "Unknown behavior_name" at runtime, after the operator has clicked
Dispatch. These tests read the actual C++ sources and tree files and assert
the chain closes. They need no ROS, no build and no container.
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import pytest

pytestmark = pytest.mark.unit


@pytest.fixture(scope="module")
def runner_src(repo_root) -> str:
    return (repo_root / "backend" / "bt_runner" / "src" / "runner.cpp").read_text()


@pytest.fixture(scope="module")
def server_src(repo_root) -> str:
    return (repo_root / "backend" / "hive_bt_server" / "src" / "server.cpp").read_text()


@pytest.fixture(scope="module")
def trees_dir(repo_root) -> Path:
    return repo_root / "backend" / "bt_runner" / "trees"


def _runner_id_map(src: str) -> dict[int, str]:
    """case 22: behavior = "GoToWaypoints";  ->  {22: "GoToWaypoints"}"""
    return {int(i): name for i, name in
            re.findall(r'case\s+(\d+):\s*behavior\s*=\s*"([^"]+)"', src)}


def _runner_tree_map(src: str) -> dict[str, str]:
    """behavior == "GoToA") xml_path = share + "/trees/go_to_a.xml"  ->  {...}"""
    return {behavior: xml for behavior, xml in
            re.findall(r'behavior\s*==\s*"([^"]+)"\)\s*xml_path\s*=\s*share\s*\+\s*"/trees/([^"]+)"', src)}


def _server_route_params(src: str) -> dict[str, str]:
    """declare_parameter<std::string>("route_id_22", "GoToWaypoints")"""
    return {param: name for param, name in
            re.findall(r'declare_parameter<std::string>\(\s*"(route_id_\d+)",\s*"([^"]+)"', src)}


def _server_aliases(src: str) -> dict[str, str]:
    """The kAliases block: {"FollowRoute", "GoToWaypoints"}"""
    block = re.search(r'kAliases\s*=\s*\{(.*?)\};', src, re.S)
    assert block, "kAliases map not found in server.cpp — did it get renamed?"
    return dict(re.findall(r'\{\s*"([^"]+)",\s*"([^"]+)"\s*\}', block.group(1)))


# =============================================================================
# Every behaviour the runner can name must have a tree on disk
# =============================================================================

def test_the_maps_were_actually_parsed(runner_src, server_src):
    """Guards the regexes themselves — a silent no-match would make every
    test below pass vacuously."""
    assert len(_runner_id_map(runner_src)) >= 8
    assert len(_runner_tree_map(runner_src)) >= 8
    assert len(_server_route_params(server_src)) >= 9
    assert len(_server_aliases(server_src)) >= 6


def test_every_runner_tree_path_exists_on_disk(runner_src, trees_dir):
    missing = [xml for xml in _runner_tree_map(runner_src).values()
               if not (trees_dir / xml).exists()]
    assert missing == [], f"runner.cpp references trees that do not exist: {missing}"


def test_every_id_the_runner_knows_resolves_to_a_tree(runner_src, trees_dir):
    tree_map = _runner_tree_map(runner_src)
    unresolvable = {bid: name for bid, name in _runner_id_map(runner_src).items()
                    if name not in tree_map}
    assert unresolvable == {}, f"ids with no tree: {unresolvable}"


def test_every_tree_file_is_well_formed_xml(trees_dir):
    for xml_file in sorted(trees_dir.glob("*.xml")):
        ET.parse(xml_file)   # raises ParseError on malformed XML


def test_every_tree_declares_a_main_tree_to_execute(trees_dir):
    """BT.CPP needs this attribute (or a single tree) to know where to start."""
    for xml_file in sorted(trees_dir.glob("*.xml")):
        root = ET.parse(xml_file).getroot()
        trees = root.findall("BehaviorTree")
        assert root.get("main_tree_to_execute") or len(trees) == 1, \
            f"{xml_file.name} has {len(trees)} trees and no main_tree_to_execute"


def test_main_tree_to_execute_points_at_a_tree_that_exists(trees_dir):
    for xml_file in sorted(trees_dir.glob("*.xml")):
        root = ET.parse(xml_file).getroot()
        main = root.get("main_tree_to_execute")
        if not main:
            continue
        ids = {t.get("ID") for t in root.findall("BehaviorTree")}
        assert main in ids, f"{xml_file.name}: main_tree_to_execute='{main}' not among {ids}"


# =============================================================================
# server.cpp -> runner.cpp
# =============================================================================

def test_every_server_route_id_resolves_to_a_runner_behaviour(server_src, runner_src):
    """
    The id the frontend sends is turned into a name by server.cpp; runner.cpp
    then has to recognise that name. StopNow/SimpleTurtle are handled inside
    the server itself and never reach the runner's tree switch.
    """
    handled_by_server = {"StopNow", "SimpleTurtle"}
    tree_map = _runner_tree_map(runner_src)
    aliases = _server_aliases(server_src)

    broken = {}
    for param, name in _server_route_params(server_src).items():
        if name in handled_by_server:
            continue
        canonical = aliases.get(name, name)
        if canonical not in tree_map:
            broken[param] = name
    assert broken == {}, f"route ids that the runner cannot execute: {broken}"


def test_every_alias_target_is_a_real_runner_behaviour(server_src, runner_src):
    tree_map = _runner_tree_map(runner_src)
    dangling = {src: dst for src, dst in _server_aliases(server_src).items()
                if dst not in tree_map}
    assert dangling == {}, f"aliases pointing at unknown behaviours: {dangling}"


def test_server_and_runner_agree_on_the_shared_ids(server_src, runner_src):
    """
    Both files carry their own id -> name table. They must not disagree:
    the server's wins in practice, so a drift means the runner's fallback
    switch quietly dispatches something else.
    """
    server_ids = {int(p.rsplit("_", 1)[1]): n
                  for p, n in _server_route_params(server_src).items()}
    aliases = _server_aliases(server_src)

    conflicts = {}
    for bid, runner_name in _runner_id_map(runner_src).items():
        if bid in server_ids:
            canonical = aliases.get(server_ids[bid], server_ids[bid])
            if canonical != runner_name:
                conflicts[bid] = (server_ids[bid], runner_name)
    assert conflicts == {}, f"id -> behaviour disagreements (server, runner): {conflicts}"


# =============================================================================
# frontend -> the whole chain
# =============================================================================

def test_the_behaviour_the_route_planner_dispatches_actually_resolves(
        repo_root, server_src, runner_src, trees_dir):
    """
    THE end-to-end name check. SimpleRoutePlannerPage posts
    {id: 22, behavior_name: 'FollowRoute'} — and because a non-empty
    behavior_name takes precedence over the id everywhere downstream, the
    alias table is the ONLY thing that stops that dispatch failing with
    "Unknown behavior_name". Nothing else in the repo tests that.
    """
    page = (repo_root / "src" / "pages" / "SimpleRoutePlannerPage.tsx").read_text()
    dispatched = set(re.findall(r"behavior_name:\s*'([^']+)'", page))
    assert dispatched, "no behavior_name found in SimpleRoutePlannerPage.tsx"

    aliases = _server_aliases(server_src)
    tree_map = _runner_tree_map(runner_src)

    for name in dispatched:
        canonical = aliases.get(name, name)
        assert canonical in tree_map, \
            f"frontend dispatches behavior_name='{name}' which resolves to " \
            f"'{canonical}' — not a behaviour bt_runner can run"
        assert (trees_dir / tree_map[canonical]).exists()


def test_frontend_ids_are_known_to_the_server(repo_root, server_src):
    page = (repo_root / "src" / "pages" / "SimpleRoutePlannerPage.tsx").read_text()
    ids = {int(i) for i in re.findall(r"\bid:\s*(\d+),\s*\n\s*behavior_name", page)}
    known = {int(p.rsplit("_", 1)[1]) for p in _server_route_params(server_src)}
    assert ids <= known, f"frontend dispatches ids the server does not route: {ids - known}"


# =============================================================================
# Installed trees — what the running container actually loads
# =============================================================================

def test_source_trees_are_installed_by_cmake(repo_root, trees_dir):
    """
    runner.cpp loads trees from the package's SHARE dir, not from src/. If a
    new tree isn't added to the install() rule it works locally and 404s in
    the container.
    """
    cmake = (repo_root / "backend" / "bt_runner" / "CMakeLists.txt").read_text()
    assert re.search(r'install\s*\(\s*DIRECTORY[^)]*trees', cmake, re.S | re.I), \
        "bt_runner/CMakeLists.txt does not install the trees/ directory"
