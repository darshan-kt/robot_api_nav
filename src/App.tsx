import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { AppStorePage } from './pages/AppStorePage';
import { DashboardPage } from './pages/DashboardPage';
import { EmergencyStopPage } from './pages/EmergencyStopPage';
import { RemoteControllerPage } from './pages/RemoteControllerPage';
import { SimpleRoutePlannerPage } from './pages/SimpleRoutePlannerPage';
import { HardwareSensorsLabPage } from './pages/HardwareSensorsLabPage';
import { VisualTrackingLabPage } from './pages/VisualTrackingLabPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { SectionPage } from './pages/SectionPage';
import { AstraProPage } from './pages/sensors/AstraProPage';
import { RplidarA2Page } from './pages/sensors/RplidarA2Page';
import { ImuPage } from './pages/sensors/ImuPage';
import { UltrasonicPage } from './pages/sensors/UltrasonicPage';
import { SingleMotorPage } from './pages/motion/SingleMotorPage';
import { DualMotorsPage } from './pages/motion/DualMotorsPage';
import { MotorEncodersPage } from './pages/motion/MotorEncodersPage';
import { LineFollowingPage } from './pages/projects/LineFollowingPage';
import { ObjectTrackingPage } from './pages/projects/ObjectTrackingPage';
import { HumanFollowerPage } from './pages/projects/HumanFollowerPage';
import { PatrollingPage } from './pages/projects/PatrollingPage';
import { UniformPage } from './pages/ai/UniformPage';
import { ExponentialPage } from './pages/ai/ExponentialPage';
import { NormalPage } from './pages/ai/NormalPage';
import { Ros2McpPage } from './pages/ai/Ros2McpPage';
import { PromptingPage } from './pages/ai/PromptingPage';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/store"
            element={
              <ProtectedRoute>
                <AppStorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-stop"
            element={
              <ProtectedRoute>
                <EmergencyStopPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/remote-controller"
            element={
              <ProtectedRoute>
                <RemoteControllerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/simple-route-planner"
            element={
              <ProtectedRoute>
                <SimpleRoutePlannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hardware-sensors-lab"
            element={
              <ProtectedRoute>
                <HardwareSensorsLabPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/visual-tracking-lab"
            element={
              <ProtectedRoute>
                <VisualTrackingLabPage />
              </ProtectedRoute>
            }
          />
          {/* Section decks — one route, the catalog decides what renders */}
          <Route
            path="/section/:sectionId"
            element={<ProtectedRoute><SectionPage /></ProtectedRoute>}
          />

          {/* Robot sensor (Perception kit) — reference pages, no hardware access */}
          <Route path="/sensors/astra-pro" element={<ProtectedRoute><AstraProPage /></ProtectedRoute>} />
          <Route path="/sensors/rplidar-a2" element={<ProtectedRoute><RplidarA2Page /></ProtectedRoute>} />
          <Route path="/sensors/imu" element={<ProtectedRoute><ImuPage /></ProtectedRoute>} />
          <Route path="/sensors/ultrasonic" element={<ProtectedRoute><UltrasonicPage /></ProtectedRoute>} />

          {/* Robot sensor (Motion kit) — bench reference pages, no hardware access */}
          <Route path="/motion/single-motor" element={<ProtectedRoute><SingleMotorPage /></ProtectedRoute>} />
          <Route path="/motion/dual-motors" element={<ProtectedRoute><DualMotorsPage /></ProtectedRoute>} />
          <Route path="/motion/motor-encoders" element={<ProtectedRoute><MotorEncodersPage /></ProtectedRoute>} />

          {/* Robotics projects — behaviour packages, bench results only */}
          <Route path="/projects/line-following" element={<ProtectedRoute><LineFollowingPage /></ProtectedRoute>} />
          <Route path="/projects/object-tracking" element={<ProtectedRoute><ObjectTrackingPage /></ProtectedRoute>} />
          <Route path="/projects/human-follower" element={<ProtectedRoute><HumanFollowerPage /></ProtectedRoute>} />
          <Route path="/projects/patrolling" element={<ProtectedRoute><PatrollingPage /></ProtectedRoute>} />

          {/* AI & robotics — reference and design drafts, nothing executable */}
          <Route path="/ai/uniform" element={<ProtectedRoute><UniformPage /></ProtectedRoute>} />
          <Route path="/ai/exponential" element={<ProtectedRoute><ExponentialPage /></ProtectedRoute>} />
          <Route path="/ai/normal" element={<ProtectedRoute><NormalPage /></ProtectedRoute>} />
          <Route path="/ai/ros2-mcp" element={<ProtectedRoute><Ros2McpPage /></ProtectedRoute>} />
          <Route path="/ai/prompting" element={<ProtectedRoute><PromptingPage /></ProtectedRoute>} />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
