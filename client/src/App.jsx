import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OAuthCallback from './pages/auth/OAuthCallback';
import NotFound from './pages/NotFound';

import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/dashboard/Dashboard';
import Projects from './pages/dashboard/Projects';
import ProjectDetail from './pages/dashboard/ProjectDetail';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import ApiTester from './pages/dashboard/ApiTester';
import Collections from './pages/dashboard/Collections';
import Environments from './pages/dashboard/Environments';
import History from './pages/dashboard/History';
import Workflows from './pages/dashboard/Workflows';
import WorkflowEditorPage from './pages/dashboard/WorkflowEditor';
import Analytics from './pages/dashboard/Analytics';
import { useAuth } from './context/AuthContext';
import { useThemeEffect } from './hooks/useThemeEffect';

export default function App() {
  const { user } = useAuth();
  useThemeEffect(user?.preferences?.theme || 'light');

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route
        path="/app/workflows/:id"
        element={
          <ProtectedRoute>
            <WorkflowEditorPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="api-tester" element={<ApiTester />} />
        <Route path="collections" element={<Collections />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="environments" element={<Environments />} />
        <Route path="history" element={<History />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
