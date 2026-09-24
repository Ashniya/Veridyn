import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';

// Extract role from query params (if any)
const useRoleFromQuery = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get('role');
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Determine role from stored user data
      const stored = localStorage.getItem('alliure_user');
      const userObj = stored ? JSON.parse(stored) : {};
      const roleName = userObj.roleName;
      let target = '/dashboard';
      if (roleName === 'Admin') target = '/admin';
      else if (roleName === 'ProjectManager') target = '/manager';
      else if (roleName === 'Developer') target = '/dev';
      navigate(target);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex flex-col items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center shadow-xl shadow-sky-500/40 group-hover:scale-105 transition">
              <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">Alliure</div>
              <div className="text-xs text-slate-400 mt-0.5">Beyond Status.</div>
            </div>
          </button>
        </div>

        {/* Card */}

{/* Role selection buttons */}
<div className="flex justify-center gap-4 mb-6">
  <button onClick={() => navigate('/login?role=Admin')} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 transition">Admin</button>
  <button onClick={() => navigate('/login?role=ProjectManager')} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 transition">Project Manager</button>
  <button onClick={() => navigate('/login?role=Developer')} className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 transition">Developer</button>
</div>
<div className="bg-[#131D33] border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl px-4 py-3 text-rose-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-sky-600/30 transition mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} /> Sign In
                </span>
              )}
            </button>
          </form>
        </div>


        <p className="text-center text-xs text-slate-500 mt-4">
          <span>&larr; </span>
          <button onClick={() => navigate('/')} className="text-sky-500 hover:text-sky-400 transition">
            Back to homepage
          </button>
        </p>
        {/* Admin sign-up link */}
        <p className="text-center text-xs text-slate-400 mt-2">
          <button onClick={() => navigate('/admin-signup')} className="text-emerald-500 hover:text-emerald-400 transition font-medium">
            First time? Sign Up as Admin
          </button>
        </p>
      </div>
    </div>
  );
};
