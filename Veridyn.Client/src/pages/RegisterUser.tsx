import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, User, Briefcase, ShieldCheck } from 'lucide-react';

export const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Developer');
  const [jobTitle, setJobTitle] = useState('');
  const [github, setGitHub] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only admin may access this page
  if (!isLoading && (!user || user.roleName !== 'Admin')) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
          jobTitle,
          gitHubUsername: github,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to register user');
      }
      // after successful registration, redirect back to admin dashboard
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
          <h1 className="text-xl font-bold text-white mb-4">Create New User</h1>
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
                placeholder="John Doe"
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
                placeholder="you@company.com"
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 transition"
              >
                <option value="Admin">Admin</option>
                <option value="ProjectManager">Project Manager</option>
                <option value="Developer">Developer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Job Title (optional)</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full bg-[#0B1120] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
                placeholder="Software Engineer"
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
              className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-sky-600/30 transition"
            >
              {loading ? 'Creating…' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
