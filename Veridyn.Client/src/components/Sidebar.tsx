import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FolderGit2, ShieldCheck,
  UserPlus, ChevronLeft, ChevronRight,
  Briefcase, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  isHidden?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggleExpand, isHidden = false }) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const role = user?.role;
  const roleName = user?.roleName;

  const isAdmin = role === 1 || roleName === 'Admin';
  const isPM = role === 2 || roleName === 'ProjectManager';
  const isDev = role === 3 || roleName === 'Developer';

  const navItems = [
    { label: 'Executive Radar', path: '/dashboard', icon: LayoutDashboard, category: 'DASHBOARDS' },
    { label: 'Projects', path: '/projects', icon: FolderGit2, category: 'DASHBOARDS' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin Governance', path: '/admin', icon: ShieldCheck, category: 'DASHBOARDS' });
  }
  if (isPM || isAdmin) {
    navItems.push({ label: 'Manager Workbench', path: '/manager', icon: Briefcase, category: 'DASHBOARDS' });
  }

  // App/Action Items
  const appItems = [];
  if (isAdmin || isPM) {
    appItems.push({ label: 'Provision User', path: '/register', icon: UserPlus, category: 'MANAGEMENT' });
  }

  if (isHidden) {
    return null;
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 250 : 78 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`relative shrink-0 flex flex-col justify-between border-r select-none transition-colors duration-300 z-30 ${
        isDark 
          ? 'bg-[#0B1120] border-slate-800 text-slate-300' 
          : 'bg-white border-slate-200 text-slate-600 shadow-sm'
      }`}
      style={{ minHeight: 'calc(100vh - 4rem)' }}
    >
      {/* ── TOP SECTION: EXPAND TOGGLE & NAVIGATION ── */}
      <div className="p-3 space-y-6">
        {/* Collapse / Expand Toggle Button & Brand Header */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          {isExpanded && (
            <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Alliure
            </span>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleExpand}
            title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            className={`p-1.5 rounded-lg border transition-all ${isExpanded ? '' : 'mx-auto'} ${
              isDark 
                ? 'bg-[#131D33] border-slate-700 text-slate-400 hover:text-white hover:border-slate-600' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </motion.button>
        </div>

        {/* Dashboards Section */}
        <div className="space-y-1">
          {isExpanded && (
            <div className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              DASHBOARDS
            </div>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={!isExpanded ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-white border border-sky-500/30 shadow-md shadow-sky-500/5'
                        : 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm'
                      : isDark
                      ? 'text-slate-400 hover:text-white hover:bg-[#131D33]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  } ${!isExpanded ? 'justify-center' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={`shrink-0 ${isActive ? (isDark ? 'text-sky-400' : 'text-sky-600') : ''}`} />
                    {isExpanded && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePill"
                        className={`absolute left-0 w-1 h-5 rounded-r-full ${isDark ? 'bg-sky-400' : 'bg-sky-600'}`}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Applications / Management Section */}
        {appItems.length > 0 && (
          <div className="space-y-1 pt-2">
            {isExpanded && (
              <div className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                MANAGEMENT
              </div>
            )}
            {appItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={!isExpanded ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                      isActive
                        ? isDark
                          ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-white border border-sky-500/30'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-[#131D33]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    } ${!isExpanded ? 'justify-center' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={18} className={`shrink-0 ${isActive ? (isDark ? 'text-sky-400' : 'text-sky-600') : ''}`} />
                      {isExpanded && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActivePill"
                          className={`absolute left-0 w-1 h-5 rounded-r-full ${isDark ? 'bg-sky-400' : 'bg-sky-600'}`}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* ── BOTTOM SECTION: LOGOUT ── */}
      <div className="p-3">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={logout}
          title="Logout"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            !isExpanded ? 'justify-center' : ''
          } ${
            isDark
              ? 'border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 hover:border-rose-800'
              : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700'
          }`}
        >
          <LogOut size={16} className="shrink-0" />
          {isExpanded && <span>Logout</span>}
        </motion.button>
      </div>
    </motion.aside>
  );
};
