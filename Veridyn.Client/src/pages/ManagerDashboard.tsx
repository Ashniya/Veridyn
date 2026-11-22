import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTimeBasedGreeting } from '../utils/greetings';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Briefcase, UserPlus, FolderGit2, AlertTriangle, CheckSquare, 
  RefreshCw, GitPullRequest, Code, Clock, ArrowUpRight, Bell, Send, X, Check,
  GitCommit, GitBranch, TrendingUp, TrendingDown, Zap, BarChart2,
  Shield, Users, Target, Link2, ExternalLink, CheckCircle2
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

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [globalCommits, setGlobalCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementProjectId, setAnnouncementProjectId] = useState<number | ''>('');
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

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

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [overviewRes, projectsRes, usersRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/projects'),
        api.get('/auth/users')
      ]);
      setOverview(overviewRes.data);
      setProjects(projectsRes.data);
      const devsOnly = usersRes.data.filter((u: any) => u.role === 3 || u.role === 'Developer');
      setDevelopers(devsOnly);
      // Fetch recent commits across all projects
      try {
        const commitRes = await api.get('/github/commits');
        setGlobalCommits((commitRes.data || []).slice(0, 30));
      } catch { /* ignore if no commits */ }
    } catch (err) {
      console.error("Failed to load manager dashboard data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
          isDark ? 'border-slate-700 border-t-emerald-400' : 'border-slate-300 border-t-emerald-600'
        }`} />
        <span className={`text-xs font-bold tracking-[0.25em] uppercase ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Synthesizing Project Telemetry…
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto font-['Inter',sans-serif]">
      {/* ── TOP ARCHITECTURAL HEADER ── */}
      <div className={`pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-dotted ${
        isDark ? 'border-slate-700/80' : 'border-slate-300'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isDark ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <Briefcase size={13} />
              <span>Project Manager Portal</span>
            </span>
          </div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {getTimeBasedGreeting()}, {user?.fullName || 'Project Manager'}
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Hello, <strong className={isDark ? 'text-white' : 'text-slate-900'}>{user?.fullName || 'Project Manager'}</strong>. As the Project Manager, you supervise project deliveries, unblock stalled tasks, and allocate engineers across your initiatives.
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
            onClick={() => {
              if (projects.length > 0) setAnnouncementProjectId(projects[0].id);
              setShowAnnouncementModal(true);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
              isDark
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400 hover:bg-amber-900/40'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Bell size={13} />
            <span>+ Broadcast Announcement</span>
          </motion.button>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/register"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
                isDark 
                  ? 'bg-emerald-400 text-black hover:bg-emerald-300 shadow-emerald-400/10' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              <UserPlus size={15} />
              <span>+ Provision Developer</span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── PM PORTFOLIO SUMMARY BANNER ── */}
      <div className={`p-5 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-sm ${
        isDark ? 'bg-[#121316] border-slate-800' : 'bg-white border-stone-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-black text-lg shadow-md">
            {user?.fullName?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.fullName || 'Project Manager'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Project Manager
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Managing <strong className={isDark ? 'text-white' : 'text-slate-900'}>{projects.length}</strong> active project{projects.length !== 1 ? 's' : ''} with <strong className={isDark ? 'text-white' : 'text-slate-900'}>{developers.length}</strong> assigned developer{developers.length !== 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold ${
            isDark ? 'border-slate-800 bg-[#16171b] text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Portfolio Active
          </span>
          {(overview?.highRiskTasksCount || 0) > 0 && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold ${
              isDark ? 'bg-rose-950/40 border-rose-800/60 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <AlertTriangle size={12} />
              {overview.highRiskTasksCount} High-Risk Tasks
            </span>
          )}
        </div>
      </div>

      {/* ── 01: SPRINT METRIC CARDS ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>01 — SPRINTS & EFFORT METRICS</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>01</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Assigned Developers
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {developers.length}
            </div>
            <div className="text-[11px] text-emerald-500 mt-2 font-medium">Ready for Task Allocation</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>02</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Managed Repositories
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {projects.length}
            </div>
            <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Linked with Git Webhooks</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>03</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Critical Sprints at Risk
            </div>
            <div className="text-3xl font-bold text-amber-500 mt-1">
              {overview?.highRiskTasksCount || 0}
            </div>
            <div className="text-[11px] text-amber-500/90 mt-2 font-medium">Delayed Predecessors</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>04</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Portfolio Evidence Score
            </div>
            <div className="text-3xl font-bold text-emerald-500 mt-1">
              {Math.round(overview?.averageEvidenceScore || 0)}%
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-2 font-medium">Verified Code Deliveries</div>
          </div>
        </div>
      </div>

      {/* ── 03: GITHUB ACTIVITY FEED ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>03 — LIVE GITHUB ACTIVITY FEED</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <span className="flex items-center gap-1 text-emerald-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            Live
          </span>
        </div>

        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#0D1527] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Header */}
          <div className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-gradient-to-r from-[#131D33] to-[#0D1527]' : 'border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
                <GitBranch size={16} className="text-white" />
              </div>
              <div>
                <h3 className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cross-Project Commit Stream</h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {globalCommits.length} commits synced across {projects.length} repositories
                </p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={fetchData}
              disabled={refreshing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </motion.button>
          </div>

          {/* Commit rows */}
          <div className="divide-y divide-slate-800/40 max-h-80 overflow-y-auto">
            {globalCommits.length === 0 ? (
              <div className={`px-5 py-8 text-center text-xs ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                <GitCommit size={24} className="mx-auto mb-2 opacity-40" />
                No commits synced yet. Open a project and click "Sync GitHub".
              </div>
            ) : globalCommits.map((c: any, i: number) => {
              const sha = (c.commitSha || c.sha || '').slice(0, 7);
              const msg = c.message || c.commitMessage || '';
              const author = c.authorName || 'Unknown';
              const taskCode = c.matchedTaskCode || c.taskCode || null;
              const dateStr = c.commitDate || c.committedAt || c.date || '';
              const diffMs = dateStr ? Date.now() - new Date(dateStr).getTime() : 0;
              const timeLabel = diffMs < 3600000 ? `${Math.floor(diffMs/60000)}m ago`
                : diffMs < 86400000 ? `${Math.floor(diffMs/3600000)}h ago`
                : `${Math.floor(diffMs/86400000)}d ago`;
              return (
                <motion.div
                  key={c.id || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-center gap-3 px-5 py-3 transition-all ${
                    isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <GitCommit size={12} className="text-sky-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold ${
                        isDark ? 'text-sky-400' : 'text-sky-600'
                      }`}>{sha}</span>
                      {taskCode && (
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                          isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          <Link2 size={8} /> {taskCode}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{msg}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{author}</div>
                    <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{timeLabel}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 04: PROJECT HEALTH MATRIX ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>04 — PROJECT HEALTH MATRIX</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className="space-y-3">
          {projects.map((proj) => {
            const progress = proj.overallProgressPercentage || 0;
            const evidence = proj.overallEvidenceScore || 0;
            const { label: timeLabel, urgent, overdue } = getTimeRemaining(proj.targetEndDate);
            const statusLabel = overdue ? 'Overdue' : urgent ? 'At Risk' : evidence > 60 && progress > 50 ? 'On Track' : 'Monitoring';
            const statusColor = overdue ? 'text-rose-400 bg-rose-950/40 border-rose-800/50'
              : urgent ? 'text-amber-400 bg-amber-950/40 border-amber-800/50'
              : evidence > 60 ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
              : 'text-sky-400 bg-sky-950/40 border-sky-800/50';
            return (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-[#131D33] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  {/* Project name */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800' : 'text-sky-700 bg-sky-50 border-sky-200'
                      }`}>{proj.key}</span>
                      <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {proj.name}
                      </span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {timeLabel}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Progress</span>
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{Math.round(progress)}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>

                  {/* Evidence bar */}
                  <div className="flex-1 min-w-[120px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Evidence</span>
                      <span className="text-[10px] font-bold text-emerald-400">{Math.round(evidence)}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${Math.min(evidence, 100)}%` }} />
                    </div>
                  </div>

                  {/* Risk + status */}
                  <div className="flex items-center gap-2 shrink-0">
                    <RiskBadge level={proj.projectRiskLevel} />
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  {/* Action */}
                  <Link
                    to={`/projects/${proj.id}`}
                    className={`flex items-center gap-1 text-xs font-semibold shrink-0 transition ${
                      isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-800'
                    }`}
                  >
                    Inspect <ArrowUpRight size={13} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 05: PM ACTION ITEMS ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>05 — PM ACTION ITEMS</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isDark ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>AI-Derived</span>
        </div>

        <div className={`p-5 rounded-2xl border space-y-3 ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Stalled tasks across all projects */}
          {(() => {
            const actions: { icon: any; color: string; text: string; link?: string }[] = [];
            projects.forEach(proj => {
              if ((proj.highRiskTasksCount || 0) > 0) {
                actions.push({ icon: AlertTriangle, color: 'text-rose-400', text: `${proj.name} has ${proj.highRiskTasksCount} high-risk tasks. Open project to review task-level risk assessments.`, link: `/projects/${proj.id}` });
              }
              if ((proj.overallEvidenceScore || 0) < 35 && (proj.totalTasks || 0) > 0) {
                actions.push({ icon: GitCommit, color: 'text-amber-400', text: `${proj.name} evidence score is ${Math.round(proj.overallEvidenceScore || 0)}%. Ensure developers commit with task codes (e.g. [${proj.key}-1]).`, link: `/projects/${proj.id}` });
              }
              const { overdue, urgent } = getTimeRemaining(proj.targetEndDate);
              if (overdue) {
                actions.push({ icon: Clock, color: 'text-rose-400', text: `${proj.name} is past its target delivery date. Escalate or revise the project timeline immediately.`, link: `/projects/${proj.id}` });
              } else if (urgent && (proj.overallProgressPercentage || 0) < 60) {
                actions.push({ icon: Target, color: 'text-amber-400', text: `${proj.name} deadline is near with only ${Math.round(proj.overallProgressPercentage || 0)}% progress. Consider scope reduction or resource addition.`, link: `/projects/${proj.id}` });
              }
            });
            if (developers.length === 0) {
              actions.push({ icon: Users, color: 'text-sky-400', text: 'No developers provisioned yet. Use the "+ Provision Developer" button to add team members.' });
            }
            if (globalCommits.length === 0 && projects.length > 0) {
              actions.push({ icon: GitBranch, color: 'text-sky-400', text: 'No GitHub commits synced yet. Open each project and click "Sync GitHub" or configure repository credentials.' });
            }
            if (actions.length === 0) {
              actions.push({ icon: CheckCircle2, color: 'text-emerald-400', text: 'All projects appear healthy. No critical action items at this time. Keep monitoring evidence scores and commit velocity.' });
            }
            return actions.slice(0, 8).map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                    isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Icon size={15} className={`${a.color} shrink-0 mt-0.5`} />
                  <p className={`text-xs leading-relaxed flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{a.text}</p>
                  {a.link && (
                    <Link to={a.link} className={`text-[10px] font-bold shrink-0 flex items-center gap-1 ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-800'}`}>
                      Go <ArrowUpRight size={11} />
                    </Link>
                  )}
                </motion.div>
              );
            });
          })()}
        </div>
      </div>

      {/* ── 06: ACTIVE PROJECTS TABLE (was 02) ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>06 — PROJECT REPOSITORY HEALTH</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
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
                  <th className="py-3.5 px-5">Project Name</th>
                  <th className="py-3.5 px-5">Key</th>
                  <th className="py-3.5 px-5">Target Delivery</th>
                  <th className="py-3.5 px-5">Time Remaining</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                {projects.map((proj) => (
                  <tr key={proj.id} className={`transition ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                  }`}>
                    <td className="py-3.5 px-5 font-semibold">
                      <div className={isDark ? 'text-white' : 'text-slate-900'}>{proj.name}</div>
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{proj.description || 'No description provided'}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-sky-500 font-bold">
                      {proj.key}
                    </td>
                    <td className={`py-3.5 px-5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {proj.targetEndDate ? new Date(proj.targetEndDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="py-3.5 px-5">
                      {(() => {
                        const { label, urgent, overdue } = getTimeRemaining(proj.targetEndDate);
                        return (
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                            overdue
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                              : urgent
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                              : isDark ? 'text-slate-300 border-slate-700 bg-slate-800/40' : 'text-slate-700 border-slate-200 bg-slate-50'
                          }`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        Active
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link 
                        to="/projects" 
                        className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
                    {projects.map(p => (
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
                    placeholder="📢 Sprint Announcement: Sprint objectives, deployment plans, or critical sprint deadlines…"
                    className={`w-full p-3 font-mono rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 placeholder-slate-400'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Posting this announcement delivers an instant notification to all developers assigned to the project.
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
                      announcementSuccess ? 'bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
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
    </div>
  );
};
