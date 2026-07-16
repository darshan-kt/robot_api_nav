// src/lib/localDb.ts
import type { Robot, RobotSensor, EmergencyStop, MapData, Mission, ScheduledRoute, ScheduleExecution, SafetyZone, Conversation } from '../types';
import { idb } from './idb';

// Prefix used by legacy localStorage implementation – kept for migration only.
const LEGACY_PREFIX = 'robot_store_';

/**
 * Retrieve a value (stored as a whole array) from an object store.
 * If the key does not exist, returns an empty array.
 */
async function getStoreArray<T>(storeName: string): Promise<T[]> {
  const data = await idb.get<T[]>(storeName, storeName);
  return data ?? [];
}

/** Store an entire array under the given store name. */
async function setStoreArray<T>(storeName: string, items: T[]): Promise<void> {
  await idb.put<T[]>(storeName, items, storeName);
}

/**
 * Migrate any existing data stored in legacy localStorage keys to IndexedDB.
 * Runs only once, guarded by a flag in the "meta" store.
 */
async function migrateLegacyData(): Promise<void> {
  const migrated = await idb.get<boolean>('meta', 'migrated');
  if (migrated) return;
  // List of known keys used by the old implementation.
  const keys = [
    'robots',
    'sensors',
    'emergency_stops',
    'maps',
    'safety_zones',
    'missions',
    'schedules',
    'executions',
    'conversations',
  ];
  for (const key of keys) {
    const raw = localStorage.getItem(LEGACY_PREFIX + key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        await setStoreArray(key, parsed);
        localStorage.removeItem(LEGACY_PREFIX + key);
      } catch {
        // ignore malformed entries
      }
    }
  }
  await idb.put('meta', true, 'migrated');
}

