import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, AlertCircle, Shield, Briefcase, Code, X, CheckCircle2 } from 'lucide-react';

type RoleType = 'Admin' | 'ProjectManager' | 'Developer';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleMeta = {
    Admin: {
      title: 'System Administration',
      desc: 'Supervise tenant telemetry, full audit logs & user governance.',
      icon: Shield,
      color: 'sky',
      demoEmail: 'admin@veridyn.com',
      demoPass: 'Admin@12345',
      target: '/admin'
    },
    ProjectManager: {
      title: 'Project Management',
      desc: 'Track sprint deliverables, unblock dependencies & invite developers.',
      icon: Briefcase,
      color: 'emerald',
      demoEmail: 'sarah.pm@veridyn.com',
      demoPass: 'Manager@12345',
      target: '/manager'
    },
    Developer: {
      title: 'Developer Workbench',
      desc: 'Verify assigned tasks, log hours & push code with automated Git telemetry.',
      icon: Code,
      color: 'indigo',
      demoEmail: 'alex.dev@veridyn.com',
      demoPass: 'Dev@12345',
      target: '/dev'
    }
  };

  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setError('');
    setEmail(roleMeta[role].demoEmail);
    setPassword(roleMeta[role].demoPass);
  };

  const handleClearRole = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem('alliure_user');
      const userObj = stored ? JSON.parse(stored) : {};
      const roleName = userObj.roleName;

      let target = '/dashboard';
      if (roleName === 'Admin') target = '/admin';
      else if (roleName === 'ProjectManager') target = '/manager';
      else if (roleName === 'Developer') target = '/dev';

      navigate(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Only authorized personnel may proceed.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic Theme Colors
  const themeBg = isDarkMode ? 'bg-[#0B1120]' : 'bg-[#FFFFFF]';
  const themeText = isDarkMode ? 'text-white' : 'text-[#111111]';
  const themeSubtext = isDarkMode ? 'text-slate-400' : 'text-gray-500';
  const themeCardBg = isDarkMode ? 'bg-[#131D33] border-slate-700/80' : 'bg-neutral-50/95 border-gray-200/90 shadow-2xl';
  const themeInputBg = isDarkMode ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm';
  const themePillInactive = isDarkMode ? 'bg-[#131D33] hover:bg-[#18233C] border-slate-700/80 text-white' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-800 shadow-sm';
  const themeSubmitBtn = isDarkMode ? 'bg-white hover:bg-slate-200 text-black' : 'bg-black hover:bg-neutral-800 text-white';

  return (
    <div className={`min-h-screen ${themeBg} ${themeText} font-['Inter',sans-serif] transition-colors duration-500 flex flex-col justify-between selection:bg-amber-200 selection:text-black overflow-x-hidden`}>
      
      {/* ── TOP NAVBAR ── */}
      <header className="w-full px-8 sm:px-12 py-7 flex justify-between items-center z-20">
        <button
          onClick={() => navigate('/')}
          className={`font-black tracking-widest uppercase text-xl transition-opacity hover:opacity-80 ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          Alliure
        </button>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-semibold tracking-wider uppercase hidden sm:inline ${themeSubtext}`}>
            {isDarkMode ? 'Dark' : 'Light'}
          </span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Toggle dark/light mode"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`w-12 h-6 rounded-full border relative transition-colors duration-300 p-0.5 cursor-pointer ${
              isDarkMode ? 'bg-black border-slate-700' : 'bg-gray-300 border-gray-400'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isDarkMode ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </header>

      {/* ── MAIN CONTAINER WITH FLUID MOTION ── */}
      <main className="max-w-6xl w-full mx-auto px-6 py-6 sm:py-10 flex-1 flex flex-col justify-center">
        
        <div className={`w-full grid items-center gap-10 lg:gap-14 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          selectedRole 
            ? 'grid-cols-1 lg:grid-cols-[1.15fr_1fr]' 
            : 'grid-cols-1 max-w-2xl mx-auto'
        }`}>

          {/* ── LEFT SECTION: HEADLINE & 3 ROLE BUTTONS ── */}
          <motion.div 
            layout
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col ${
              selectedRole ? 'text-left items-start' : 'text-center items-center'
            }`}
          >
            
            {/* Top Chip Badge */}
            <div className="mb-5">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                isDarkMode 
                  ? 'bg-[#131D33] border-slate-700/80 text-slate-300' 
                  : 'bg-neutral-100 border-gray-200 text-gray-700'
              }`}>
                <span className="font-bold">Enterprise Governance</span>
                <span className={themeSubtext}>Predictive Risk Engine</span>
                <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">
                  &rarr;
                </span>
              </div>
            </div>

            {/* Headline with Yellow Accent Loop */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-tight font-normal leading-tight relative inline-block mb-4">
              <span className="relative inline-block px-1">
                <span className="relative z-10 font-medium">Login</span>
                <svg 
                  className="absolute -inset-x-3 -inset-y-2 w-[125%] h-[135%] pointer-events-none text-amber-300 dark:text-amber-400/80 opacity-90 -rotate-2" 
                  viewBox="0 0 200 80" 
                  fill="none" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M12 40 C 25 10, 160 5, 185 25 C 205 42, 175 70, 110 72 C 30 75, 5 55, 20 35 C 30 20, 120 18, 175 30" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </span>
              {' '}to Your Account
            </h1>

            <p className={`text-sm sm:text-base font-normal max-w-lg mb-8 leading-relaxed ${themeSubtext}`}>
              Choose your authorized enterprise portal below to verify credentials and access your dashboard.
            </p>

            {/* 3 ROLE BUTTONS */}
            <div className="w-full space-y-3.5 max-w-lg">
              
              {/* Button 1: System Admin */}
              <button
                type="button"
                onClick={() => handleSelectRole('Admin')}
                className={`w-full px-6 py-4 rounded-full border text-sm font-semibold transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                  selectedRole === 'Admin'
                    ? (isDarkMode ? 'bg-sky-950 border-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-black text-white border-black shadow-lg shadow-black/15')
                    : themePillInactive
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'Admin'
                      ? 'bg-sky-400 text-black'
                      : (isDarkMode ? 'bg-sky-950 text-sky-400' : 'bg-sky-100 text-sky-700')
                  }`}>
                    <Shield size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Sign in as System Admin</div>
                    <div className={`text-[11px] font-normal ${selectedRole === 'Admin' ? 'text-slate-200' : themeSubtext}`}>
                      Tenant governance & full audit stream
                    </div>
                  </div>
                </div>
                <ArrowRight size={17} className={`transition-transform duration-300 ${selectedRole === 'Admin' ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>

              {/* Button 2: Project Manager */}
              <button
                type="button"
                onClick={() => handleSelectRole('ProjectManager')}
                className={`w-full px-6 py-4 rounded-full border text-sm font-semibold transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                  selectedRole === 'ProjectManager'
                    ? (isDarkMode ? 'bg-emerald-950 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-black text-white border-black shadow-lg shadow-black/15')
                    : themePillInactive
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'ProjectManager'
                      ? 'bg-emerald-400 text-black'
                      : (isDarkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                  }`}>
                    <Briefcase size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Sign in as Project Manager</div>
                    <div className={`text-[11px] font-normal ${selectedRole === 'ProjectManager' ? 'text-slate-200' : themeSubtext}`}>
                      Sprint velocity & developer coordination
                    </div>
                  </div>
                </div>
                <ArrowRight size={17} className={`transition-transform duration-300 ${selectedRole === 'ProjectManager' ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>

              {/* Button 3: Developer */}
              <button
                type="button"
                onClick={() => handleSelectRole('Developer')}
                className={`w-full px-6 py-4 rounded-full border text-sm font-semibold transition-all duration-300 flex items-center justify-between cursor-pointer group ${
                  selectedRole === 'Developer'
                    ? (isDarkMode ? 'bg-indigo-950 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black text-white border-black shadow-lg shadow-black/15')
                    : themePillInactive
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'Developer'
                      ? 'bg-indigo-400 text-black'
                      : (isDarkMode ? 'bg-indigo-950 text-indigo-400' : 'bg-indigo-100 text-indigo-700')
                  }`}>
                    <Code size={16} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Sign in as Developer</div>
                    <div className={`text-[11px] font-normal ${selectedRole === 'Developer' ? 'text-slate-200' : themeSubtext}`}>
                      Deliverables, worklogs & Git telemetry
                    </div>
                  </div>
                </div>
                <ArrowRight size={17} className={`transition-transform duration-300 ${selectedRole === 'Developer' ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>

            </div>

            {selectedRole && (
              <button
                type="button"
                onClick={handleClearRole}
                className={`mt-5 text-xs font-medium underline transition-opacity hover:opacity-70 ${themeSubtext}`}
              >
                &larr; Collapse credentials panel
              </button>
            )}

          </motion.div>

          {/* ── RIGHT SECTION: SLOW-MOTION FLOWING CREDENTIAL BOX ── */}
          <AnimatePresence mode="wait">
            {selectedRole && (
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, x: 90, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 70, scale: 0.97 }}
                transition={{
                  duration: 0.85,
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="w-full"
              >
                <div className={`border rounded-3xl p-7 sm:p-9 relative transition-colors ${themeCardBg}`}>
                  
                  {/* Clean Header with Close Button (No 'Authorized Access' text) */}
                  <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-800">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                        {roleMeta[selectedRole].title}
                      </h2>
                      <p className={`text-xs mt-1 ${themeSubtext}`}>
                        Please enter the authorized work email and password for this account.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearRole}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
                      title="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Error Banner */}
                  {error && (
                    <div className="mb-4 flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 px-4 py-3 rounded-2xl text-xs">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Flowing Input Form */}
                  <motion.form 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-slate-400">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={roleMeta[selectedRole].demoEmail}
                        className={`w-full px-5 py-3.5 rounded-full border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white ${themeInputBg}`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-gray-500 dark:text-slate-400">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full px-5 py-3.5 rounded-full border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white pr-12 ${themeInputBg}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-4 px-6 rounded-full font-semibold text-sm transition-all duration-200 flex items-center justify-between shadow-lg disabled:opacity-50 cursor-pointer mt-2 ${themeSubmitBtn}`}
                    >
                      <span>{loading ? 'Verifying Authorization…' : `Enter ${roleMeta[selectedRole].title}`}</span>
                      <ArrowRight size={17} />
                    </button>
                  </motion.form>

                  {/* Verification Notice */}
                  <div className="mt-5 pt-4 border-t border-dotted border-gray-200 dark:border-slate-800 flex items-center gap-2 text-[11px] text-gray-500 dark:text-slate-400">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <span>Only authenticated <strong>{selectedRole}</strong> credentials can access this portal.</span>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full px-8 sm:px-12 py-6 text-center">
        <button
          onClick={() => navigate('/')}
          className={`text-xs font-semibold tracking-wider uppercase transition hover:underline ${themeSubtext}`}
        >
          &larr; Back to Homepage
        </button>
      </footer>

    </div>
  );
};
