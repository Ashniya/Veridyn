import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import {
  Users, UserPlus, Shield, Briefcase, Code, FolderGit2,
  AlertTriangle, CheckSquare, Activity, RefreshCw, Cpu,
  Plus, GitBranch, ArrowRight, ExternalLink, Calendar, Clock, X,
  Trash2, Key, Copy, Check, CheckCircle2, Bell, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/** Returns a human-readable label + urgency for remaining time to a deadline */
function getTimeRemaining(targetEndDate: string | null | undefined): { label: string; urgent: boolean; overdue: boolean } {
  if (!targetEndDate) return { label: 'No deadline', urgent: false, overdue: false };
  const now = new Date();
  const deadline = new Date(targetEndDate);
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return { label: 'Overdue', urgent: true, overdue: true };
  const diffHrs = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffHrs / 24);
  const remHrs = Math.floor(diffHrs % 24);
  if (diffDays === 0) return { label: `${Math.floor(diffHrs)}h remaining`, urgent: true, overdue: false };
  if (diffDays === 1) return { label: `1d ${remHrs}h remaining`, urgent: true, overdue: false };
  return { label: `${diffDays}d ${remHrs}h remaining`, urgent: diffDays <= 3, overdue: false };
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick project create modal
  const [showCreateProj, setShowCreateProj] = useState(false);
  const [creatingProj, setCreatingProj] = useState(false);
  const [projForm, setProjForm] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    budgetHours: 120,
    targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  });

  // Credentials modal state (shown after reset password so admin can copy & share)
  const [credentialsModal, setCredentialsModal] = useState<{
    email: string;
    fullName: string;
    temporaryPassword: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Track which user is being deleted (to show loading spinner on that row)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementProjectId, setAnnouncementProjectId] = useState<number | ''>('');
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // ── DATA FETCHING ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [overviewRes, usersRes, projRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/auth/users'),
        api.get('/projects')
      ]);
      setOverview(overviewRes.data);
      setUsersList(usersRes.data);
      setProjectsList(projRes.data);
    } catch (err) {
      console.error('Failed to load admin telemetry', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── HANDLERS ──────────────────────────────────────────────────────────────

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProj(true);
    try {
      const res = await api.post('/projects', {
        name: projForm.name.trim(),
        description: projForm.description.trim(),
        repositoryUrl: projForm.repositoryUrl.trim(),
        budgetHours: Number(projForm.budgetHours),
        targetEndDate: new Date(projForm.targetEndDate),
        startDate: new Date()
      });
      setShowCreateProj(false);
      setProjForm({
        name: '',
        description: '',
        repositoryUrl: '',
        budgetHours: 120,
        targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      });
      if (res.data?.id) {
        navigate(`/projects/${res.data.id}`);
      } else {
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating project');
    } finally {
      setCreatingProj(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string, fullName: string) => {
    if (!confirm(
      `Are you sure you want to permanently remove "${fullName}" (${email}) from this website?\n\n` +
      `This will remove their login account, remove them from all projects, and unassign their deliverables.`
    )) return;
    setDeletingUserId(userId);
    try {
      await api.delete(`/auth/users/${userId}`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleResetPassword = async (userId: string, fullName: string, email: string) => {
    try {
      const res = await api.post(`/auth/users/${userId}/reset-password`);
      setCredentialsModal({
        email: res.data.recipientEmail || email,
        fullName,
        temporaryPassword: res.data.temporaryPassword
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleCopyCredentials = () => {
    if (!credentialsModal) return;
    const text =
      `Alliure Workspace Credentials\n` +
      `Email: ${credentialsModal.email}\n` +
      `Temporary Password: ${credentialsModal.temporaryPassword}\n` +
      `Login URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2000);
  };

  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementProjectId || !announcementText.trim()) return;
    setSendingAnnouncement(true);
    try {
      await api.put(`/projects/${announcementProjectId}/notes`, { content: announcementText.trim() });
      setAnnouncementSuccess(true);
      setTimeout(() => {
        setAnnouncementSuccess(false);
        setShowAnnouncementModal(false);
        setAnnouncementText('');
        setAnnouncementProjectId('');
      }, 1800);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to broadcast announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  // ── LOADING STATE ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
          isDark ? 'border-slate-700 border-t-white' : 'border-slate-300 border-t-slate-900'
        }`} />
        <span className={`text-xs font-bold tracking-[0.25em] uppercase ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Synthesizing System Telemetry…
        </span>
      </div>
    );
  }

  const adminCount = usersList.filter(u => u.role === 1 || u.role === 'Admin').length;
  const pmCount = usersList.filter(u => u.role === 2 || u.role === 'ProjectManager').length;
  const devCount = usersList.filter(u => u.role === 3 || u.role === 'Developer').length;

  return (
    <div className="space-y-10 max-w-7xl mx-auto font-['Inter',sans-serif]">

      {/* ── TOP ARCHITECTURAL HEADER ── */}
      <div className={`pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-dotted ${
        isDark ? 'border-slate-700/80' : 'border-slate-300'
      }`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            System Administration &amp; Access Control
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Central governance: manage software projects, provision engineers, allocate developers, and audit predictive risk telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchData}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50 ${
              isDark
                ? 'bg-[#131D33] border-slate-700 text-slate-300 hover:text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCreateProj(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition border ${
              isDark
                ? 'bg-[#131D33] border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Plus size={15} />
            <span>+ New Project</span>
          </motion.button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
                isDark
                  ? 'bg-white text-black hover:bg-slate-200 shadow-white/10'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
              }`}
            >
              <UserPlus size={15} />
              <span>+ Provision New User</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── 01: TELEMETRY METRIC GRID ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>01 — SYSTEM TELEMETRY</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark
              ? 'bg-[#131D33] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>01</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Active Users
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {usersList.length}
            </div>
            <div className="text-[11px] mt-2 flex items-center gap-2">
              <span className="text-sky-500 font-semibold">{adminCount} Admins</span> •{' '}
              <span className="text-emerald-500 font-semibold">{pmCount} PMs</span> •{' '}
              <span className="text-indigo-500 font-semibold">{devCount} Devs</span>
            </div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark
              ? 'bg-[#131D33] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>02</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Repositories
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {projectsList.length}
            </div>
            <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {overview?.totalTasks || 0} Total Work Units
            </div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark
              ? 'bg-[#131D33] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>03</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Critical Delay Risks
            </div>
            <div className="text-3xl font-bold text-amber-500 mt-1">
              {overview?.highRiskTasksCount || 0}
            </div>
            <div className="text-[11px] text-amber-500/90 mt-2 font-medium">
              {overview?.stalledTasksCount || 0} Potentially Stalled Tasks
            </div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark
              ? 'bg-[#131D33] border-slate-800 hover:border-slate-700'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>04</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Average Evidence Index
            </div>
            <div className="text-3xl font-bold text-emerald-500 mt-1">
              {Math.round(overview?.averageEvidenceScore || 0)}%
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-2 font-medium">
              Verified against Git &amp; Worklogs
            </div>
          </div>
        </div>
      </div>

      {/* ── 02: PROJECTS ROSTER & TEAM ALLOCATION ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-[11px] font-bold tracking-[0.25em] uppercase flex items-center gap-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>02 — COMPANY PROJECTS &amp; REPOSITORIES</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (projectsList.length > 0) setAnnouncementProjectId(projectsList[0].id);
                setShowAnnouncementModal(true);
              }}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition flex items-center gap-1"
            >
              <Bell size={13} />
              <span>+ Broadcast Announcement</span>
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => setShowCreateProj(true)}
              className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition"
            >
              + Create New Project
            </button>
            <span className="text-slate-600">•</span>
            <Link
              to="/projects"
              className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <span>View All Projects &rarr;</span>
            </Link>
          </div>
        </div>

        {projectsList.length === 0 ? (
          <div className={`p-8 text-center rounded-2xl border ${
            isDark ? 'bg-[#131D33] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            No projects created yet. Click <strong>+ New Project</strong> above to launch your first repository workspace.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projectsList.map((proj) => (
              <div
                key={proj.id}
                onClick={() => navigate(`/projects/${proj.id}`)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  isDark
                    ? 'bg-[#131D33] border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-sky-400 bg-sky-950/70 border-sky-800/60'
                        : 'text-sky-700 bg-sky-50 border-sky-200'
                    }`}>
                      {proj.key}
                    </span>
                    <RiskBadge level={proj.projectRiskLevel} />
                  </div>

                  <h3 className={`text-base font-bold group-hover:text-sky-500 transition-colors ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {proj.name}
                  </h3>

                  {proj.repositoryUrl && (
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-500 mt-1 truncate">
                      <GitBranch size={12} className="shrink-0" />
                      <span className="truncate">{proj.repositoryUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                    </div>
                  )}

                  <p className={`text-xs mt-3 line-clamp-3 leading-relaxed ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {proj.description || 'Enterprise deliverable managed under continuous evidence verification.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      <Users size={13} />
                      <strong>{proj.memberCount} Team Members</strong>
                    </span>
                    <span className="font-semibold text-emerald-500">
                      {Math.round(proj.overallEvidenceScore || 0)}% Git Evidence
                    </span>
                  </div>

                  {proj.targetEndDate && (() => {
                    const { label, urgent, overdue } = getTimeRemaining(proj.targetEndDate);
                    return (
                      <div className={`flex items-center gap-1.5 text-[11px] font-bold ${
                        overdue ? 'text-rose-500' : urgent ? 'text-amber-500' : isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Clock size={11} />
                        <span>{label}</span>
                      </div>
                    );
                  })()}

                  <div className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    isDark
                      ? 'bg-[#0B1120] border-slate-700 text-slate-300 group-hover:text-white group-hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 group-hover:bg-slate-100'
                  }`}>
                    <span>Open Project</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 03: USER DIRECTORY & ACCESS CONTROL TABLE ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`text-[11px] font-bold tracking-[0.25em] uppercase flex items-center gap-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>03 — USER ACCESS &amp; ROLE DIRECTORY</span>
          </div>
          <Link
            to="/register"
            className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition"
          >
            + Create Manager or Developer &rarr;
          </Link>
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-xl transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`uppercase tracking-wider text-[10px] border-b ${
                isDark ? 'bg-[#0B1120] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">System Role</th>
                  <th className="py-3.5 px-5">Job Title</th>
                  <th className="py-3.5 px-5">GitHub Handle</th>
                  <th className="py-3.5 px-5">Access Status</th>
                  <th className="py-3.5 px-5 text-right">Created</th>
                  <th className="py-3.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {usersList.map((u) => {
                  const roleStr = typeof u.role === 'string'
                    ? u.role
                    : (u.role === 1 ? 'Admin' : u.role === 2 ? 'ProjectManager' : 'Developer');
                  const isProtected = u.email === 'admin@alliure.com' || u.email === 'admin@veridyn.com';
                  const isDeleting = deletingUserId === u.id;

                  return (
                    <tr key={u.id} className={`transition ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                            roleStr === 'Admin' ? 'bg-sky-600' : roleStr === 'ProjectManager' ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}>
                            {u.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.fullName}</div>
                            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          roleStr === 'Admin'
                            ? isDark ? 'bg-sky-950 text-sky-400 border-sky-800/80' : 'bg-sky-50 text-sky-700 border-sky-200'
                            : roleStr === 'ProjectManager'
                            ? isDark ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isDark ? 'bg-indigo-950 text-indigo-400 border-indigo-800/80' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}>
                          {roleStr === 'Admin' && <Shield size={11} />}
                          {roleStr === 'ProjectManager' && <Briefcase size={11} />}
                          {roleStr === 'Developer' && <Code size={11} />}
                          <span>{roleStr === 'ProjectManager' ? 'Project Manager' : roleStr}</span>
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {u.jobTitle || 'Team Member'}
                      </td>
                      <td className="py-3.5 px-5">
                        {u.gitHubUsername ? (
                          <a
                            href={`https://github.com/${u.gitHubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:underline font-mono"
                          >
                            @{u.gitHubUsername}
                          </a>
                        ) : (
                          <span className={`italic ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Not Linked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 text-right font-mono ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-2">
                          {/* Reset / generate new password */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleResetPassword(u.id, u.fullName, u.email)}
                            title="Generate new password &amp; show credentials"
                            className={`p-1.5 rounded-lg transition ${
                              isDark
                                ? 'text-amber-400 hover:bg-amber-950/60'
                                : 'text-amber-600 hover:bg-amber-50'
                            }`}
                          >
                            <Key size={14} />
                          </motion.button>

                          {/* Delete user — hidden for protected admin account */}
                          {!isProtected && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteUser(u.id, u.email, u.fullName)}
                              title="Permanently remove this user"
                              disabled={isDeleting}
                              className={`p-1.5 rounded-lg transition ${
                                isDark
                                  ? 'text-rose-400 hover:bg-rose-950/60'
                                  : 'text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {isDeleting ? (
                                <RefreshCw size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 04: HIGH-RISK DISCREPANCY TASKS ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>04 — CRITICAL RISK RADAR (DISCREPANCY DETECTION)</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-xl transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800' : 'border-slate-100'
          }`}>
            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Tasks Flagged by Hybrid ML Engine
            </span>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Automatic Telemetry
            </span>
          </div>

          <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
            {(!overview?.recentHighRiskTasks || overview?.recentHighRiskTasks?.length === 0) ? (
              <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                All tracked software deliverables are currently within acceptable evidence variance thresholds.
              </div>
            ) : (
              overview?.recentHighRiskTasks?.map((task: any) => (
                <div key={task.id} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-sky-400 bg-sky-950/70 border-sky-800/60'
                        : 'text-sky-700 bg-sky-50 border-sky-200'
                    }`}>
                      {task.taskCode}
                    </span>
                    <div>
                      <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                      <div className={`text-xs mt-0.5 flex items-center gap-3 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>Project: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{task.projectName}</strong></span>
                        <span>Assignee: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{task.assigneeName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Reported Progress
                      </div>
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.progressPercentage}%</div>
                    </div>

                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Verified Evidence
                      </div>
                      <div className="text-sm font-bold text-emerald-500">{Math.round(task.progressEvidenceScore || 0)}%</div>
                    </div>

                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Delay Probability
                      </div>
                      <div className="text-sm font-bold text-rose-500">{Math.round(task.latestDelayProbability || 0)}%</div>
                    </div>

                    <RiskBadge level={task.latestRiskLevel} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE PROJECT MODAL ── */}
      <AnimatePresence>
        {showCreateProj && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl border p-6 sm:p-7 shadow-2xl ${
                isDark ? 'bg-[#131D33] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Create New Project</h2>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Launch a project workspace and link its GitHub repository.
                  </p>
                </div>
                <button onClick={() => setShowCreateProj(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={projForm.name}
                    onChange={e => setProjForm({ ...projForm, name: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                    placeholder="e.g. Distributed Payment Service"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    A short project code is generated automatically from the project title.
                  </p>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">Project Idea &amp; Scope Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={projForm.description}
                    onChange={e => setProjForm({ ...projForm, description: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none resize-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                    placeholder="Describe architectural objectives, technologies, and what developers will build…"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">GitHub Repository Link</label>
                  <input
                    type="url"
                    value={projForm.repositoryUrl}
                    onChange={e => setProjForm({ ...projForm, repositoryUrl: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl font-mono border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                    placeholder="https://github.com/your-org/your-repo"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Paste the repository URL. The system will link commits and PR pushes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">Budget Hours</label>
                    <input
                      type="number"
                      value={projForm.budgetHours}
                      onChange={e => setProjForm({ ...projForm, budgetHours: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">Target Date</label>
                    <input
                      type="date"
                      value={projForm.targetEndDate}
                      onChange={e => setProjForm({ ...projForm, targetEndDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateProj(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={creatingProj}
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white shadow-md shadow-sky-600/30"
                  >
                    {creatingProj ? 'Creating…' : 'Create Project'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BROADCAST ANNOUNCEMENT MODAL ── */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
                isDark ? 'bg-[#131D33] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-amber-400" />
                  <h2 className="text-base font-bold">Broadcast Project Announcement</h2>
                </div>
                <button onClick={() => setShowAnnouncementModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBroadcastAnnouncement} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">Select Project</label>
                  <select
                    required
                    value={announcementProjectId}
                    onChange={e => setAnnouncementProjectId(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="">-- Choose Project --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">Announcement Content</label>
                  <textarea
                    rows={6}
                    required
                    value={announcementText}
                    onChange={e => setAnnouncementText(e.target.value)}
                    placeholder="📢 Sprint Announcement: Sprint goals, architectural directives, or critical deadlines…"
                    className={`w-full p-3 font-mono rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 placeholder-slate-400'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Posting this announcement immediately sends an in-app notification to all team members assigned to the project.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={sendingAnnouncement || !announcementProjectId || !announcementText.trim()}
                    className={`px-5 py-2 rounded-xl font-bold text-white flex items-center gap-1.5 shadow-md ${
                      announcementSuccess ? 'bg-emerald-600' : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
                    }`}
                  >
                    {sendingAnnouncement ? (
                      'Broadcasting…'
                    ) : announcementSuccess ? (
                      <>
                        <Check size={14} />
                        <span>Delivered!</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Post Announcement</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREDENTIALS MODAL (shown after Reset Password) ── */}
      <AnimatePresence>
        {credentialsModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
                isDark ? 'bg-[#131D33] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <h2 className="text-base font-bold">Password Reset Complete</h2>
                  </div>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    A temporary password has been generated for <strong>{credentialsModal.fullName}</strong>.
                    {' '}Share these credentials securely — an email has also been dispatched.
                  </p>
                </div>
                <button
                  onClick={() => { setCredentialsModal(null); setCopiedCredentials(false); }}
                  className={`ml-4 shrink-0 p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Credentials box */}
              <div className={`rounded-xl border p-4 space-y-3 font-mono text-sm ${
                isDark ? 'bg-[#0B1120] border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Login Email
                  </div>
                  <div className={`font-semibold break-all ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                    {credentialsModal.email}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Temporary Password
                  </div>
                  <div className={`font-bold text-base tracking-widest select-all ${isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                    {credentialsModal.temporaryPassword}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Login URL
                  </div>
                  <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    http://localhost:3000/login
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyCredentials}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition ${
                    copiedCredentials
                      ? 'bg-emerald-600 text-white'
                      : isDark
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {copiedCredentials ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCredentials ? 'Copied!' : 'Copy Credentials'}
                </motion.button>
                <button
                  onClick={() => { setCredentialsModal(null); setCopiedCredentials(false); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                    isDark ? 'border-slate-600 text-slate-300 hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Close
                </button>
              </div>

              <p className={`text-[11px] mt-3 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                The user must change this password after their first login via Account Settings.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
