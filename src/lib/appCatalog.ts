/**
 * The one place the console's information architecture is declared.
 *
 * The hub, every section deck, every breadcrumb and the route table all read
 * from this module. Nothing else may declare navigation — three copies drift,
 * and the copy that drifts is always the one pointing at a route no deck
 * lists.
 *
 * Shape is section -> group -> app. A group with no `title` renders as a plain
 * tile grid; a group with a title renders as a labelled band. That is the only
 * difference, which is what lets one deck component serve every section
 * without a special case per section.
 *
 * Adding a section later should be an entry here, not a new component.
 */
import {
    LayoutDashboard, OctagonX, Smartphone, Route, CircuitBoard,
    Camera, Radar, Compass, Waves,
    ScanLine, Crosshair, Footprints, Shield,
    Sigma, Activity, Gauge, Network, MessageSquare, Brain,
    type LucideIcon,
} from 'lucide-react';

/**
 * Where a page's content came from.
 *
 * `LIVE` and `OFFLINE` are deliberately absent: those already mean "the robot
 * link is up/down" elsewhere in this app, and a reference page must never be
 * able to claim either. `SIMULATED DATA` is the existing wording used by the
 * sensor and vision labs and is reused verbatim rather than reworded.
 */
export type Provenance =
    | 'SPEC SHEET'
    | 'RECORDED BAG'
    | 'BENCH RESULTS'
    | 'DESIGN DRAFT'
    | 'REFERENCE'
    | 'SIMULATED DATA'
    | 'CONTROL SURFACE';

export interface AppDef {
    id: string;
    title: string;
    /** One line. What it is, not why it is great. */
    blurb: string;
    route: string;
    icon: LucideIcon;
    provenance: Provenance;
}

export interface AppGroup {
    /** Untitled -> plain grid. Titled -> labelled band. */
    title?: string;
    description?: string;
    apps: AppDef[];
}

export interface SectionDef {
    id: string;
    title: string;
    route: string;
    icon: LucideIcon;
    groups: AppGroup[];
}

