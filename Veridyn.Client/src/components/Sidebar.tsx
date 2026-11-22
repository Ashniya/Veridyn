import React, { useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, FolderGit2, ShieldCheck,
  UserPlus, ChevronLeft, ChevronRight,
  Briefcase, LogOut, Code, Calendar, Plus, Menu,
  FolderPlus, ArrowRight
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
  const navigate = useNavigate();
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const closeTimeoutRef = useRef<any>(null);

  const role = user?.role;
  const roleName = user?.roleName;

  const isAdmin = role === 1 || roleName === 'Admin';
  const isPM = role === 2 || roleName === 'ProjectManager';
  const isDev = role === 3 || roleName === 'Developer';

  const generalItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
    { label: 'Projects', path: '/projects', icon: FolderGit2 },
  ];

  if (isAdmin) {
    generalItems.push({ label: 'Admin Governance', path: '/admin', icon: ShieldCheck });
  }
  if (isPM) {
    generalItems.push({ label: 'Manager Workbench', path: '/manager', icon: Briefcase });
  }
  if (isDev) {
    generalItems.push({ label: 'Dev Workbench', path: '/dev', icon: Code });
  }

  const toolItems: { label: string; path: string; icon: any }[] = [];
  if (isAdmin || isPM) {
    toolItems.push({ label: 'Provision User', path: '/register', icon: UserPlus });
  }

  if (isHidden) {
    return null;
  }

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const greetingText = isAdmin 
    ? "Welcome Administrator"
    : `Welcome, ${user?.fullName || roleName || 'User'}`;

  // Hover handlers for the '+' button and dropdown
  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setShowPlusMenu(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowPlusMenu(false);
    }, 200);
  };

  return (
    <div className="flex flex-col my-2.5 ml-2.5 shrink-0 z-40 select-none h-[calc(100vh-1.25rem)] max-h-[calc(100vh-1.25rem)] sticky top-2.5 overflow-hidden">
      {/* ── WHEN MINIMIZED: ALLIURE IS DISPLAYED ABOVE THE SIDEBAR (ENLARGED FONT SIZE) ── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="alliure-above-sidebar"
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pb-2 pt-0.5 flex items-center justify-center shrink-0 overflow-hidden"
          >
            <motion.span
              layoutId="alliure-brand-title"
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              className={`font-black tracking-[0.26em] uppercase text-xs sm:text-sm text-center ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              Alliure
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── THE SIDEBAR CONTAINER (WHITE IN LIGHT MODE, DARK IN DARK MODE) ── */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 240 : 72 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={`flex-1 h-full max-h-full rounded-2xl flex flex-col justify-between p-3.5 transition-colors duration-300 border relative overflow-hidden ${
          isDark 
            ? 'bg-[#0E131F] border-slate-800 text-slate-300 shadow-2xl' 
            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        {/* ── TOP SECTION: BRAND + ACTION BUTTON + GREETING + NAV ── */}
        <div className="space-y-3.5 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Header row: Toggle + Brand Title (ENLARGED FONT SIZE) */}
          <div className={`flex items-center pt-0.5 px-1 shrink-0 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            {isExpanded && (
              <motion.span
                layoutId="alliure-brand-title"
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                className={`font-black tracking-[0.25em] uppercase text-xl sm:text-2xl ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                Alliure
              </motion.span>
            )}

            {/* Clean circular toggle button */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200/80 shadow-xs'
              }`}
            >
              {isExpanded ? <ChevronLeft size={16} /> : <Menu size={16} />}
            </motion.button>
          </div>

          {/* ── KAGGLE-STYLE "+" BUTTON WITH HOVER DROPDOWN (ONLY FOR ADMIN & PM, HIDDEN FOR DEV) ── */}
          {!isDev && (
            <div 
              className="relative pt-1 shrink-0"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowPlusMenu(prev => !prev)}
                title="Quick Actions (+)"
                className={`w-full flex items-center transition-all shadow-sm ${
                  isExpanded
                    ? 'gap-2.5 px-4 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider'
                    : 'justify-center w-10 h-10 mx-auto rounded-full p-0'
                } ${
                  isDark
                    ? 'bg-white hover:bg-slate-100 text-slate-950 shadow-white/5'
                    : 'bg-[#1E232A] hover:bg-[#12161C] text-white shadow-slate-900/10'
                }`}
              >
                <Plus size={isExpanded ? 16 : 18} strokeWidth={2.5} className="shrink-0" />
                {isExpanded && <span className="truncate">Create</span>}
              </motion.button>

              {/* ── HOVER DROPDOWN MENU WITH 2 OPTIONS ── */}
              <AnimatePresence>
                {showPlusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute z-50 p-2 rounded-2xl border shadow-2xl ${
                      isExpanded 
                        ? 'left-0 right-0 top-full mt-2 w-full min-w-[220px]' 
                        : 'left-full top-0 ml-3 w-56'
                    } ${
                      isDark 
                        ? 'bg-[#131D33] border-slate-700 text-slate-200' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="space-y-1">
                      {/* Option 1: Create New Project */}
                      <button
                        onClick={() => {
                          setShowPlusMenu(false);
                          navigate('/projects');
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition ${
                          isDark 
                            ? 'hover:bg-slate-800 text-slate-200 hover:text-white' 
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
                          <FolderPlus size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">Create New Project</div>
                          <div className={`text-[10px] font-normal truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Launch workspace & git
                          </div>
                        </div>
                      </button>

                      {/* Option 2: Add New Member / Provisional User */}
                      <button
                        onClick={() => {
                          setShowPlusMenu(false);
                          navigate('/register');
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-xs font-semibold transition ${
                          isDark 
                            ? 'hover:bg-slate-800 text-slate-200 hover:text-white' 
                            : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                          <UserPlus size={15} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold truncate">Add New Member</div>
                          <div className={`text-[10px] font-normal truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Provision team access
                          </div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Greeting + Today's Date (visible when expanded) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`px-3 py-2 rounded-xl border overflow-hidden shrink-0 ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800/80'
                    : 'bg-slate-50/90 border-slate-200/80'
                }`}
              >
                <div className={`text-xs font-bold tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {greetingText}
                </div>
                <div className={`flex items-center gap-1.5 text-[11px] mt-0.5 font-medium ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Calendar size={12} className={isDark ? 'text-sky-400' : 'text-sky-600'} />
                  <span className="truncate">{todayFormatted}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Items (KAGGLE ACTIVE PILL HIGHLIGHT) */}
          <div className="space-y-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5">
            {/* General Section */}
            <div className="space-y-1">
              {isExpanded && (
                <div className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  General
                </div>
              )}
              {generalItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isExpanded ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-xs transition-all relative ${
                        isActive
                          ? isDark
                            ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-md shadow-black/20'
                            : 'bg-[#181C24] text-white font-semibold shadow-md shadow-black/10'
                          : isDark
                          ? 'text-slate-400 hover:text-white hover:bg-slate-800/40 font-medium'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium'
                      } ${!isExpanded ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          size={18} 
                          className={`shrink-0 transition-colors ${
                            isActive 
                              ? 'text-white' 
                              : isDark ? 'text-slate-400' : 'text-slate-600'
                          }`} 
                        />
                        {isExpanded && (
                          <span className="truncate font-medium">{item.label}</span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>

            {/* Tools Section */}
            {toolItems.length > 0 && (
              <div className="space-y-1">
                {isExpanded && (
                  <div className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase ${
                    isDark ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    Tools
                  </div>
                )}
                {toolItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={!isExpanded ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3.5 px-3.5 py-2.5 rounded-full text-xs transition-all relative ${
                          isActive
                            ? isDark
                              ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-md shadow-black/20'
                              : 'bg-[#181C24] text-white font-semibold shadow-md shadow-black/10'
                            : isDark
                            ? 'text-slate-400 hover:text-white hover:bg-slate-800/40 font-medium'
                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-medium'
                        } ${!isExpanded ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon 
                            size={18} 
                            className={`shrink-0 transition-colors ${
                              isActive 
                                ? 'text-white' 
                                : isDark ? 'text-slate-400' : 'text-slate-600'
                            }`} 
                          />
                          {isExpanded && (
                            <span className="truncate font-medium">{item.label}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── BOTTOM SECTION: LOGOUT PINNED AT BOTTOM ── */}
        <div className={`shrink-0 pt-3 mt-auto border-t ${
          isDark ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={logout}
            title="Log out"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
              isDark 
                ? 'text-slate-400 hover:text-white hover:bg-rose-500/20' 
                : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
            } ${!isExpanded ? 'justify-center px-0 w-10 h-10 mx-auto' : ''}`}
          >
            <LogOut size={16} className="shrink-0" />
            {isExpanded && <span>Log out</span>}
          </motion.button>
        </div>
      </motion.aside>
    </div>
  );
};
