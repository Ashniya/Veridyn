import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bell, LogOut, Shield, Briefcase, Code, Menu, Sun, Moon,
  ChevronDown, Activity, Key, CalendarDays, ChevronLeft, ChevronRight,
  Clock, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { ChangePasswordModal } from './ChangePasswordModal';

interface NavbarProps {
  onToggleSidebarHidden?: () => void;
}

// ── Helper: calendar grid ──────────────────────────────────────────────────
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebarHidden }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showCalendar && projects.length === 0) {
      api.get('/projects').then(res => setProjects(res.data || [])).catch(() => {});
    }
  }, [showCalendar]);

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

  // Deadline helpers
  const deadlineProjects = projects.filter(p => p.targetEndDate);
  const deadlineDaysMap: Record<number, { name: string; urgent: boolean; overdue: boolean }[]> = {};
  deadlineProjects.forEach(p => {
    const d = new Date(p.targetEndDate);
    if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
      const day = d.getDate();
      if (!deadlineDaysMap[day]) deadlineDaysMap[day] = [];
      const diffMs = d.getTime() - now.getTime();
      const overdue = diffMs < 0;
      const urgent = !overdue && diffMs < 3 * 86400000;
      deadlineDaysMap[day].push({ name: p.name, urgent, overdue });
    }
  });

  const calGrid = buildCalendarGrid(calYear, calMonth);
  const todayDay = now.getDate();
  const isCurrentMonthYear = now.getFullYear() === calYear && now.getMonth() === calMonth;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Upcoming deadlines list (next 30 days)
  const upcomingDeadlines = deadlineProjects
    .filter(p => {
      const d = new Date(p.targetEndDate);
      const diffMs = d.getTime() - now.getTime();
      return diffMs > 0 && diffMs < 30 * 86400000;
    })
    .sort((a, b) => new Date(a.targetEndDate).getTime() - new Date(b.targetEndDate).getTime())
    .slice(0, 5);

  const overdueProjects = deadlineProjects.filter(p => new Date(p.targetEndDate).getTime() < now.getTime());

  // Shared button style
  const btnStyle = (active = false) =>
    `p-2.5 rounded-xl border transition ${
      isDark
        ? `bg-[#131D33] border-slate-700 hover:bg-slate-800 ${active ? 'text-sky-400 border-sky-700/50' : 'text-slate-300 hover:text-white'}`
        : `bg-white border-slate-200 hover:bg-slate-50 shadow-sm ${active ? 'text-sky-600 border-sky-300' : 'text-slate-600 hover:text-slate-900'}`
    }`;

  return (
    <>
      <header className={`h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 border-b ${
        isDark
          ? 'bg-[#0B1120]/80 border-slate-800'
          : 'bg-white/90 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className={isDark ? 'text-slate-400' : 'text-slate-400'}>Workspace</span>
            <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>/</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              roleName === 'Admin'
                ? (isDark ? 'bg-sky-950/70 text-sky-400 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-200')
                : roleName === 'ProjectManager'
                ? (isDark ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                : (isDark ? 'bg-indigo-950/70 text-indigo-400 border-indigo-800/60' : 'bg-indigo-50 text-indigo-700 border-indigo-200')
            }`}>
              {roleName === 'ProjectManager' ? 'Project Manager' : roleName}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={btnStyle()}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* ── CALENDAR BUTTON ── */}
          <div className="relative">
            <button
              onClick={() => { setShowCalendar(v => !v); setShowNotifications(false); setShowProfileMenu(false); }}
              className={btnStyle(showCalendar)}
              title="Project Deadlines Calendar"
            >
              <CalendarDays size={16} />
            </button>

            <AnimatePresence>
              {showCalendar && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 mt-2 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${
                    isDark ? 'bg-[#131D33] border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Calendar Header */}
                  <div className={`px-5 pt-5 pb-3 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button onClick={prevMonth} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <ChevronLeft size={15} />
                    </button>
                    <div className="text-center">
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {MONTH_NAMES[calMonth]} {calYear}
                      </div>
                    </div>
                    <button onClick={nextMonth} className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                      <ChevronRight size={15} />
                    </button>
                  </div>

                  {/* Day labels */}
                  <div className="px-4 pt-3">
                    <div className="grid grid-cols-7 mb-1">
                      {DAY_LABELS.map(d => (
                        <div key={d} className={`text-center text-[10px] font-bold uppercase tracking-wide py-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {d}
                        </div>
                      ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-y-0.5 pb-3">
                      {calGrid.map((day, i) => {
                        const deadlines = day ? (deadlineDaysMap[day] || []) : [];
                        const isToday = isCurrentMonthYear && day === todayDay;
                        const hasOverdue = deadlines.some(d => d.overdue);
                        const hasUrgent = deadlines.some(d => d.urgent);
                        const hasDeadline = deadlines.length > 0;

                        return (
                          <div
                            key={i}
                            className={`relative flex flex-col items-center justify-center h-9 rounded-xl text-xs font-medium transition-all ${
                              !day ? '' :
                              isToday
                                ? isDark ? 'bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25' : 'bg-slate-900 text-white font-bold'
                                : hasDeadline
                                ? isDark
                                  ? hasOverdue ? 'bg-rose-950/60 text-rose-300 ring-1 ring-rose-800 cursor-default' 
                                    : hasUrgent ? 'bg-amber-950/50 text-amber-300 ring-1 ring-amber-800 cursor-default'
                                    : 'bg-emerald-950/50 text-emerald-300 ring-1 ring-emerald-800 cursor-default'
                                  : hasOverdue ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 cursor-default'
                                    : hasUrgent ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 cursor-default'
                                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 cursor-default'
                                : isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title={deadlines.map(d => d.name).join(', ')}
                          >
                            {day || ''}
                            {hasDeadline && (
                              <span className={`absolute bottom-1 w-1 h-1 rounded-full ${
                                hasOverdue ? 'bg-rose-500' : hasUrgent ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className={`px-5 py-2 flex items-center gap-4 border-t text-[10px] font-semibold ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> On Track</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Urgent (&lt;3d)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Overdue</span>
                  </div>

                  {/* Upcoming deadlines */}
                  {(upcomingDeadlines.length > 0 || overdueProjects.length > 0) && (
                    <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div className={`px-5 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Upcoming Deadlines
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/20 pb-2">
                        {overdueProjects.slice(0, 2).map(p => (
                          <div key={p.id} className="px-5 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <AlertTriangle size={12} className="text-rose-500 shrink-0" />
                              <span className={`text-xs font-semibold truncate ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>{p.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-500 whitespace-nowrap">Overdue</span>
                          </div>
                        ))}
                        {upcomingDeadlines.map(p => {
                          const d = new Date(p.targetEndDate);
                          const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000);
                          return (
                            <div key={p.id} className="px-5 py-2.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock size={12} className={`shrink-0 ${diffDays <= 3 ? 'text-amber-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                                <span className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{p.name}</span>
                              </div>
                              <span className={`text-[10px] font-bold whitespace-nowrap ${diffDays <= 3 ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {diffDays === 1 ? '1 day' : `${diffDays}d`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {upcomingDeadlines.length === 0 && overdueProjects.length === 0 && (
                    <div className={`px-5 py-4 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      No upcoming deadlines in the next 30 days.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notification Center */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(v => !v); setShowCalendar(false); setShowProfileMenu(false); }}
              className={`${btnStyle(false)} relative`}
              title="Notifications"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

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
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</span>
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

          {/* User Profile Pill */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => { setShowProfileMenu(v => !v); setShowCalendar(false); setShowNotifications(false); }}
              className={`flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all ${
                isDark
                  ? 'bg-[#131D33] border-slate-700 text-white hover:border-slate-600'
                  : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50 shadow-sm'
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
                  {roleName === 'ProjectManager' ? 'Project Manager' : roleName}
                </div>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
            </motion.button>

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
                      {roleName === 'ProjectManager' ? 'Project Manager' : roleName}
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
                    onClick={() => { setShowProfileMenu(false); setShowChangePasswordModal(true); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isDark ? 'hover:bg-slate-800 text-slate-300 hover:text-white' : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Key size={14} className="text-sky-500" />
                    <span>Change Password</span>
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setShowProfileMenu(false); logout(); navigate('/login'); }}
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

      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};
