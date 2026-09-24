import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, UserPlus } from 'lucide-react';

export const AdminSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [github, setGitHub] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role: 'Admin',
          jobTitle,
          gitHubUsername: github,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register admin');
      }
      
      // Auto login after registration
      await login(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md">
        <div className="bg-[#131D33] border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-xl font-bold text-white mb-4">Admin Sign Up</h1>
          <p className="text-sm text-slate-400 mb-6">Create the initial administrator account.</p>
          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-rose-950/50 border border-rose-800/60 rounded-xl px-4 py-3 text-rose-400 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="Admin Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="admin@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title (optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="System Administrator"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">GitHub Username (optional)</label>
              <input
                type="text"
                value={github}
                onChange={e => setGitHub(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="githubUser"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition mt-4"
            >
              {loading ? 'Signing up…' : <><UserPlus size={16} /> Sign Up as Admin</>}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-slate-500 mt-4">
          <button onClick={() => navigate('/login')} className="text-sky-500 hover:text-sky-400 transition">
            Already have an account? Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
