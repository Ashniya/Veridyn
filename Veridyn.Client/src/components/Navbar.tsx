import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, CheckCircle2, LogOut, ChevronDown, LayoutDashboard, FolderGit2, Shield, Briefcase, Code } from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
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

  const roleName = user?.roleName;
  const roleConsolePath = roleName === 'Admin' ? '/admin' : roleName === 'ProjectManager' ? '/manager' : '/dev';
  const roleConsoleLabel = roleName === 'Admin' ? 'Admin Console' : roleName === 'ProjectManager' ? 'Manager Console' : 'Dev Workbench';

  return (
    <header className="h-16 bg-[#0B1120] border-b border-dotted border-slate-700/80 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-black text-sm flex items-center justify-center shadow-md shadow-white/10 group-hover:scale-105 transition">
            A
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-[0.2em] uppercase">ALLIURE</span>
            <span className="hidden lg:inline-block ml-2 text-[10px] font-bold tracking-widest uppercase text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full">
              Risk Engine
            </span>
          </div>
        </Link>

        {/* Top Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs">
          <Link
            to="/dashboard"
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              location.pathname === '/dashboard' 
                ? 'bg-[#131D33] text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </Link>
          <Link
            to="/projects"
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              location.pathname === '/projects' 
                ? 'bg-[#131D33] text-white border border-slate-700' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Projects
          </Link>
          <Link
            to={roleConsolePath}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              location.pathname === roleConsolePath 
                ? 'bg-sky-950 text-sky-400 border border-sky-800' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {roleName === 'Admin' && <Shield size={12} />}
            {roleName === 'ProjectManager' && <Briefcase size={12} />}
            {roleName === 'Developer' && <Code size={12} />}
            <span>{roleConsoleLabel}</span>
          </Link>
        </nav>
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
            title="System Alerts"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#131D33] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-white">System Alerts</span>
                <span className="text-[10px] text-sky-400 font-semibold">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No active risk notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 text-xs transition cursor-pointer hover:bg-slate-800/80 ${!n.isRead ? 'bg-sky-950/20' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 4 || n.type === 3 ? (
                          <ShieldAlert size={15} className="text-rose-400 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 size={15} className="text-sky-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{n.title}</div>
                          <div className="text-slate-400 mt-0.5 leading-relaxed text-[11px]">{n.message}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3 pl-3 border-l border-dotted border-slate-700/80">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{user?.fullName}</div>
            <div className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">{roleName}</div>
          </div>
          <button 
            onClick={logout}
            title="Log out"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-xl transition ml-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
