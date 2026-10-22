import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Briefcase, UserPlus, FolderGit2, AlertTriangle, CheckSquare, 
  RefreshCw, GitPullRequest, Code, Clock, ArrowUpRight, Bell, Send, X, Check
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
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Sprint Governance & Engineering Velocity
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Welcome, <strong className={isDark ? 'text-white' : 'text-slate-900'}>{user?.fullName}</strong>. Supervise project deliveries, unblock stalled tasks, and invite developers to your projects.
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

      {/* ── 02: ACTIVE PROJECTS TABLE ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>02 — PROJECT REPOSITORY HEALTH</span>
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
