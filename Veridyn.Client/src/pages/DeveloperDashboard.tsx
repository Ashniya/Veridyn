import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Code, GitCommit, GitPullRequest, CheckSquare, Clock, 
  AlertCircle, ExternalLink, RefreshCw, Sparkles, Bell, Send, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementProjectId, setAnnouncementProjectId] = useState<number | ''>('');
  const [announcementText, setAnnouncementText] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects')
      ]);
      const myTasks = tasksRes.data.filter((t: any) => t.assigneeId === user?.id || t.assigneeName === user?.fullName);
      setTasks(myTasks.length > 0 ? myTasks : tasksRes.data.slice(0, 5));
      setProjects(projectsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch developer tasks", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      alert(err.response?.data?.message || 'Failed to post announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
          isDark ? 'border-slate-700 border-t-indigo-400' : 'border-slate-300 border-t-indigo-600'
        }`} />
        <span className={`text-xs font-bold tracking-[0.25em] uppercase ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Syncing Code Telemetry…
        </span>
      </div>
    );
  }

  const completedCount = tasks.filter(t => t.status === 2 || t.status === 'Completed').length;
  const inProgressCount = tasks.filter(t => t.status === 1 || t.status === 'InProgress').length;
  const avgEvidence = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + (t.progressEvidenceScore || 0), 0) / tasks.length) 
    : 0;

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
            Code Velocity & Task Execution
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Assigned tasks, commit synchronization, and objective evidence metrics for <strong className={isDark ? 'text-white' : 'text-slate-900'}>{user?.fullName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
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
            <span>+ Post Announcement</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchTasks}
            disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50 ${
              isDark 
                ? 'bg-[#131D33] border-slate-700 text-slate-300 hover:text-white' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Git Commits</span>
          </motion.button>
        </div>
      </div>

      {/* ── 01: DEVELOPER TELEMETRY METRIC GRID ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>01 — WORKBENCH TELEMETRY</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>01</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Assigned Work Units
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {tasks.length}
            </div>
            <div className="text-[11px] text-indigo-500 mt-2 font-medium">Active in Current Sprint</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>02</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              In Progress
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {inProgressCount}
            </div>
            <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Active Development Branch</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>03</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tasks Completed
            </div>
            <div className="text-3xl font-bold text-emerald-500 mt-1">
              {completedCount}
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-2 font-medium">Merged into Trunk</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>04</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              My Evidence Score
            </div>
            <div className="text-3xl font-bold text-sky-500 mt-1">
              {avgEvidence}%
            </div>
            <div className="text-[11px] text-sky-500/90 mt-2 font-medium">Corroborated by Commit Hashes</div>
          </div>
        </div>
      </div>

      {/* ── 02: ASSIGNED DELIVERABLES ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>02 — ACTIVE SPRINT DELIVERABLES</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-xl transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="divide-y divide-slate-800/60">
            {tasks.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No active tasks currently assigned to your developer profile.
              </div>
            ) : (
              tasks.map((task: any) => (
                <div key={task.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark 
                        ? 'text-indigo-400 bg-indigo-950/70 border-indigo-800/60' 
                        : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                    }`}>
                      {task.taskCode || `TSK-${task.id}`}
                    </span>
                    <div>
                      <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                      <div className={`text-xs mt-1 flex items-center gap-3 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'End of Sprint'}</span>
                        <span>•</span>
                        <span>Complexity: Level {task.complexity || 2}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reported</div>
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.progressPercentage}%</div>
                    </div>

                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Evidence</div>
                      <div className="text-sm font-bold text-sky-500">{Math.round(task.progressEvidenceScore || 0)}%</div>
                    </div>

                    <RiskBadge level={task.latestRiskLevel} />
                  </div>
                </div>
              ))
            )}
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
                  <h2 className="text-base font-bold">Post Project Announcement</h2>
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
                    placeholder="📢 Developer Update: Technical findings, pull request notices, or blockers resolved…"
                    className={`w-full p-3 font-mono rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 placeholder-slate-400'
                    }`}
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Broadcasting notifies your fellow developers, project manager, and administrators on this project.
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
                      announcementSuccess ? 'bg-indigo-600' : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
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
