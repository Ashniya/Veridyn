import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { StickyNotesProvider, useStickyNotes } from './context/StickyNotesContext';
import { DeveloperStickyNotes } from './components/DeveloperStickyNotes';
import { StickyNote } from 'lucide-react';
import { motion } from 'framer-motion';
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

// Protected route — redirects to /login if no token, or user's home dashboard if role mismatch
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { token, isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"/>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.roleName)) {
    let redirectPath = '/dashboard';
    if (user.roleName === 'Admin') redirectPath = '/admin';
    else if (user.roleName === 'ProjectManager') redirectPath = '/manager';
    else if (user.roleName === 'Developer') redirectPath = '/dev';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

// Layout shell with collapsible/expandable/hideable sidebar & top navbar
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { isOpen, closeNotes, toggleNotes } = useStickyNotes();
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

  const role = user?.role;
  const roleName = user?.roleName;
  const isDev = role === 3 || roleName === 'Developer' || role === 1 || roleName === 'Admin';

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-['Inter',sans-serif] transition-colors duration-300 relative ${
      isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-white text-slate-900'
    }`}>
      {/* Floating Curved-Border Sidebar */}
      <Sidebar 
        isExpanded={isSidebarExpanded} 
        onToggleExpand={toggleExpand} 
        isHidden={isSidebarHidden} 
      />
      {/* Main Content & Top Header Area (compresses when sticky notes panel opens) */}
      <div 
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ marginRight: isDev && isOpen ? 380 : 0 }}
      >
        <Navbar onToggleSidebarHidden={toggleHidden} />
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-[1720px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Sticky Notes Panel & Bottom-Right Corner Launcher for Developers */}
      {isDev && (
        <>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={toggleNotes}
            title={isOpen ? "Close Sticky Notes" : "Open Sticky Notes"}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-2xl flex items-center justify-center border border-amber-300/80 transition-all cursor-pointer group"
          >
            <StickyNote size={22} className="text-amber-950 group-hover:rotate-6 transition-transform" />
          </motion.button>

          <DeveloperStickyNotes isOpen={isOpen} onClose={closeNotes} />
        </>
      )}
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
          <ProtectedRoute allowedRoles={['Admin']}>
            <AppShell>
              <AdminDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['ProjectManager']}>
            <AppShell>
              <ManagerDashboard />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dev"
        element={
          <ProtectedRoute allowedRoles={['Developer', 'Admin']}>
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
          <StickyNotesProvider>
            <AppRoutes />
          </StickyNotesProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
