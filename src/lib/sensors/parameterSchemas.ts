// src/lib/sensors/parameterSchemas.ts
/**
 * Per-device parameter schemas — the tunable-parameters panel is entirely
 * driven from these, and MockSensorSource seeds its initial state from
 * their `default` values (see parameterSchemas.test.ts's round-trip test).
 *
 * Every entry's `reconfigure` tag is a real claim about the actual driver,
 * not a UI convenience:
 *   - 'restart'     — confirmed: this value is read once at node/driver
 *                      startup (opening a serial port, negotiating a UVC
 *                      format, etc.), so changing it can only take effect
 *                      after a restart.
 *   - 'investigate' — the source read for this course could not confirm
 *                      whether a live ROS 2 parameter-change callback
 *                      exists for this field. NEVER guessed as 'live' —
 *                      correcting one of these only ever means updating
 *                      this file, once a human re-reads the driver source
 *                      (e.g. checks for add_on_set_parameters_callback).
 *   - 'live'         — not used anywhere in this file yet: neither device
 *                      profile confirmed a genuinely live-reconfigurable
 *                      parameter from source. Left in the type for when
 *                      one is confirmed, not omitted to force a false
 *                      choice between the other two.
 *
 * Sources (a separate repo — see src/lib/sensors/content/ for the full
 * provenance convention):
 *   /home/darshan/best_nextJS/docs/hardware/STAGE_4_RPLIDAR_A2_PROFILE.md §5
 *   /home/darshan/best_nextJS/docs/hardware/STAGE_4_ASTRA_PRO_PROFILE.md §5a/§5b
 */
import type { ParameterDef } from './types';

const RPLIDAR_SOURCE = 'RPLIDAR A2 profile §5 (ROS 2 Integration Surface) parameter table';
const RPLIDAR_BAUD_SOURCE = 'RPLIDAR A2 profile §5/§6 failure mode 1 — the Baud Rate Trap';

export const RPLIDAR_A2_PARAMETERS: ParameterDef[] = [
  {
    key: 'channel_type',
    label: 'Channel Type',
    type: 'enum',
    options: [{ value: 'serial', label: 'Serial' }, { value: 'tcp', label: 'TCP' }],
    default: 'serial',
    reconfigure: 'restart',
    reconfigureNote:
      'Selects the transport at node construction; not exposed as a runtime-settable parameter in the source read.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'serial_port',
    label: 'Serial Port',
    type: 'string',
    default: '/dev/ttyUSB0',
    reconfigure: 'restart',
    reconfigureNote: 'The serial device is opened once at node startup.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'serial_baudrate',
    label: 'Serial Baud Rate',
    type: 'enum',
    unit: 'bps',
    options: [
      { value: '256000', label: '256000 (A2M7 / A2M12)' },
      { value: '115200', label: '115200 (A2M8)' },
      { value: '1000000', label: "1000000 (node's own compiled-in default — matches NO A2 submodel)" },
    ],
    default: '1000000',
    reconfigure: 'restart',
    reconfigureNote:
      'A serial port setting read at node startup, not exposed as a ROS param service — the single most important tag in this table. The node\'s own compiled-in default (1,000,000 bps) matches no A2 submodel; the correct value only ever comes from the launch file used.',
    sourceRef: RPLIDAR_BAUD_SOURCE,
  },
  {
    key: 'frame_id',
    label: 'Frame ID',
    type: 'string',
    default: 'laser_frame',
    reconfigure: 'restart',
    reconfigureNote:
      'TF frame id is stamped onto messages at construction; not confirmed reconfigurable in the source read.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'topic_name',
    label: 'Topic Name',
    type: 'string',
    default: 'scan',
    reconfigure: 'restart',
    reconfigureNote: 'Publisher topic names bind at creation — general ROS 2 behaviour, not device-specific.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'inverted',
    label: 'Inverted',
    type: 'boolean',
    default: false,
    reconfigure: 'investigate',
    reconfigureNote:
      "Source read of rplidar_node.cpp does not confirm whether a runtime parameter-change callback exists for this field.",
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'angle_compensate',
    label: 'Angle Compensate',
    type: 'boolean',
    default: false,
    reconfigure: 'investigate',
    reconfigureNote: 'Not confirmed live-settable from the source read.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'scan_mode',
    label: 'Scan Mode',
    type: 'enum',
    options: [
      { value: '', label: '(node default)' },
      { value: 'Sensitivity', label: 'Sensitivity (A2 launch default)' },
      { value: 'Boost', label: 'Boost' },
      { value: 'Stability', label: 'Stability' },
    ],
    default: 'Sensitivity',
    reconfigure: 'investigate',
    reconfigureNote:
      "Not confirmed live-settable. Failure mode 9's self-diagnosing \"scan mode is not supported\" error implies some validation path exists, but not whether it runs without a restart.",
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'scan_frequency',
    label: 'Scan Frequency',
    type: 'number',
    unit: 'Hz',
    min: 5,
    max: 15,
    step: 0.5,
    default: 10,
    reconfigure: 'investigate',
    reconfigureNote:
      'Represents physical motor RPM; the profile does not confirm a live service/param path distinct from the node-startup parameter.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'flip_x_axis',
    label: 'Flip X Axis',
    type: 'boolean',
    default: false,
    reconfigure: 'investigate',
    reconfigureNote: 'Not confirmed live-settable from the source read.',
    sourceRef: RPLIDAR_SOURCE,
  },
  {
    key: 'auto_standby',
    label: 'Auto Standby',
    type: 'boolean',
    default: false,
    reconfigure: 'investigate',
    reconfigureNote: 'Not confirmed live-settable from the source read.',
    sourceRef: RPLIDAR_SOURCE,
  },
];

