export interface Robot {
    id: string;
    user_id: string;
    name: string;
    model: string;
    serial_number: string;
    firmware_version: string;
    ip_address: string;
    status: string;
    battery_level: number;
    uptime_hours: number;
    last_mission: string;
    max_speed: number;
    max_linear_speed: number;   // teleop limit, m/s   (0.1 – 0.8)
    max_turn_rate: number;      // teleop limit, rad/s (0.1 – 1.0)
    obstacle_distance: number;
    navigation_mode: string;
    localization_method: string;
    path_planner: string;
    recovery_behavior: string;
    created_at: string;
    updated_at: string;
}

export interface EmergencyStop {
    id: string;
    robot_id: string;
    user_id: string;
    is_active: boolean;
    triggered_at: string | null;
    released_at: string | null;
    triggered_by: string;
    reason: string | null;
    created_at: string;
}

export interface RobotSensor {
    id: string;
    robot_id: string;
    name: string;
    model: string | null;
    status: string;
    frequency: string | null;
    temperature: number | null;
    created_at?: string;
}

export interface MapData {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    status: string;
    source: string | null;
    resolution: number;
    width: number | null;
    height: number | null;
    map_data: any;
    created_at: string;
    updated_at: string;
}

export interface SafetyZone {
    id: string;
    map_id: string;
    name: string;
    zone_type: string;
    vertices: { x: number; y: number }[];
    color: string;
    created_at: string;
}

export interface Waypoint {
    x: number;
    y: number;
    theta?: number;
    order: number;
    label: string;
}

export interface Mission {
    id: string;
    user_id: string;
    map_id: string | null;
    name: string;
    status: string;
    waypoints: Waypoint[];
    created_at: string;
    updated_at: string;
}

export interface ScheduledRoute {
    id: string;
    user_id: string;
    map_id: string;
    name: string;
    description: string | null;
    waypoints: Waypoint[];
    schedule_type: 'once' | 'daily' | 'weekly' | 'custom';
    schedule_date: string | null;
    schedule_time: string;
    recurrence_days: number[] | null;
    is_active: boolean;
    priority: number;
    estimated_duration: number | null;
    color: string;
    created_at: string;
    updated_at: string;
}

export interface ScheduleExecution {
    id: string;
    scheduled_route_id: string;
    user_id: string;
    mission_id: string | null;
    scheduled_for: string;
    status: 'pending' | 'triggered' | 'executing' | 'completed' | 'failed' | 'skipped' | 'cancelled';
    started_at: string | null;
    completed_at: string | null;
    duration_seconds: number | null;
    error_message: string | null;
    waypoints_completed: number;
    waypoints_total: number;
    trigger_source: 'automatic' | 'manual';
    created_at: string;
}

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    mode?: 'text' | 'voice';
}

export interface Conversation {
    id: string;
    user_id: string;
    robot_id: string | null;
    mode: 'text' | 'voice';
    messages: Message[];
    updated_at: string;
}
