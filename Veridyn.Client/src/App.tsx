import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetailView } from './pages/ProjectDetailView';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { RegisterUser } from './pages/RegisterUser';
import { AdminSignupPage } from './pages/AdminSignupPage';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

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

// Layout shell with collapsible/expandable/hideable sidebar & top navbar
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('veridyn-sidebar-expanded');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(false);

  const toggleExpand = () => {
    setIsSidebarExpanded(prev => {
      const next = !prev;
      localStorage.setItem('veridyn-sidebar-expanded', String(next));
      return next;
    });
  };

  const toggleHidden = () => {
    setIsSidebarHidden(prev => !prev);
  };

  return (
    <div className={`min-h-screen flex flex-col font-['Inter',sans-serif] transition-colors duration-300 ${
      isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F7F7F7] text-slate-900'
    }`}>
      <Navbar onToggleSidebarHidden={toggleHidden} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isExpanded={isSidebarExpanded} 
          onToggleExpand={toggleExpand} 
          isHidden={isSidebarHidden} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
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
              <Projects />
            </AppShell>
          </ProtectedRoute>
        }
      />
      {/* Dedicated Project Workspace Area */}
      <Route
        path="/projects/:id"
        element={
          <ProtectedRoute>
            <AppShell>
              <ProjectDetailView />
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
      {/* Provision User (MatDash styled) */}
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
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