const ASTRA_DEPTH_SOURCE = 'Astra Pro profile §5a (Depth/OpenNI2 surface) / §6 failure mode 7';
const ASTRA_UVC_SOURCE = 'Astra Pro profile §5b (RGB/UVC surface)';
const ASTRA_ENABLE_SOURCE = 'Astra Pro profile §5a/§5b (per-stream enable flags)';

export const ASTRA_PRO_PARAMETERS: ParameterDef[] = [
  {
    key: 'depth_registration',
    label: 'Depth Registration',
    type: 'boolean',
    default: false,
    reconfigure: 'investigate',
    reconfigureNote:
      "The key teaching parameter. It defaults to false even though the point-cloud topic is NAMED depth_registered/points — the topic name does not by itself confirm alignment is active. Real reconfigure-support is genuinely unconfirmed from the source read; the app's own interactive demo is explicit that its live toggle is a simulator convenience, not a confirmed real-hardware behaviour.",
    sourceRef: ASTRA_DEPTH_SOURCE,
  },
  {
    key: 'color_width',
    label: 'Color Width',
    type: 'enum',
    unit: 'px',
    options: [
      { value: '640', label: '640 (fork launch default)' },
      { value: '1280', label: '1280 (sensor ceiling, lower FPS)' },
    ],
    default: '640',
    reconfigure: 'restart',
    reconfigureNote:
      "UVC format is negotiated when uvc_camera_driver.cpp's openCamera() opens the USB video device — changing it requires reopening.",
    sourceRef: ASTRA_UVC_SOURCE,
  },
  {
    key: 'color_height',
    label: 'Color Height',
    type: 'enum',
    unit: 'px',
    options: [
      { value: '480', label: '480 (fork launch default)' },
      { value: '960', label: '960 (sensor ceiling, lower FPS)' },
    ],
    default: '480',
    reconfigure: 'restart',
    reconfigureNote: 'Same UVC format-negotiation path as width — opened once, not live-reconfigurable.',
    sourceRef: ASTRA_UVC_SOURCE,
  },
  {
    key: 'color_fps',
    label: 'Color FPS',
    type: 'number',
    unit: 'fps',
    min: 5,
    max: 30,
    step: 1,
    default: 30,
    reconfigure: 'restart',
    reconfigureNote: 'Same UVC format-negotiation path as resolution.',
    sourceRef: ASTRA_UVC_SOURCE,
  },
  {
    key: 'depth_resolution',
    label: 'Depth Resolution',
    type: 'enum',
    options: [
      { value: 'VGA', label: 'VGA (640×480)' },
      { value: 'QVGA', label: 'QVGA (320×240)' },
      { value: 'QQVGA', label: 'QQVGA (160×120)' },
    ],
    default: 'VGA',
    reconfigure: 'restart',
    reconfigureNote:
      'Same class of argument as color resolution — the OpenNI2 stream format is opened at startup; not confirmed live-settable.',
    sourceRef: ASTRA_DEPTH_SOURCE,
  },
  {
    key: 'enable_color',
    label: 'Enable Color Stream',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: 'Gates whether the RGB/UVC publisher opens at node startup.',
    sourceRef: ASTRA_ENABLE_SOURCE,
  },
  {
    key: 'enable_depth',
    label: 'Enable Depth Stream',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: 'Gates whether the depth/OpenNI2 publisher opens at node startup.',
    sourceRef: ASTRA_ENABLE_SOURCE,
  },
  {
    key: 'enable_ir',
    label: 'Enable IR Stream',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: 'Gates whether the IR publisher opens at node startup.',
    sourceRef: ASTRA_ENABLE_SOURCE,
  },
  {
    key: 'enable_point_cloud',
    label: 'Enable Point Cloud',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: 'Gates whether depth_registered/points is published at node startup.',
    sourceRef: ASTRA_ENABLE_SOURCE,
  },
  {
    key: 'use_uvc_camera',
    label: 'Use UVC Camera',
    type: 'boolean',
    default: true,
    reconfigure: 'restart',
    reconfigureNote: 'Gates whether the UVC driver component opens the RGB USB identity at startup.',
    sourceRef: ASTRA_ENABLE_SOURCE,
  },
  {
    key: 'uvc_retry_count',
    label: 'UVC Retry Count',
    type: 'number',
    min: 1,
    max: 200,
    step: 1,
    default: 100,
    reconfigure: 'investigate',
    reconfigureNote: 'Only affects device-open retry behaviour; no information on live-settability.',
    sourceRef: ASTRA_UVC_SOURCE,
  },
];

export const PARAMETER_SCHEMAS: Record<'rplidar_a2' | 'astra_pro', ParameterDef[]> = {
  rplidar_a2: RPLIDAR_A2_PARAMETERS,
  astra_pro: ASTRA_PRO_PARAMETERS,
};