export const SECTIONS: SectionDef[] = [
    {
        id: 'control',
        title: 'Robot control',
        route: '/section/control',
        icon: Smartphone,
        groups: [
            {
                apps: [
                    {
                        id: 'dashboard',
                        title: 'Dashboard',
                        blurb: 'Robot info, sensors, configuration and system monitoring.',
                        route: '/dashboard',
                        icon: LayoutDashboard,
                        provenance: 'CONTROL SURFACE',
                    },
                    {
                        id: 'route-planner',
                        title: 'Simple route planner',
                        blurb: 'Design and edit navigation routes on the map canvas, then dispatch them to Nav2.',
                        route: '/simple-route-planner',
                        icon: Route,
                        provenance: 'CONTROL SURFACE',
                    },
                    {
                        id: 'remote-controller',
                        title: 'Remote controller',
                        blurb: 'Manual teleop with keyboard steering, joystick, LIDAR dial and the WebRTC camera feed.',
                        route: '/remote-controller',
                        icon: Smartphone,
                        provenance: 'CONTROL SURFACE',
                    },
                    {
                        id: 'emergency-stop',
                        title: 'Emergency stop',
                        blurb: 'Halt every active controller with the global software E-Stop.',
                        route: '/emergency-stop',
                        icon: OctagonX,
                        provenance: 'CONTROL SURFACE',
                    },
                ],
            },
        ],
    },
    {
        id: 'sensors',
        title: 'Robot sensors',
        route: '/section/sensors',
        icon: CircuitBoard,
        groups: [
            {
                apps: [
                    {
                        id: 'rplidar-a2',
                        title: 'RPLIDAR A2',
                        blurb: '360° planar scanner. The layer SLAM, AMCL and the costmap obstacle layer all run on.',
                        route: '/sensors/rplidar-a2',
                        icon: Radar,
                        provenance: 'RECORDED BAG',
                    },
                    {
                        id: 'imu',
                        title: '9-DOF IMU',
                        blurb: 'BNO055 accelerometer, gyroscope and magnetometer with on-chip sensor fusion.',
                        route: '/sensors/imu',
                        icon: Compass,
                        provenance: 'RECORDED BAG',
                    },
                    {
                        id: 'astra-pro',
                        title: 'Orbbec Astra Pro',
                        blurb: 'Structured-light depth camera. Registered RGB-D from 0.6 m, over two separate USB identities.',
                        route: '/sensors/astra-pro',
                        icon: Camera,
                        provenance: 'SPEC SHEET',
                    },
                    {
                        id: 'ultrasonic',
                        title: 'Ultrasonic array',
                        blurb: 'Four HC-SR04 rangefinders covering the blind band the planar scanner cannot see.',
                        route: '/sensors/ultrasonic',
                        icon: Waves,
                        provenance: 'SPEC SHEET',
                    },
                ],
            },
        ],
    },
    {
        id: 'projects',
        title: 'Robotics projects',
        route: '/section/projects',
        icon: Route,
        groups: [
            {
                apps: [
                    {
                        id: 'line-following',
                        title: 'Line following',
                        blurb: 'PI control on a thresholded floor stripe, with a stop condition instead of a search.',
                        route: '/projects/line-following',
                        icon: ScanLine,
                        provenance: 'SIMULATED DATA',
                    },
                    {
                        id: 'object-tracking',
                        title: 'Object tracking',
                        blurb: 'HSV blob tracking gated on area continuity, steering on true bearing rather than pixel offset.',
                        route: '/projects/object-tracking',
                        icon: Crosshair,
                        provenance: 'SIMULATED DATA',
                    },
                    {
                        id: 'human-follower',
                        title: 'Human follower',
                        blurb: 'Re-identification lock at a fixed standoff, capped below walking pace and biased to halt.',
                        route: '/projects/human-follower',
                        icon: Footprints,
                        provenance: 'SIMULATED DATA',
                    },
                    {
                        id: 'patrolling',
                        title: 'Patrolling',
                        blurb: 'An unattended waypoint loop whose real design problem is bounding the recovery behaviours.',
                        route: '/projects/patrolling',
                        icon: Shield,
                        provenance: 'SIMULATED DATA',
                    },
                ],
            },
        ],
    },
    {
        id: 'ai',
        title: 'AI & robotics',
        route: '/section/ai',
        icon: Brain,
        groups: [
            {
                title: 'Statistical distributions',
                apps: [
                    {
                        id: 'uniform',
                        title: 'Uniform',
                        blurb: 'Maximum entropy between two bounds — the prior AMCL scatters particles with.',
                        route: '/ai/uniform',
                        icon: Sigma,
                        provenance: 'SIMULATED DATA',
                    },
                    {
                        id: 'exponential',
                        title: 'Exponential',
                        blurb: 'Memoryless waiting times, and what reconnect backoff costs without them.',
                        route: '/ai/exponential',
                        icon: Activity,
                        provenance: 'SIMULATED DATA',
                    },
                    {
                        id: 'normal',
                        title: 'Normal (Gaussian)',
                        blurb: 'The pose covariance the filter is seeded with, and why its tails are a lie.',
                        route: '/ai/normal',
                        icon: Gauge,
                        provenance: 'SIMULATED DATA',
                    },
                ],
            },
            {
                title: 'AI driven robot',
                apps: [
                    {
                        id: 'ros2-mcp',
                        title: 'ROS 2 MCP design',
                        blurb: 'What a model is allowed to call, and what sits below it that no tool can reach.',
                        route: '/ai/ros2-mcp',
                        icon: Network,
                        provenance: 'DESIGN DRAFT',
                    },
                    {
                        id: 'prompting',
                        title: 'Prompting robotics',
                        blurb: 'Prompt patterns for a system that acts, optimised for what happens when it is wrong.',
                        route: '/ai/prompting',
                        icon: MessageSquare,
                        provenance: 'DESIGN DRAFT',
                    },
                ],
            },
        ],
    },
];

/** Every app in declaration order, flattened across sections and groups. */
export const ALL_APPS: AppDef[] = SECTIONS.flatMap(s => s.groups.flatMap(g => g.apps));

export function sectionById(id: string): SectionDef | undefined {
    return SECTIONS.find(s => s.id === id);
}

export interface AppMeta {
    app: AppDef;
    section: SectionDef;
    group: AppGroup;
}

const BY_ROUTE = new Map<string, AppMeta>();
for (const section of SECTIONS) {
    for (const group of section.groups) {
        for (const app of group.apps) {
            if (BY_ROUTE.has(app.route)) {
                throw new Error(`appCatalog: duplicate route ${app.route}`);
            }
            BY_ROUTE.set(app.route, { app, section, group });
        }
    }
}

/**
 * Resolve a route to its app and owning section.
 *
 * Throws rather than returning undefined: a mistyped route would otherwise
 * render a page with a blank header and no breadcrumb, which is the kind of
 * thing found weeks later. Failing at first render makes the typo obvious.
 */
export function appMeta(route: string): AppMeta {
    const meta = BY_ROUTE.get(route);
    if (!meta) {
        throw new Error(
            `appCatalog: no app registered for route "${route}". ` +
            `Known routes: ${[...BY_ROUTE.keys()].join(', ')}`,
        );
    }
    return meta;
}

/** The section that owns a route — used by the hub to light the right entry. */
export function sectionForRoute(route: string): SectionDef | undefined {
    return BY_ROUTE.get(route)?.section ?? SECTIONS.find(s => s.route === route);
}

export function appCount(section: SectionDef): number {
    return section.groups.reduce((n, g) => n + g.apps.length, 0);
}