export const localDb = {
  // Auth (unchanged – static stub)
  getUser: async () => {
    return { id: 'local-user', email: 'admin@robot.local' };
  },

  // Robots
  getRobot: async (): Promise<Robot | null> => {
    await migrateLegacyData();
    const robots = await getStoreArray<Robot>('robots');
    if (robots.length === 0) {
      const defaultRobot: Robot = {
        id: 'robot-1',
        user_id: 'local-user',
        name: 'AMR-X200',
        model: 'V2',
        serial_number: 'SN-001',
        firmware_version: '1.0.0',
        ip_address: '192.168.1.100',
        status: 'operational',
        battery_level: 78,
        uptime_hours: 120,
        last_mission: '',
        max_speed: 1.5,
        max_linear_speed: 0.5,
        max_turn_rate: 1.0,
        obstacle_distance: 0.5,
        navigation_mode: 'autonomous',
        localization_method: 'amcl',
        path_planner: 'dwa',
        recovery_behavior: 'spin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await setStoreArray('robots', [defaultRobot]);
      return defaultRobot;
    }
    // Backfill teleop limits on robots stored before these fields existed
    if (robots[0].max_linear_speed === undefined || robots[0].max_turn_rate === undefined) {
      robots[0] = { max_linear_speed: 0.5, max_turn_rate: 1.0, ...robots[0] };
      await setStoreArray('robots', robots);
    }
    return robots[0];
  },
  updateRobot: async (id: string, updates: Partial<Robot>): Promise<Robot> => {
    await migrateLegacyData();
    const robots = await getStoreArray<Robot>('robots');
    const index = robots.findIndex(r => r.id === id);
    if (index !== -1) {
      robots[index] = { ...robots[index], ...updates };
      await setStoreArray('robots', robots);
      return robots[index];
    }
    throw new Error('Robot not found');
  },

  // Sensors
  getSensors: async (robotId: string): Promise<RobotSensor[]> => {
    await migrateLegacyData();
    let sensors = await getStoreArray<RobotSensor>('sensors');
    if (sensors.length === 0) {
      const now = new Date().toISOString();
      const dummySensors: RobotSensor[] = [
        { id: 's1', robot_id: robotId, name: 'LiDAR VLP-16', model: 'Velodyne', status: 'active', frequency: '20Hz', temperature: 34, created_at: now },
        { id: 's2', robot_id: robotId, name: 'IMU BNO085', model: 'Bosch', status: 'active', frequency: '100Hz', temperature: 28, created_at: now },
        { id: 's3', robot_id: robotId, name: 'Camera Front RealSense D435i', model: 'Intel', status: 'active', frequency: '30fps', temperature: 42, created_at: now },
        { id: 's4', robot_id: robotId, name: 'Camera Rear D435i', model: 'Intel', status: 'standby', frequency: '-', temperature: 26, created_at: now },
        { id: 's5', robot_id: robotId, name: 'Ultrasonic HC-SR04', model: 'Generic', status: 'active', frequency: '40Hz', temperature: 25, created_at: now },
        { id: 's6', robot_id: robotId, name: 'Wheel Encoder AMT102-V', model: 'CUI Devices', status: 'active', frequency: '500Hz', temperature: 30, created_at: now },
      ];
      await setStoreArray('sensors', dummySensors);
      return dummySensors;
    }
    return sensors.filter(s => s.robot_id === robotId);
  },

  // Emergency Stops
  getEmergencyStops: async (limit: number = 10): Promise<EmergencyStop[]> => {
    await migrateLegacyData();
    const stops = await getStoreArray<EmergencyStop>('emergency_stops');
    return stops
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  },
  triggerEmergencyStop: async (robotId: string, isActive: boolean, reason: string): Promise<EmergencyStop> => {
    await migrateLegacyData();
    const stops = await getStoreArray<EmergencyStop>('emergency_stops');
    const newStop: EmergencyStop = {
      id: 'estop-' + Date.now().toString(),
      robot_id: robotId,
      user_id: 'local-user',
      is_active: isActive,
      triggered_at: isActive ? new Date().toISOString() : null,
      released_at: isActive ? null : new Date().toISOString(),
      triggered_by: 'manual',
      reason,
      created_at: new Date().toISOString(),
    } as EmergencyStop;
    stops.unshift(newStop);
    await setStoreArray('emergency_stops', stops);
    window.dispatchEvent(new CustomEvent('localdb-estop-updated', { detail: newStop }));
    return newStop;
  },

  // Maps
  getMaps: async (): Promise<MapData[]> => {
    await migrateLegacyData();
    return await getStoreArray<MapData>('maps');
  },
  saveMap: async (mapData: Partial<MapData>): Promise<MapData> => {
    await migrateLegacyData();
    const maps = await getStoreArray<MapData>('maps');
    const newMap: MapData = {
      ...mapData,
      id: mapData.id || 'map-' + Date.now().toString(),
      created_at: mapData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as MapData;
    const idx = maps.findIndex(m => m.id === newMap.id);
    if (idx !== -1) maps[idx] = newMap; else maps.push(newMap);
    await setStoreArray('maps', maps);
    return newMap;
  },

  // Safety Zones
  getSafetyZones: async (mapId: string): Promise<SafetyZone[]> => {
    await migrateLegacyData();
    const zones = await getStoreArray<SafetyZone>('safety_zones');
    return zones.filter(z => z.map_id === mapId);
  },
  saveSafetyZone: async (zoneData: Partial<SafetyZone>): Promise<SafetyZone> => {
    await migrateLegacyData();
    const zones = await getStoreArray<SafetyZone>('safety_zones');
    const newZone: SafetyZone = {
      ...zoneData,
      id: zoneData.id || 'zone-' + Date.now().toString(),
      created_at: zoneData.created_at || new Date().toISOString(),
    } as SafetyZone;
    const idx = zones.findIndex(z => z.id === newZone.id);
    if (idx !== -1) zones[idx] = newZone; else zones.push(newZone);
    await setStoreArray('safety_zones', zones);
    return newZone;
  },
  deleteSafetyZone: async (id: string): Promise<void> => {
    await migrateLegacyData();
    let zones = await getStoreArray<SafetyZone>('safety_zones');
    zones = zones.filter(z => z.id !== id);
    await setStoreArray('safety_zones', zones);
  },

  // Missions
  getMissions: async (): Promise<Mission[]> => {
    await migrateLegacyData();
    const missions = await getStoreArray<Mission>('missions');
    return missions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  saveMission: async (missionData: Partial<Mission>): Promise<Mission> => {
    await migrateLegacyData();
    const missions = await getStoreArray<Mission>('missions');
    const newMission: Mission = {
      ...missionData,
      id: missionData.id || 'mission-' + Date.now().toString(),
      created_at: missionData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Mission;
    const idx = missions.findIndex(m => m.id === newMission.id);
    if (idx !== -1) {
      missions[idx] = { ...missions[idx], ...missionData, updated_at: new Date().toISOString() };
    } else {
      missions.push(newMission);
    }
    await setStoreArray('missions', missions);
    return newMission;
  },
  updateMissionStatus: async (id: string, status: string): Promise<Mission> => {
    await migrateLegacyData();
    const missions = await getStoreArray<Mission>('missions');
    const mission = missions.find(m => m.id === id);
    if (mission) {
      mission.status = status;
      await setStoreArray('missions', missions);
      return mission;
    }
    throw new Error('Mission not found');
  },

  // Schedules
  getSchedules: async (): Promise<ScheduledRoute[]> => {
    await migrateLegacyData();
    const schedules = await getStoreArray<ScheduledRoute>('scheduled_routes');
    return schedules.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  saveSchedule: async (scheduleData: Partial<ScheduledRoute>): Promise<ScheduledRoute> => {
    await migrateLegacyData();
    const schedules = await getStoreArray<ScheduledRoute>('scheduled_routes');
    const newSchedule: ScheduledRoute = {
      ...scheduleData,
      id: scheduleData.id || 'schedule-' + Date.now().toString(),
      created_at: scheduleData.created_at || new Date().toISOString(),
    } as ScheduledRoute;
    const idx = schedules.findIndex(s => s.id === newSchedule.id);
    if (idx !== -1) schedules[idx] = newSchedule; else schedules.push(newSchedule);
    await setStoreArray('scheduled_routes', schedules);
    return newSchedule;
  },
  deleteSchedule: async (id: string): Promise<void> => {
    await migrateLegacyData();
    let schedules = await getStoreArray<ScheduledRoute>('scheduled_routes');
    schedules = schedules.filter(s => s.id !== id);
    await setStoreArray('scheduled_routes', schedules);
  },

  // Executions
  getExecutions: async (): Promise<ScheduleExecution[]> => {
    await migrateLegacyData();
    const executions = await getStoreArray<ScheduleExecution>('executions');
    return executions.sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime());
  },
  saveExecution: async (executionData: Partial<ScheduleExecution>): Promise<ScheduleExecution> => {
    await migrateLegacyData();
    const executions = await getStoreArray<ScheduleExecution>('executions');
    const newExecution: ScheduleExecution = {
      ...executionData,
      id: executionData.id || 'exec-' + Date.now().toString(),
      created_at: executionData.created_at || new Date().toISOString(),
    } as ScheduleExecution;
    const idx = executions.findIndex(e => e.id === newExecution.id);
    if (idx !== -1) executions[idx] = newExecution; else executions.push(newExecution);
    await setStoreArray('executions', executions);
    return newExecution;
  },

  // Conversations
  getConversation: async (userId: string): Promise<Conversation | null> => {
    await migrateLegacyData();
    const conversations = await getStoreArray<Conversation>('conversations');
    const userConversations = conversations.filter(c => c.user_id === userId);
    if (userConversations.length === 0) return null;
    return userConversations.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
  },
  saveConversation: async (convData: Partial<Conversation>): Promise<Conversation> => {
    await migrateLegacyData();
    const conversations = await getStoreArray<Conversation>('conversations');
    const newConv: Conversation = {
      ...convData,
      id: convData.id || 'conv-' + Date.now().toString(),
      updated_at: new Date().toISOString(),
      messages: convData.messages || [],
    } as Conversation;
    const idx = conversations.findIndex(c => c.id === newConv.id);
    if (idx !== -1) {
      conversations[idx] = { ...conversations[idx], ...convData, updated_at: new Date().toISOString() };
    } else {
      conversations.push(newConv);
    }
    await setStoreArray('conversations', conversations);
    return newConv;
  },
};
