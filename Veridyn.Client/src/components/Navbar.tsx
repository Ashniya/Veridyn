import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, LogOut, Shield, Briefcase, Code, Menu, Sun, Moon,
  ChevronDown, ExternalLink, Activity, Sparkles, CheckCircle2, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onToggleSidebarHidden?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebarHidden }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/auditlogs/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
    } catch (e) {}
  };

  const markAsRead = async (id: number) => {
    try {
      await api.post(`/auditlogs/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const roleName = user?.roleName || (user?.role === 1 ? 'Admin' : user?.role === 2 ? 'ProjectManager' : 'Developer');
  const roleConsolePath = roleName === 'Admin' ? '/admin' : roleName === 'ProjectManager' ? '/manager' : '/dev';
  const roleConsoleLabel = roleName === 'Admin' ? 'Admin Governance' : roleName === 'ProjectManager' ? 'Manager Workbench' : 'Dev Workbench';

  return (
    <>
      <header className={`h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 border-b ${
        isDark 
          ? 'bg-[#0B1120]/80 border-slate-800' 
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Alliure Brand */}
          <Link to="/dashboard" className="flex items-center mr-1">
            <span className={`font-black tracking-widest text-base uppercase ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Alliure
            </span>
          </Link>

          {onToggleSidebarHidden && (
            <button
              onClick={onToggleSidebarHidden}
              className={`p-2 rounded-xl transition ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Toggle Navigation Menu"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Quick Breadcrumb indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
            <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>Workspace</span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>/</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
              roleName === 'Admin' 
                ? (isDark ? 'bg-sky-950/70 text-sky-400 border border-sky-800/60' : 'bg-sky-50 text-sky-700 border border-sky-200')
                : roleName === 'ProjectManager'
                ? (isDark ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                : (isDark ? 'bg-indigo-950/70 text-indigo-400 border border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border border-indigo-200')
            }`}>
              {roleName}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition ${
              isDark 
                ? 'bg-[#131D33] border-slate-700 text-amber-400 hover:bg-slate-800' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl border transition relative ${
                isDark 
                  ? 'bg-[#131D33] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
              }`}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
                    isDark ? 'bg-[#131D33] border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-sky-500" />
                      <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        System Alerts & Activity
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/30">
                    {notifications.length === 0 ? (
                      <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No current activity notifications.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3.5 transition cursor-pointer text-xs ${
                            !n.isRead 
                              ? (isDark ? 'bg-sky-950/20 hover:bg-sky-950/30' : 'bg-sky-50/50 hover:bg-sky-50')
                              : (isDark ? 'hover:bg-slate-800/50 opacity-70' : 'hover:bg-slate-50 opacity-70')
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {n.title}
                            </span>
                            <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className={`mt-1 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
                isDark 
                  ? 'bg-[#131D33] border-slate-700 text-white hover:border-slate-600' 
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                roleName === 'Admin' ? 'bg-sky-600' : roleName === 'ProjectManager' ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-none">{user?.fullName || 'User'}</div>
                <div className={`text-[10px] mt-0.5 leading-none font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {roleName}
                </div>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Profile Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl z-50 p-2 ${
                    isDark ? 'bg-[#131D33] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className={`p-3 border-b mb-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.fullName}</div>
                    <div className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.email}</div>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      isDark ? 'bg-slate-800 text-sky-400' : 'bg-slate-100 text-sky-700'
                    }`}>
                      {roleName}
                    </span>
                  </div>

                  <Link
                    to={roleConsolePath}
                    onClick={() => setShowProfileMenu(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {roleName === 'Admin' && <Shield size={14} />}
                    {roleName === 'ProjectManager' && <Briefcase size={14} />}
                    {roleName === 'Developer' && <Code size={14} />}
                    <span>{roleConsoleLabel}</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowChangePasswordModal(true);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Key size={14} className="text-sky-500" />
                    <span>Change Password</span>
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                      navigate('/login');
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 transition ${
                      isDark ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'
                    }`}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};
