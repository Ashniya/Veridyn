import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { 
  FolderGit2, Plus, Users, Clock, Calendar, CheckSquare, 
  GitBranch, ExternalLink, RefreshCw, ArrowRight, X, Sparkles
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

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create Project Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    repositoryUrl: '',
    targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    budgetHours: 120
  });

  const isAdmin = user?.role === 1 || user?.roleName === 'Admin';
  const isPM = user?.role === 2 || user?.roleName === 'ProjectManager';
  const canCreate = isAdmin || isPM;

  const fetchProjects = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/projects', {
        name: form.name.trim(),
        description: form.description.trim(),
        repositoryUrl: form.repositoryUrl.trim(),
        budgetHours: Number(form.budgetHours),
        targetEndDate: new Date(form.targetEndDate),
        startDate: new Date()
      });

      setShowCreateModal(false);
      setForm({
        name: '',
        description: '',
        repositoryUrl: '',
        targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        budgetHours: 120
      });

      // Lead directly to that project area
      if (res.data?.id) {
        navigate(`/projects/${res.data.id}`);
      } else {
        fetchProjects();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-['Inter',sans-serif]">
      {/* ── TOP ARCHITECTURAL HEADER ── */}
      <div className={`pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-dotted ${
        isDark ? 'border-slate-700/80' : 'border-slate-300'
      }`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Software Projects Portfolio
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Select any project to enter its dedicated workspace, manage developers, and collaborate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchProjects}
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

          {canCreate && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreateModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
                isDark 
                  ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'
              }`}
            >
              <Plus size={15} />
              <span>+ Create Project</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── PROJECTS LIST ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-3 ${
            isDark ? 'border-slate-700 border-t-white' : 'border-slate-300 border-t-slate-900'
          }`} />
          <span className={`text-xs font-bold tracking-widest uppercase ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Loading Projects…
          </span>
        </div>
      ) : projects.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center min-h-[350px] ${
          isDark ? 'border-slate-800 bg-[#131D33]/40' : 'border-slate-300 bg-white'
        }`}>
          <FolderGit2 size={48} className="mb-4 opacity-40 text-slate-500" />
          <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            No Projects Yet
          </h2>
          <p className={`text-xs max-w-md mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            All fake sample data has been cleared. You have a clean slate! Create your first original project to start adding team members, connecting GitHub, and monitoring delivery progress.
          </p>
          {canCreate && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreateModal(true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-lg ${
                isDark ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              + Create Your First Project
            </motion.button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <motion.div
              key={proj.id}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/projects/${proj.id}`)}
              className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                isDark 
                  ? 'bg-[#131D33] border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30' 
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
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

                <h3 className={`text-lg font-bold group-hover:text-sky-500 transition-colors ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  {proj.name}
                </h3>

                {proj.repositoryUrl && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-sky-500 mt-1.5 truncate">
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
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Users size={13} className="text-slate-500" />
                      <strong>{proj.memberCount} members</strong>
                    </span>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                      {proj.completedTasks}/{proj.totalTasks} tasks
                    </span>
                  </div>

                  <span className="font-bold text-emerald-500">
                    {Math.round(proj.overallEvidenceScore || 0)}% Evidence
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
                  <span>Enter Project Workspace</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── CREATE PROJECT MODAL (Simplified: No Key, Just GitHub Link) ── */}
      <AnimatePresence>
        {showCreateModal && (
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
                    Initialize a tracked software project. You will immediately enter its workspace.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                {/* Project Name */}
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${
                      isDark 
                        ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                    }`}
                    placeholder="e.g. Distributed Core Payment System"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    A unique short project code is generated automatically from the name.
                  </p>
                </div>

                {/* Project Idea & Description */}
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">
                    Project Idea & Objectives <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition resize-none ${
                      isDark 
                        ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                    }`}
                    placeholder="Explain the project scope, technical stack, problem statement, and goals for developers…"
                  />
                </div>

                {/* GitHub Repository Link */}
                <div>
                  <label className="block font-bold mb-1 uppercase tracking-wider">
                    GitHub Repository Link
                  </label>
                  <input
                    type="url"
                    value={form.repositoryUrl}
                    onChange={e => setForm({ ...form, repositoryUrl: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl font-mono border focus:outline-none transition ${
                      isDark 
                        ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' 
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
                    }`}
                    placeholder="https://github.com/your-org/your-repo"
                  />
                  <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Paste the GitHub link. Alliure will automatically link it to monitor developers' commits and PRs.
                  </p>
                </div>

                {/* Schedule & Budget */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">Budget Hours</label>
                    <input
                      type="number"
                      value={form.budgetHours}
                      onChange={e => setForm({ ...form, budgetHours: Number(e.target.value) })}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${
                        isDark 
                          ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1 uppercase tracking-wider">Target Delivery Date</label>
                    <input
                      type="date"
                      value={form.targetEndDate}
                      onChange={e => setForm({ ...form, targetEndDate: e.target.value })}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${
                        isDark 
                          ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' 
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'
                      }`}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white shadow-lg shadow-sky-600/30 disabled:opacity-50"
                  >
                    {creating ? 'Creating…' : 'Create & Open Workspace'}
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
