import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { RegisterUser } from './pages/RegisterUser';
import { AdminSignupPage } from './pages/AdminSignupPage';

// Protected route — redirects to /login if no token
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"/>
      </div>
    );
  }
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Simple shell with sidebar for authenticated pages
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100">
      {children}
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const noop = () => {};
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-signup" element={<AdminSignupPage />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <Dashboard onOpenTask={noop} />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <AppShell>
              <Projects onSelectProject={noop} />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <AppShell>
              <ManagerDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dev"
        element={
          <ProtectedRoute>
            <AppShell>
              <DeveloperDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      {/* Register (admin only) */}
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <AppShell>
              <RegisterUser />
            </AppShell>
          </ProtectedRoute>
        }
      />
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};
