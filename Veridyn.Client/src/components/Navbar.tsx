import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, ShieldAlert, CheckCircle2, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
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

  return (
    <header className="h-16 bg-[#131D33] border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
          V
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-tight">VERIDYN</span>
          <span className="hidden sm:inline-block ml-2 text-xs font-medium text-sky-400 bg-sky-950/60 border border-sky-800/60 px-2 py-0.5 rounded-full">
            Evidence-Based AI Risk Engine
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition relative"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#18233C] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-700/80 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">System Alerts & Notifications</span>
                <span className="text-xs text-sky-400">{unreadCount} unread</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">No recent notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs transition cursor-pointer hover:bg-slate-800/80 ${!n.isRead ? 'bg-sky-950/30' : ''}`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 4 || n.type === 3 ? (
                          <ShieldAlert size={16} className="text-amber-400 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle2 size={16} className="text-sky-400 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-slate-200">{n.title}</div>
                          <div className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-sky-400 font-semibold text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{user?.fullName}</div>
            <div className="text-[10px] text-sky-400 font-medium">{user?.roleName}</div>
          </div>
          <button 
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
