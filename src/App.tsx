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

          {/* Robot sensors — reference pages, no hardware access */}
          <Route path="/sensors/astra-pro" element={<ProtectedRoute><AstraProPage /></ProtectedRoute>} />
          <Route path="/sensors/rplidar-a2" element={<ProtectedRoute><RplidarA2Page /></ProtectedRoute>} />
          <Route path="/sensors/imu" element={<ProtectedRoute><ImuPage /></ProtectedRoute>} />
          <Route path="/sensors/ultrasonic" element={<ProtectedRoute><UltrasonicPage /></ProtectedRoute>} />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
