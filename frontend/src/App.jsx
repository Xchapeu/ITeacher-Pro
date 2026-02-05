import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/pages/LandingPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import InstitutionDashboard from '@/pages/InstitutionDashboard.jsx';
import TeacherDashboard from '@/pages/TeacherDashboard.jsx';
import ClassDetails from '@/pages/ClassDetails.jsx';
import AuthCallback from '@/pages/AuthCallback.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';

const DashboardRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?.user_type === 'institution') {
    return <Navigate to="/institution" replace />;
  }
  return <Navigate to="/teacher" replace />;
};

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/institution/*"
        element={
          <ProtectedRoute requiredType="institution">
            <InstitutionDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/*"
        element={
          <ProtectedRoute requiredType="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:classId"
        element={
          <ProtectedRoute>
            <ClassDetails />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App noise-texture">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
