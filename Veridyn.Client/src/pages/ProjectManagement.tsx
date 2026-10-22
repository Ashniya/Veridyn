import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import {
  FolderGit2, Users, UserPlus, UserMinus, RefreshCw, Plus,
  ChevronRight, ChevronLeft, Clock, Calendar, GitBranch,
  CheckSquare, AlertTriangle, BarChart2, Search, X,
  Layers, Code, Briefcase, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
interface ProjectSummary {
  id: number;
  name: string;
  key: string;
  description: string;
  targetEndDate: string;
  budgetHours: number;
  isActive: boolean;
  totalTasks: number;
  completedTasks: number;
  highRiskTasksCount: number;
  overallProgressPercentage: number;
  overallEvidenceScore: number;
  memberCount: number;
  projectRiskLevel: string;
  gitHubRepoOwner?: string;
  gitHubRepoName?: string;
}

interface ProjectMember {
  id: number;
  userId: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  roleInProject: string | number;
  joinedAt: string;
}

interface ProjectDetail extends ProjectSummary {
  members: ProjectMember[];
  tasks: TaskSummary[];
}

interface TaskSummary {
  id: number;
  taskCode: string;
  title: string;
  assigneeName?: string;
  status: string | number;
  progressPercentage: number;
  progressEvidenceScore: number;
  latestRiskLevel?: string;
  latestDelayProbability?: number;
  dueDate?: string;
}

interface AllUser {
  id: string;
  fullName: string;
  email: string;
  jobTitle?: string;
  role: string | number;
  roleName?: string;
}

/* ─────────────────────────────────────────────
   Helper
───────────────────────────────────────────── */
const roleLabel = (role: string | number) => {
  if (role === 'Admin' || role === 1) return 'Admin';
  if (role === 'ProjectManager' || role === 2) return 'Project Manager';
  return 'Developer';
};

const roleIcon = (role: string | number) => {
  if (role === 'Admin' || role === 1) return <Shield size={12} />;
  if (role === 'ProjectManager' || role === 2) return <Briefcase size={12} />;
  return <Code size={12} />;
};

const taskStatusLabel = (s: string | number) => {
  if (s === 0 || s === 'NotStarted') return 'Not Started';
  if (s === 1 || s === 'InProgress') return 'In Progress';
  if (s === 2 || s === 'Completed') return 'Completed';
  if (s === 3 || s === 'Blocked') return 'Blocked';
  return String(s);
};

/* ─────────────────────────────────────────────
   Stat mini-card
───────────────────────────────────────────── */
const StatCard: React.FC<{ label: string; value: string | number; sub?: string; isDark: boolean }> = ({ label, value, sub, isDark }) => (
  <div className={`rounded-xl border p-4 ${isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</div>
    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    {sub && <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export const ProjectManagement: React.FC = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [allUsers, setAllUsers] = useState<AllUser[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /* Add-member panel */
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  /* Create project modal */
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '',
    budgetHours: 80,
    targetEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    repositoryUrl: ''
  });

  const isAdmin = user?.roleName === 'Admin' || user?.role === 1;
  const isPM = user?.roleName === 'ProjectManager' || user?.role === 2;
  const canManage = isAdmin || isPM;

  /* ── Fetch all projects + users ── */
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/auth/users'),
      ]);
      setProjects(projRes.data);
      setAllUsers(usersRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Fetch single project detail ── */
  const openProject = async (id: number) => {
    setDetailLoading(true);
    setSelectedProject(null);
    try {
      const res = await api.get(`/projects/${id}`);
      setSelectedProject(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── Add member ── */
  const addMember = async (userId: string) => {
    if (!selectedProject) return;
    setAddingUserId(userId);
    try {
      await api.post(`/projects/${selectedProject.id}/members`, {
        userId,
        roleInProject: 3 // Developer by default
      });
      await openProject(selectedProject.id);
      await fetchAll();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Could not add member');
    } finally {
      setAddingUserId(null);
    }
  };

  /* ── Remove member ── */
  const removeMember = async (userId: string) => {
    if (!selectedProject) return;
    if (!confirm('Remove this team member from the project?')) return;
    setRemovingId(userId);
    try {
      await api.delete(`/projects/${selectedProject.id}/members/${userId}`);
      await openProject(selectedProject.id);
      await fetchAll();
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingId(null);
    }
  };

  /* ── Create project ── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/projects', {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        repositoryUrl: createForm.repositoryUrl.trim(),
        budgetHours: Number(createForm.budgetHours) || 80,
        targetEndDate: new Date(createForm.targetEndDate),
        startDate: new Date()
      });
      setShowCreate(false);
      setCreateForm({
        name: '', description: '', budgetHours: 80,
        targetEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        repositoryUrl: ''
      });
      await fetchAll();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Error creating project');
    } finally {
      setCreating(false);
    }
  };

  /* ── Derived: users NOT already in selected project ── */
  const memberUserIds = new Set(selectedProject?.members?.map(m => m.userId) ?? []);
  const eligibleToAdd = allUsers.filter(u =>
    !memberUserIds.has(u.id) &&
    (u.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${isDark ? 'border-slate-700 border-t-white' : 'border-slate-300 border-t-slate-900'}`} />
        <span className={`text-xs font-bold tracking-[0.25em] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Loading project roster…
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-['Inter',sans-serif]">

      {/* ── PAGE HEADER ── */}
      <div className={`pb-6 border-b border-dotted flex flex-col md:flex-row md:items-end justify-between gap-4 ${isDark ? 'border-slate-700/80' : 'border-slate-300'}`}>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Project Roster & Team Allocation
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            View all company projects, inspect deliverables, and assign team members per repository.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            onClick={fetchAll} disabled={refreshing}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50 ${isDark ? 'bg-[#131D33] border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'}`}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </motion.button>
          {canManage && (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreate(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${isDark ? 'bg-white text-black hover:bg-slate-200 shadow-white/10' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10'}`}
            >
              <Plus size={15} />
              New Project
            </motion.button>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN LAYOUT: Project list (left) + Detail panel (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT: PROJECT LIST ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className={`text-[10px] font-bold uppercase tracking-[0.2em] pb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {projects.length} Projects
          </div>

          {projects.map(proj => (
            <motion.button
              key={proj.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => openProject(proj.id)}
              className={`w-full text-left rounded-2xl border p-4 transition-all ${
                selectedProject?.id === proj.id
                  ? isDark
                    ? 'bg-[#131D33] border-slate-600 shadow-lg shadow-slate-900'
                    : 'bg-white border-slate-400 shadow-md'
                  : isDark
                    ? 'bg-[#0B1120] border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800/50' : 'text-sky-700 bg-sky-50 border-sky-200'}`}>
                      {proj.key}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      proj.isActive
                        ? isDark ? 'text-slate-300 border-slate-700 bg-slate-800' : 'text-slate-600 border-slate-300 bg-slate-100'
                        : isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
                    }`}>
                      {proj.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>
                  <div className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{proj.name}</div>
                  <div className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{proj.description || 'No description'}</div>
                </div>
                <ChevronRight size={16} className={`shrink-0 mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              </div>

              {/* Mini stats row */}
              <div className={`mt-3 pt-3 border-t flex items-center gap-4 text-[11px] ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {proj.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare size={11} />
                  {proj.completedTasks}/{proj.totalTasks} tasks
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 size={11} />
                  {Math.round(proj.overallProgressPercentage)}%
                </span>
              </div>
            </motion.button>
          ))}

          {projects.length === 0 && (
            <div className={`text-center py-12 text-sm rounded-2xl border ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              No projects found. Create one to get started.
            </div>
          )}
        </div>

        {/* ── RIGHT: PROJECT DETAIL PANEL ── */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {detailLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-[300px]"
              >
                <div className={`w-8 h-8 border-2 rounded-full animate-spin ${isDark ? 'border-slate-700 border-t-white' : 'border-slate-300 border-t-slate-900'}`} />
              </motion.div>
            )}

            {!detailLoading && !selectedProject && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex flex-col items-center justify-center min-h-[300px] rounded-2xl border border-dashed ${isDark ? 'border-slate-800 text-slate-600' : 'border-slate-300 text-slate-400'}`}
              >
                <FolderGit2 size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a project to inspect its team & tasks</p>
              </motion.div>
            )}

            {!detailLoading && selectedProject && (
              <motion.div
                key={selectedProject.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* ─ Detail Header ─ */}
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800/50' : 'text-sky-700 bg-sky-50 border-sky-200'}`}>
                          {selectedProject.key}
                        </span>
                        {selectedProject.gitHubRepoName && (
                          <span className={`text-[10px] flex items-center gap-1 font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            <GitBranch size={11} />
                            {selectedProject.gitHubRepoOwner}/{selectedProject.gitHubRepoName}
                          </span>
                        )}
                      </div>
                      <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedProject.name}
                      </h2>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {selectedProject.description || 'No description provided.'}
                      </p>
                    </div>
                    <button onClick={() => setSelectedProject(null)}
                      className={`p-1.5 rounded-lg border transition ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Project metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <StatCard isDark={isDark} label="Members" value={selectedProject.memberCount} />
                    <StatCard isDark={isDark} label="Tasks" value={`${selectedProject.completedTasks}/${selectedProject.totalTasks}`} sub="completed" />
                    <StatCard isDark={isDark} label="Progress" value={`${Math.round(selectedProject.overallProgressPercentage)}%`} sub="reported" />
                    <StatCard isDark={isDark} label="Evidence" value={`${Math.round(selectedProject.overallEvidenceScore)}%`} sub="verified" />
                  </div>

                  <div className={`flex flex-wrap gap-4 mt-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Target: {selectedProject.targetEndDate ? new Date(selectedProject.targetEndDate).toLocaleDateString() : 'TBD'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Budget: {selectedProject.budgetHours}h
                    </span>
                    {selectedProject.highRiskTasksCount > 0 && (
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <AlertTriangle size={12} /> {selectedProject.highRiskTasksCount} at-risk tasks
                      </span>
                    )}
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <Link
                      to={`/projects/${selectedProject.id}`}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                        isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Open Project Workspace, Notion & Chat &rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* ─ TEAM MEMBERS section ─ */}
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-[#0B1120]/60' : 'border-slate-100 bg-slate-50'}`}>
                    <div>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Team Members</span>
                      <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                        {selectedProject.members?.length ?? 0}
                      </span>
                    </div>
                    {canManage && (
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                        onClick={() => { setShowAddMember(v => !v); setMemberSearch(''); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                          showAddMember
                            ? isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-200 border-slate-300 text-slate-900'
                            : isDark ? 'bg-[#131D33] border-slate-700 text-slate-300 hover:text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <UserPlus size={13} />
                        {showAddMember ? 'Cancel' : 'Add Member'}
                      </motion.button>
                    )}
                  </div>

                  {/* ─ Add member search pane ─ */}
                  <AnimatePresence>
                    {showAddMember && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`overflow-hidden border-b ${isDark ? 'border-slate-800 bg-[#0B1120]/40' : 'border-slate-100 bg-slate-50/60'}`}
                      >
                        <div className="p-4 space-y-3">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isDark ? 'bg-[#0B1120] border-slate-700' : 'bg-white border-slate-200'}`}>
                            <Search size={14} className="shrink-0 text-slate-400" />
                            <input
                              autoFocus
                              value={memberSearch}
                              onChange={e => setMemberSearch(e.target.value)}
                              placeholder="Search by name or email…"
                              className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white placeholder-slate-600' : 'text-slate-900 placeholder-slate-400'}`}
                            />
                          </div>
                          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                            {eligibleToAdd.length === 0 ? (
                              <div className={`text-center py-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {memberSearch ? 'No users match your search.' : 'All registered users are already members.'}
                              </div>
                            ) : (
                              eligibleToAdd.map(u => (
                                <div key={u.id}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition ${isDark ? 'border-slate-800 hover:border-slate-700 bg-[#0B1120]' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${u.role === 1 || u.role === 'Admin' ? 'bg-sky-700' : u.role === 2 || u.role === 'ProjectManager' ? 'bg-emerald-700' : 'bg-indigo-700'}`}>
                                      {u.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.fullName}</div>
                                      <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{u.jobTitle || roleLabel(u.role)}</div>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => addMember(u.id)}
                                    disabled={addingUserId === u.id}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition disabled:opacity-50 ${isDark ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                  >
                                    {addingUserId === u.id ? '…' : '+ Add'}
                                  </motion.button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ─ Existing member rows ─ */}
                  <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                    {(!selectedProject.members || selectedProject.members.length === 0) ? (
                      <div className={`p-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No team members assigned yet.
                      </div>
                    ) : (
                      selectedProject.members.map(member => (
                        <div key={member.id}
                          className={`px-5 py-3.5 flex items-center justify-between transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                              member.roleInProject === 1 || member.roleInProject === 'Admin' ? 'bg-sky-700'
                              : member.roleInProject === 2 || member.roleInProject === 'ProjectManager' ? 'bg-emerald-700'
                              : 'bg-indigo-700'
                            }`}>
                              {member.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{member.fullName}</div>
                              <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{member.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isDark ? 'border-slate-700 text-slate-400 bg-slate-800' : 'border-slate-200 text-slate-500 bg-slate-100'
                            }`}>
                              {roleIcon(member.roleInProject)}
                              {roleLabel(member.roleInProject)}
                            </span>
                            {canManage && (
                              <motion.button
                                whileTap={{ scale: 0.93 }}
                                onClick={() => removeMember(member.userId)}
                                disabled={removingId === member.userId}
                                title="Remove from project"
                                className={`p-1.5 rounded-lg border transition disabled:opacity-40 ${isDark ? 'border-slate-700 text-slate-500 hover:text-rose-400 hover:border-rose-500/40' : 'border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300'}`}
                              >
                                {removingId === member.userId
                                  ? <div className="w-3 h-3 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                                  : <UserMinus size={13} />
                                }
                              </motion.button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <Link
                      to={`/projects/${selectedProject.id}`}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                        isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Open Project Workspace, Notion & Chat &rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* ─ TASKS section ─ */}
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-[#0B1120]/60' : 'border-slate-100 bg-slate-50'}`}>
                    <div>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Work Deliverables</span>
                      <span className={`ml-2 text-[11px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                        {selectedProject.tasks?.length ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-100'}`}>
                    {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                      <div className={`p-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No tasks created in this project yet.
                      </div>
                    ) : (
                      selectedProject.tasks.map(task => (
                        <div key={task.id}
                          className={`px-5 py-3.5 flex items-center justify-between gap-4 transition ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${isDark ? 'text-slate-400 border-slate-700 bg-slate-800/50' : 'text-slate-600 border-slate-300 bg-slate-100'}`}>
                              {task.taskCode}
                            </span>
                            <div className="min-w-0">
                              <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                {task.assigneeName || 'Unassigned'} · {taskStatusLabel(task.status)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <div className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Progress</div>
                              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.progressPercentage}%</div>
                            </div>
                            {task.latestRiskLevel && task.latestRiskLevel !== 'Low' && (
                              <RiskBadge level={task.latestRiskLevel} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className={`mt-4 pt-3 border-t flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <Link
                      to={`/projects/${selectedProject.id}`}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm ${
                        isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>Open Project Workspace, Notion & Chat &rarr;</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── CREATE PROJECT MODAL ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${isDark ? 'bg-[#131D33] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Create New Project</h2>
                <button onClick={() => setShowCreate(false)} className={`p-1.5 rounded-lg border ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className={`block font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Project Name *</label>
                  <input required value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. NextGen Engineering Platform"
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`block font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>GitHub Repository Link</label>
                  <input value={createForm.repositoryUrl} onChange={e => setCreateForm(f => ({ ...f, repositoryUrl: e.target.value }))}
                    placeholder="https://github.com/organization/repository"
                    className={`w-full px-3 py-2.5 rounded-xl border font-mono focus:outline-none transition ${isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'}`}
                  />
                  <p className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Paste the direct GitHub repository link to automatically monitor developer commits and PRs.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className={`block font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Description</label>
                  <textarea rows={2} value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief summary of the project scope…"
                    className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none resize-none transition ${isDark ? 'bg-[#0B1120] border-slate-700 text-white placeholder-slate-600 focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={`block font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Target Delivery Date</label>
                    <input type="date" value={createForm.targetEndDate} onChange={e => setCreateForm(f => ({ ...f, targetEndDate: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${isDark ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'}`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={`block font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Budget Hours</label>
                    <input type="number" value={createForm.budgetHours} onChange={e => setCreateForm(f => ({ ...f, budgetHours: Number(e.target.value) }))}
                      className={`w-full px-3 py-2.5 rounded-xl border focus:outline-none transition ${isDark ? 'bg-[#0B1120] border-slate-700 text-white focus:border-sky-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-600'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className={`px-4 py-2.5 rounded-xl border font-bold transition ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'}`}
                  >
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={creating} whileTap={{ scale: 0.96 }}
                    className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {creating ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
                    {creating ? 'Creating…' : 'Create Project'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
