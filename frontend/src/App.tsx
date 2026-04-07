import './styles/index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './utils/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterStudentPage } from './pages/RegisterStudentPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { StudentPage } from './pages/StudentPage';
import { CompanyPage } from './pages/CompanyPage';
import { PlacementPage } from './pages/PlacementPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/student" element={<RegisterStudentPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/company"
            element={
              <ProtectedRoute allowedRoles={['COMPANY']}>
                <CompanyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/placement"
            element={
              <ProtectedRoute allowedRoles={['PLACEMENT', 'ADMIN']}>
                <PlacementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
