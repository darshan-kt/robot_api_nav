import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/LoginPage';
import { AppStorePage } from './pages/AppStorePage';
import { DashboardPage } from './pages/DashboardPage';
import { EmergencyStopPage } from './pages/EmergencyStopPage';
import { RemoteControllerPage } from './pages/RemoteControllerPage';
import { SimpleRoutePlannerPage } from './pages/SimpleRoutePlannerPage';
import { HardwareSensorsLabPage } from './pages/HardwareSensorsLabPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

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
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
