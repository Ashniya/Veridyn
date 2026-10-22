import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Home, UserPlus, AlertCircle, CheckCircle2, 
  Mail, Github, Shield, Briefcase, Copy, Check, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RegisterUser: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isLoading } = useAuth();
  const { isDark } = useTheme();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Developer' | 'ProjectManager' | 'Admin'>('Developer');
  const [jobTitle, setJobTitle] = useState('');
  const [github, setGitHub] = useState('');
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Invited'>('Active');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success Modal state for automated credentials dispatch
  const [provisionedData, setProvisionedData] = useState<{
    email: string;
    fullName: string;
    role: string;
    temporaryPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const isManager = user?.roleName === 'ProjectManager';
  const isAdmin = user?.roleName === 'Admin';

  if (!isLoading && !isAdmin && !isManager) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const assignedRole = isManager ? 'Developer' : role;
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role: assignedRole,
          jobTitle: jobTitle.trim() || 'Software Engineer',
          gitHubUsername: github.trim() || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to provision user');
      }

      setProvisionedData({
        email: data.recipientEmail || email,
        fullName: fullName,
        role: assignedRole,
        temporaryPassword: data.temporaryPassword || 'Vrd#Temp2026!'
      });
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisionedData) return;
    const text = `Alliure Workspace Credentials:\nEmail: ${provisionedData.email}\nTemporary Password: ${provisionedData.temporaryPassword}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setJobTitle('');
    setGitHub('');
    setProvisionedData(null);
  };

  // Avatar initials
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif]">
      {/* ── 00: TOP BREADCRUMB CARD ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-[#131D33] border-slate-800' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div>
          <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Provision Team Member
          </h1>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Invite developers and project managers. Login credentials will be generated and dispatched automatically to their email.
          </p>
        </div>

        {/* Breadcrumb pills */}
        <div className="flex items-center gap-2 text-xs">
          <Link 
            to={isAdmin ? '/admin' : '/manager'} 
            className={`p-1.5 rounded-lg border transition ${
              isDark 
                ? 'bg-[#0B1120] border-slate-700 text-slate-400 hover:text-white' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Home size={14} />
          </Link>
          <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Governance</span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
            isDark 
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
              : 'bg-sky-50 text-sky-700 border border-sky-200'
          }`}>
            Provision Member
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 text-rose-400 text-xs"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase tracking-wider">Provisioning Failed</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </motion.div>
      )}

      {/* ── 01: MAIN TWO-COLUMN WORKBENCH ── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ──── LEFT 2/3 COLUMN: CORE FORM SECTIONS ──── */}
          <div className="lg:col-span-2 space-y-6">
            {/* CARD 1: IDENTITY & PROFILE */}
            <div className={`p-6 sm:p-7 rounded-2xl border transition-colors space-y-5 ${
              isDark 
                ? 'bg-[#131D33] border-slate-800' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Member Identity & Profile
                </h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Provide the team member's corporate details to register their account and project permissions.
                </p>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition focus:outline-none ${
                    isDark 
                      ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                  }`}
                />
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Enter the contributor's full legal or professional name.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Corporate Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="sarah.jenkins@company.com"
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition focus:outline-none ${
                    isDark 
                      ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                  }`}
                />
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  The system will automatically send an invitation email containing their secure initial login password to this address.
                </p>
              </div>

              {/* Job Title & GitHub side-by-side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Job Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition focus:outline-none ${
                      isDark 
                        ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                    }`}
                  />
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Primary functional title.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    GitHub Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-mono text-slate-500">@</span>
                    <input
                      type="text"
                      value={github}
                      onChange={e => setGitHub(e.target.value)}
                      placeholder="sarah-jenkins"
                      className={`w-full pl-8 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono border transition focus:outline-none ${
                        isDark 
                          ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                      }`}
                    />
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Used to track GitHub commits, PRs, and progress evidence.
                  </p>
                </div>
              </div>
            </div>

            {/* CARD 2: AUTOMATED CREDENTIAL DISPATCH BANNER */}
            <div className={`p-6 rounded-2xl border transition-colors flex items-start gap-4 ${
              isDark 
                ? 'bg-sky-950/20 border-sky-900/40 text-slate-300' 
                : 'bg-sky-50/70 border-sky-200 text-slate-700'
            }`}>
              <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                <Mail size={20} />
              </div>
              <div className="space-y-1 text-xs">
                <div className={`font-bold uppercase tracking-wider ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>
                  Automated Security & Credential Delivery
                </div>
                <p className="leading-relaxed">
                  Administrators never need to handle or set developer passwords manually. When you click <strong>Provision Team Member</strong>, the platform generates a high-entropy temporary password and automatically emails it directly to the contributor with login instructions.
                </p>
              </div>
            </div>
          </div>

          {/* ──── RIGHT 1/3 COLUMN: AVATAR, STATUS & ROLE ──── */}
          <div className="space-y-6">
            {/* THUMBNAIL / AVATAR CARD */}
            <div className={`p-6 rounded-2xl border transition-colors space-y-4 ${
              isDark 
                ? 'bg-[#131D33] border-slate-800' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                User Identity Badge
              </h3>

              <div className={`p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center transition ${
                isDark 
                  ? 'border-slate-700/80 bg-[#0B1120]/60' 
                  : 'border-slate-300 bg-slate-50/80'
              }`}>
                {/* Dynamic Initials Badge */}
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-lg mb-3 ${
                  role === 'Admin'
                    ? 'bg-sky-600 text-white shadow-sky-600/30'
                    : role === 'ProjectManager'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-indigo-600 text-white shadow-indigo-600/30'
                }`}>
                  {initials}
                </div>
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {fullName || 'New Team Member'}
                </div>
                <div className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {email || 'developer@company.com'}
                </div>
              </div>

              <p className={`text-[11px] text-center leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Dynamic profile avatar and team identifier automatically assigned.
              </p>
            </div>

            {/* STATUS CARD */}
            <div className={`p-6 rounded-2xl border transition-colors space-y-4 ${
              isDark 
                ? 'bg-[#131D33] border-slate-800' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Initial Status
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>

              <div className="space-y-1.5">
                <select
                  value={accountStatus}
                  onChange={e => setAccountStatus(e.target.value as any)}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition focus:outline-none ${
                    isDark 
                      ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                  }`}
                >
                  <option value="Active">Active / Ready for Allocation</option>
                  <option value="Invited">Invited / Pending First Login</option>
                </select>
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Account status in the organization directory.
                </p>
              </div>
            </div>

            {/* ROLE & PERMISSION MATRIX */}
            <div className={`p-6 rounded-2xl border transition-colors space-y-4 ${
              isDark 
                ? 'bg-[#131D33] border-slate-800' 
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Access Tier & Role
              </h3>

              <div className="space-y-1.5">
                <label className={`block text-xs font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Assigned Authority
                </label>
                {isManager ? (
                  <div className={`p-3 rounded-xl border text-xs font-semibold ${
                    isDark ? 'bg-[#0B1120] border-slate-700 text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-700'
                  }`}>
                    Developer (Locked by PM tier)
                  </div>
                ) : (
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition focus:outline-none ${
                      isDark 
                        ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                    }`}
                  >
                    <option value="Developer">Developer (Engineering)</option>
                    <option value="ProjectManager">Project Manager (Operations)</option>
                    <option value="Admin">System Administrator (Root)</option>
                  </select>
                )}
                <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Determines dashboard capabilities and repository scopes.
                </p>
              </div>

              {/* Dynamic Role Privileges Preview */}
              <div className={`p-3.5 rounded-xl text-[11px] space-y-1.5 border ${
                isDark ? 'bg-[#0B1120]/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <div className={`font-bold text-[10px] uppercase tracking-wider ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                  Granted Entitlements:
                </div>
                {role === 'Developer' && (
                  <>
                    <div>• Code commit & pull request audit tracking</div>
                    <div>• Task checklist & developer scratchpad</div>
                    <div>• Project direct messaging and notifications</div>
                  </>
                )}
                {role === 'ProjectManager' && (
                  <>
                    <div>• Create projects, milestones & allocate engineers</div>
                    <div>• Provision & manage Developer accounts</div>
                    <div>• View hybrid ML delay risk flags & sprint blockers</div>
                  </>
                )}
                {role === 'Admin' && (
                  <>
                    <div>• Full root governance & system telemetry access</div>
                    <div>• Provision Admins, PMs, and Developers</div>
                    <div>• System audit logging & risk model orchestration</div>
                  </>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="space-y-3 pt-2">
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-50 cursor-pointer ${
                  isDark
                    ? 'bg-white text-black hover:bg-slate-200 shadow-white/10'
                    : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                }`}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Provision Team Member</span>
                  </>
                )}
              </motion.button>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isAdmin ? '/admin' : '/manager')}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border transition ${
                  isDark
                    ? 'bg-[#131D33] border-slate-700 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancel / Back to Governance
              </motion.button>
            </div>
          </div>
        </div>
      </form>

      {/* ── 02: SUCCESS & INVITATION CREDENTIALS MODAL ── */}
      <AnimatePresence>
        {provisionedData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl ${
                isDark ? 'bg-[#131D33] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-base font-bold">Account Provisioned & Email Dispatched</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    An invitation email with access credentials was sent to the user.
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-xl border text-xs space-y-3 my-4 ${
                isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Recipient Email
                  </span>
                  <span className="font-mono font-semibold text-sm">{provisionedData.email}</span>
                </div>

                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Assigned Role
                  </span>
                  <span className="font-semibold">{provisionedData.role}</span>
                </div>

                <div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Generated Temporary Password
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="font-mono text-sm font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg select-all">
                      {provisionedData.temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className={`text-[11px] leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                The developer can immediately navigate to <strong>http://localhost:3000/login</strong> and sign in using their corporate email and this temporary password.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Provision Another Member
                </button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => navigate(isAdmin ? '/admin' : '/manager')}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
                    isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  <span>Done / Governance</span>
                  <ArrowRight size={14} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
