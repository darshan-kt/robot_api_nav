// src/pages/HardwareSensorsLabPage.tsx
import { CircuitBoard, Radar, Camera } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Layout';
import { SensorSourceProvider } from '../lib/sensors/SensorSourceContext';
import { DeviceCard } from '../components/sensors/DeviceCard';
import { RPLIDAR_A2_PARAMETERS, ASTRA_PRO_PARAMETERS } from '../lib/sensors/parameterSchemas';
import { RPLIDAR_A2_CONTENT } from '../lib/sensors/content/rplidarA2.content';
import { ASTRA_PRO_CONTENT } from '../lib/sensors/content/astraPro.content';

/**
 * Hardware & Sensors Lab — the practical-work companion to the robotics
 * hardware course. Two standalone bench-top devices (RPLIDAR A2, Orbbec
 * Astra Pro), no robot context, no navigation stack, no /cmd_vel — each
 * device is its own independent, tunable, simulated stream.
 *
 * Only this file imports MockSensorSource, indirectly via
 * SensorSourceProvider — every component below it consumes
 * SensorDataSource through context, never a concrete implementation.
 */
export function HardwareSensorsLabPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBack title="Hardware & Sensors Lab" icon={CircuitBoard} iconColor="text-teal-400" />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Card hover={false} theme="teal" className="p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-400/10 text-teal-400 shrink-0">
              <CircuitBoard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text mb-1">Practical work for the robotics hardware course</h2>
              <p className="text-xs text-textMuted leading-relaxed">
                Tune real ROS 2 parameters, read the exact course-verified setup commands, and watch simulated live
                data respond in real time. Every card below is unmistakably labeled — this is simulated data, not a
                connection to real hardware. The same interactive findings this app demonstrates (the RPLIDAR baud
                rate trap, the Astra Pro's depth_registration gap) are what the course's own diagnostics test.
              </p>
            </div>
          </div>
        </Card>

        <SensorSourceProvider>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DeviceCard
              deviceId="rplidar_a2"
              displayName="RPLIDAR A2"
              icon={Radar}
              schema={RPLIDAR_A2_PARAMETERS}
              content={RPLIDAR_A2_CONTENT}
            />
            <DeviceCard
              deviceId="astra_pro"
              displayName="Orbbec Astra Pro"
              icon={Camera}
              schema={ASTRA_PRO_PARAMETERS}
              content={ASTRA_PRO_CONTENT}
            />
          </div>
        </SensorSourceProvider>
      </main>
    </div>
  );
}
