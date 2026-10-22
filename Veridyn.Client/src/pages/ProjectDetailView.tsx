import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { 
  FolderGit2, Plus, Users, UserPlus, UserMinus, Clock, Calendar, 
  CheckSquare, AlertTriangle, ArrowLeft, Send, MessageSquare, 
  FileText, GitBranch, GitCommit, ExternalLink, RefreshCw, 
  Sparkles, CheckCircle2, User, Hash, Lock, Check, Save, Shield, 
  Briefcase, Code, Bell, Search, Smile, Paperclip, Image as ImageIcon, 
  MoreVertical, X, Star, Bookmark, Copy, Edit3, Info, Flame, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

function getMemberRoleLabel(role: any, fullName?: string): string {
  if (role === 1 || role === 'Admin' || (fullName && fullName.toLowerCase().includes('administrator'))) {
    return 'Admin';
  }
  if (role === 2 || role === 'ProjectManager') {
    return 'Project Manager';
  }
  return 'Developer';
}

export const ProjectDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [project, setProject] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'notes' | 'messages' | 'team' | 'tasks' | 'commits'>('notes');

  // Git Commits state
  const [commits, setCommits] = useState<any[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [commitSearch, setCommitSearch] = useState('');
  const [copiedSha, setCopiedSha] = useState<string | null>(null);

  // Announcements state
  const [notesContent, setNotesContent] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedNotice, setNotesSavedNotice] = useState(false);

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [chatChannel, setChatChannel] = useState<'group' | string>('group');
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  const [showSchedulePanel, setShowSchedulePanel] = useState(true);

  // Add Member Modal/Drawer
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState(3);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Add Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    estimatedHours: 16,
    priority: 2,
    complexityPoints: 3,
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  });

  const isAdmin = user?.role === 1 || user?.roleName === 'Admin';
  const isPM = user?.role === 2 || user?.roleName === 'ProjectManager';
  const canManage = isAdmin || isPM;

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      setRefreshing(true);
      const [projRes, usersRes, notesRes, msgRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/auth/users'),
        api.get(`/projects/${id}/notes`),
        api.get(`/projects/${id}/messages`)
      ]);
      setProject(projRes.data);
      setAllUsers(usersRes.data);
      setNotesContent(notesRes.data?.content || '');
      setMessages(msgRes.data || []);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const fetchCommits = useCallback(async () => {
    if (!id) return;
    setCommitsLoading(true);
    try {
      const res = await api.get(`/github/commits?projectId=${id}`);
      setCommits(res.data || []);
    } catch (err) {
      console.error('Failed to load commits', err);
    } finally {
      setCommitsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'commits') {
      fetchCommits();
    }
  }, [activeTab, fetchCommits]);

  const handleSyncCommits = async () => {
    if (!id) return;
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.post('/github/sync', { projectId: Number(id) });
      setSyncMessage(res.data?.message || 'Sync complete!');
      await fetchCommits();
    } catch (e: any) {
      setSyncMessage(e.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const copyToClipboard = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Periodic poll for new messages
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const msgRes = await api.get(`/projects/${id}/messages`);
        setMessages(msgRes.data || []);
      } catch (e) {}
    }, 6000);
    return () => clearInterval(interval);
  }, [id]);

  // Save Announcement (available to Admin, PM, and Developers)
  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    try {
      await api.put(`/projects/${id}/notes`, { content: notesContent });
      setNotesSavedNotice(true);
      setTimeout(() => setNotesSavedNotice(false), 3000);
    } catch (e) {
      alert("Failed to post announcement");
    } finally {
      setSavingNotes(false);
    }
  };

  const appendNoteTemplate = (template: string) => {
    setNotesContent(prev => prev ? `${prev}\n${template}` : template);
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !messageInput.trim()) return;
    setSendingMessage(true);
    try {
      const recipientId = chatChannel === 'group' ? null : chatChannel;
      const res = await api.post(`/projects/${id}/messages`, {
        content: messageInput.trim(),
        recipientId
      });
      setMessages(prev => [...prev, res.data]);
      setMessageInput('');
    } catch (e) {
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // Add Member
  const handleAddMember = async (userId: string) => {
    if (!id) return;
    setAddingUserId(userId);
    try {
      await api.post(`/projects/${id}/members`, {
        userId,
        roleInProject: selectedMemberRole
      });
      await fetchProjectData();
      setShowAddMember(false);
      setMemberSearch('');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingUserId(null);
    }
  };

  // Remove Member
  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${userId}`);
      await fetchProjectData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to remove member');
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setCreatingTask(true);
    try {
      await api.post('/tasks', {
        projectId: Number(id),
        title: taskForm.title,
        description: taskForm.description,
        assigneeId: taskForm.assigneeId || null,
        estimatedHours: Number(taskForm.estimatedHours),
        priority: Number(taskForm.priority),
        complexityPoints: Number(taskForm.complexityPoints),
        dueDate: new Date(taskForm.dueDate),
        startDate: new Date(),
        status: 0
      });
      setShowAddTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        assigneeId: '',
        estimatedHours: 16,
        priority: 2,
        complexityPoints: 3,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
      });
      await fetchProjectData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
          isDark ? 'border-slate-700 border-t-sky-400' : 'border-slate-300 border-t-sky-600'
        }`} />
        <span className={`text-xs font-bold tracking-widest uppercase ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Opening Project Workspace…
        </span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <Link to="/projects" className="text-sm text-sky-500 hover:underline">
          &larr; Return to Projects
        </Link>
      </div>
    );
  }

  // Filter available users for adding
  const currentMemberIds = new Set(project.members?.map((m: any) => m.userId) || []);
  const eligibleUsers = allUsers.filter((u: any) => 
    !currentMemberIds.has(u.id) &&
    (u.fullName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
     u.email?.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // Filter messages for active channel
  const filteredMessages = messages.filter((m: any) => {
    if (chatChannel === 'group') {
      return !m.recipientId;
    } else {
      return (m.senderId === user?.id && m.recipientId === chatChannel) ||
             (m.senderId === chatChannel && m.recipientId === user?.id);
    }
  });

  const activeDMUser = project.members?.find((m: any) => m.userId === chatChannel);

  // Filtered commits
  const filteredCommits = commits.filter((c: any) => {
    if (!commitSearch.trim()) return true;
    const term = commitSearch.toLowerCase();
    const msg = (c.message || c.commitMessage || '').toLowerCase();
    const author = (c.authorName || c.author || '').toLowerCase();
    const sha = (c.sha || c.commitSha || '').toLowerCase();
    const task = (c.taskCode || c.taskItemCode || '').toLowerCase();
    return msg.includes(term) || author.includes(term) || sha.includes(term) || task.includes(term);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif]">
      {/* ── TOP BREADCRUMB & ACTION BAR ── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className={`p-2 rounded-xl border transition ${
              isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                isDark ? 'text-sky-400 bg-sky-950/70 border-sky-800/60' : 'text-sky-700 bg-sky-50 border-sky-200'
              }`}>
                {project.key}
              </span>
              <h1 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                {project.name}
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Target: {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : 'Continuous'}
              </span>
              {project.targetEndDate && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  getTimeRemaining(project.targetEndDate).overdue
                    ? 'bg-rose-950/70 text-rose-400 border-rose-800'
                    : getTimeRemaining(project.targetEndDate).urgent
                    ? 'bg-amber-950/70 text-amber-400 border-amber-800'
                    : isDark ? 'bg-sky-950/70 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  {getTimeRemaining(project.targetEndDate).label}
                </span>
              )}
              <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                • Budget: {project.budgetHours}h
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {project.repositoryUrl && (
            <a
              href={project.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <GitBranch size={14} className="text-sky-500" />
              <span>GitHub Repo</span>
              <ExternalLink size={12} />
            </a>
          )}

          {canManage && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAddMember(true)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition shadow-sm ${
                isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus size={14} />
              <span>+ Add Developer</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* ── LIVE TELEMETRY RADAR METRICS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reported Progress</div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {Math.round(project.overallProgressPercentage || 0)}%
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {project.completedTasks} of {project.totalTasks} tasks complete
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Git Evidence Index</div>
          <div className="text-2xl font-bold text-emerald-500 mt-1">
            {Math.round(project.overallEvidenceScore || 0)}%
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Corroborated by developer git pushes
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Delivery Risk</div>
          <div className="mt-1">
            <RiskBadge level={project.projectRiskLevel} />
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {project.highRiskTasksCount || 0} flagged deliverables
          </div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Active Team</div>
          <div className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {project.members?.length || 0}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Engineers & managers assigned
          </div>
        </div>
      </div>

      {/* ── PROJECT WORKSPACE TABS (INTERACTIVE PILL DESIGN) ── */}
      <div className={`flex flex-wrap items-center gap-2 p-2 rounded-2xl border transition-all ${
        isDark ? 'bg-[#0B1120] border-slate-800 shadow-inner' : 'bg-slate-100 border-slate-200 shadow-inner'
      }`}>
        {[ 
          { key: 'notes', icon: Bell, label: 'Announcements', badge: null },
          { key: 'messages', icon: MessageSquare, label: 'Group Chat & Direct Messages', badge: messages.length > 0 ? messages.length : null },
          { key: 'team', icon: Users, label: `Developers & Team (${project.members?.length || 0})`, badge: null },
          { key: 'tasks', icon: CheckSquare, label: `Work Deliverables (${project.tasks?.length || 0})`, badge: null },
          { key: 'commits', icon: GitCommit, label: 'Git Activity', badge: commits.length > 0 ? commits.length : null },
        ].map(({ key, icon: Icon, label, badge }) => {
          const isActive = activeTab === key;
          return (
            <motion.button
              key={key}
              onClick={() => setActiveTab(key as any)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                isActive
                  ? isDark
                    ? 'text-white shadow-lg shadow-sky-500/20'
                    : 'text-sky-900 shadow-md'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeWorkspaceTabPill"
                  className={`absolute inset-0 rounded-xl border ${
                    isDark
                      ? 'bg-gradient-to-r from-sky-500/25 via-indigo-500/20 to-sky-500/25 border-sky-400/40'
                      : 'bg-white border-sky-200 shadow-sm'
                  }`}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={14} className={`relative z-10 shrink-0 ${isActive ? (isDark ? 'text-sky-400' : 'text-sky-600') : ''}`} />
              <span className="relative z-10 truncate">{label}</span>
              {badge !== null && (
                <span className={`relative z-10 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? isDark ? 'bg-sky-400/20 text-sky-300 border border-sky-400/30' : 'bg-sky-100 text-sky-700'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                }`}>
                  {badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── TAB 1: ANNOUNCEMENTS (ACCESSIBLE TO ADMIN, PM & DEVELOPERS) ── */}
      {activeTab === 'notes' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          {/* Project Vision Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Bell size={18} className="text-amber-400" />
                Project Announcements & Broadcasts
              </h2>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                isDark ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                Broadcasting to {project.members?.length || 0} members
              </span>
            </div>
            <p className={`text-xs sm:text-sm leading-relaxed p-4 rounded-xl border ${
              isDark ? 'bg-[#0B1120] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {project.description || 'No initial description provided for this project.'}
            </p>
          </div>

          {/* Announcement Workspace Bar */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Post an Announcement
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Admins, Project Managers, and Developers can broadcast updates. Every announcement triggers a notification.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => appendNoteTemplate('\n- [ ] Action Item: ')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  + Add Action Item
                </button>
                <button
                  type="button"
                  onClick={() => appendNoteTemplate('\n📢 Milestone: ')}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition ${
                    isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  + Add Update
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    isDark ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  {savingNotes ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : notesSavedNotice ? (
                    <>
                      <Check size={14} className="text-white" />
                      <span>Broadcast Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Post Announcement</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <textarea
              rows={12}
              value={notesContent}
              onChange={e => setNotesContent(e.target.value)}
              placeholder={"📢 Announcement: Sprint Execution Objectives\n\n✅ Key Deliverables:\n- [ ] Task 1: Complete database schema migrations\n- [ ] Task 2: Synchronize git branch telemetry\n\n📌 Notes:\n- Code reviews required before PR merge"}
              className={`w-full p-5 rounded-2xl font-mono text-xs sm:text-sm leading-relaxed border focus:outline-none transition resize-y ${
                isDark 
                  ? 'bg-[#0B1120] border-slate-800 text-slate-200 placeholder-slate-600 focus:border-sky-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:bg-white'
              }`}
            />
          </div>
        </motion.div>
      )}

      {/* ── TAB 2: MODERN INTERACTIVE CHAT (MATCHING REFERENCE IMAGE) ── */}
      {activeTab === 'messages' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border overflow-hidden transition-all flex flex-col ${
            isDark ? 'bg-[#0B1120] border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
          }`}
          style={{ minHeight: '680px' }}
        >
          {/* ── CHAT TOP APP BAR ── */}
          <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 ${
            isDark ? 'border-slate-800 bg-[#0D1527]' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <div>
              <h2 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                General Chats
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Middle Search Input */}
            <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all">
              <Search size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              <input
                type="text"
                value={chatSearch}
                onChange={e => setChatSearch(e.target.value)}
                placeholder="Search messages or team members…"
                className={`bg-transparent text-xs outline-none flex-1 ${
                  isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isDark ? 'border-slate-700 text-slate-400 bg-slate-800' : 'border-slate-200 text-slate-500 bg-slate-100'
              }`}>
                ⌘F
              </span>
            </div>

            {/* Right User Status & Reminder Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSchedulePanel(!showSchedulePanel)}
                className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  showSchedulePanel
                    ? isDark ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200'
                    : isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600'
                }`}
                title="Toggle Milestones & Reminders"
              >
                <Calendar size={14} />
                <span className="hidden md:inline">Milestones</span>
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700/60">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {user?.fullName}
                  </div>
                  <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {getMemberRoleLabel(user?.role, user?.fullName)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CHAT 3-COLUMN BODY ── */}
          <div className="flex-1 flex overflow-hidden" style={{ minHeight: '600px' }}>
            {/* ── COLUMN 1: MESSAGES / CONTACTS LIST ── */}
            <div className={`w-72 shrink-0 flex flex-col border-r ${
              isDark ? 'border-slate-800 bg-[#0B1120]' : 'border-slate-200 bg-white'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Messages
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setChatChannel('group')}
                    className={`p-1.5 rounded-lg transition ${
                      isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                    title="New Group Message"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>

              {/* Chat Channels & Contacts */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* # General Chat channel */}
                <button
                  onClick={() => setChatChannel('group')}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition text-left relative ${
                    chatChannel === 'group'
                      ? isDark
                        ? 'bg-sky-500/15 border border-sky-500/30 shadow-sm'
                        : 'bg-sky-50 border border-sky-200 shadow-xs'
                      : isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'
                    }`}>
                      <Hash size={18} />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        General Discussion
                      </span>
                      <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Live
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {messages.filter(m => !m.recipientId).slice(-1)[0]?.content || 'Project group chat room'}
                    </p>
                  </div>
                  {chatChannel === 'group' && (
                    <div className="w-1.5 h-6 rounded-full bg-sky-500 shrink-0" />
                  )}
                </button>

                <div className={`px-3 pt-3 pb-1 text-[9px] font-extrabold uppercase tracking-widest ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  DIRECT MESSAGES ({project.members?.length || 0})
                </div>

                {/* Team member rows */}
                {project.members
                  ?.filter((m: any) => !chatSearch || m.fullName?.toLowerCase().includes(chatSearch.toLowerCase()))
                  .map((m: any) => {
                    const isSelected = chatChannel === m.userId;
                    const roleLabel = getMemberRoleLabel(m.roleInProject, m.fullName);
                    const initials = (m.fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                    const avatarPalettes = [
                      'from-violet-500 to-indigo-600',
                      'from-rose-500 to-pink-600',
                      'from-amber-500 to-orange-600',
                      'from-emerald-500 to-teal-600',
                      'from-sky-500 to-blue-600'
                    ];
                    const palette = avatarPalettes[m.userId?.charCodeAt(0) % avatarPalettes.length || 0];
                    const lastDm = messages
                      .filter(msg => (msg.senderId === m.userId && msg.recipientId === user?.id) || (msg.senderId === user?.id && msg.recipientId === m.userId))
                      .slice(-1)[0];

                    return (
                      <button
                        key={m.userId}
                        onClick={() => setChatChannel(m.userId)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition text-left relative ${
                          isSelected
                            ? isDark
                              ? 'bg-sky-500/15 border border-sky-500/30 shadow-sm'
                              : 'bg-sky-50 border border-sky-200 shadow-xs'
                            : isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${palette} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                            {initials}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0B1120]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {m.fullName}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              roleLabel === 'Admin'
                                ? 'text-sky-400 bg-sky-950/60'
                                : roleLabel === 'Project Manager'
                                ? 'text-emerald-400 bg-emerald-950/60'
                                : isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}>
                              {roleLabel === 'Project Manager' ? 'PM' : roleLabel}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {lastDm?.content || 'Click to send direct message'}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-1.5 h-6 rounded-full bg-sky-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* ── COLUMN 2: ACTIVE CONVERSATION STREAM ── */}
            <div className={`flex-1 flex flex-col min-w-0 ${
              isDark ? 'bg-[#0B1120]' : 'bg-slate-50/50'
            }`}>
              {/* Chat Stream Header */}
              <div className={`px-6 py-3.5 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800 bg-[#0D1527]' : 'border-slate-200 bg-white'
              }`}>
                <div className="flex items-center gap-3">
                  {chatChannel === 'group' ? (
                    <>
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold ${
                        isDark ? 'bg-sky-500/20 text-sky-400' : 'bg-sky-100 text-sky-700'
                      }`}>
                        <Hash size={16} />
                      </div>
                      <div>
                        <div className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          # General Discussion
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{project.members?.length || 0} active members</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {activeDMUser?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activeDMUser?.fullName || 'Direct Message'}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {getMemberRoleLabel(activeDMUser?.roleInProject, activeDMUser?.fullName)} • Online
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    {filteredMessages.length} messages
                  </span>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Date separator pill */}
                <div className="flex items-center justify-center my-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-2xs ${
                    isDark ? 'bg-slate-800/80 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                  }`}>
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {filteredMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                      isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <MessageSquare size={26} />
                    </div>
                    <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      No conversation history yet
                    </p>
                    <p className={`text-xs mt-1 max-w-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {chatChannel === 'group'
                        ? 'Kick off the discussion with your developers and project manager!'
                        : `Send a 1-on-1 private message to ${activeDMUser?.fullName || 'this member'}.`}
                    </p>
                  </div>
                ) : (
                  filteredMessages.map((msg: any) => {
                    const isMe = msg.senderId === user?.id;
                    const senderRoleLabel = getMemberRoleLabel(msg.senderRole, msg.senderName);
                    const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Sender header for incoming messages */}
                        {!isMe && (
                          <div className="flex items-center gap-2 mb-1 px-1">
                            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                              {msg.senderName}
                            </span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              senderRoleLabel === 'Admin'
                                ? 'bg-sky-950 text-sky-400 border border-sky-800'
                                : senderRoleLabel === 'Project Manager'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {senderRoleLabel}
                            </span>
                            <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {timeStr}
                            </span>
                          </div>
                        )}

                        {/* Bubble styling matching reference image */}
                        <div className={`px-4 py-3 rounded-2xl text-xs sm:text-sm max-w-lg leading-relaxed shadow-xs ${
                          isMe
                            ? isDark
                              ? 'bg-sky-600 text-white rounded-br-xs'
                              : 'bg-indigo-100 text-indigo-950 rounded-br-xs border border-indigo-200/80'
                            : isDark
                              ? 'bg-[#1A233A] text-slate-200 border border-slate-700/60 rounded-bl-xs'
                              : 'bg-[#FFEBEB] text-rose-950 rounded-bl-xs border border-rose-200/80'
                        }`}>
                          {msg.content}
                        </div>

                        {/* Outgoing timestamp */}
                        {isMe && (
                          <span className={`text-[10px] mt-1 px-1 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {timeStr}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer input bar matching reference design */}
              <form onSubmit={handleSendMessage} className={`p-4 border-t ${
                isDark ? 'border-slate-800 bg-[#0D1527]' : 'border-slate-200 bg-white'
              }`}>
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all ${
                  isDark
                    ? 'bg-[#131D33] border-slate-700 focus-within:border-sky-500 shadow-inner'
                    : 'bg-slate-100 border-slate-200 focus-within:border-sky-500 shadow-inner'
                }`}>
                  <button
                    type="button"
                    onClick={() => setMessageInput(prev => `${prev} 👍`)}
                    className={`p-1 rounded-full transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Insert Emoji"
                  >
                    <Smile size={18} />
                  </button>

                  <input
                    type="text"
                    required
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder={chatChannel === 'group' ? "Type a message to project group…" : `Direct message to ${activeDMUser?.fullName || 'member'}…`}
                    className={`flex-1 bg-transparent text-xs sm:text-sm outline-none ${
                      isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => setMessageInput(prev => `${prev} [Attachment]`)}
                    className={`p-1 rounded-full transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Attach file"
                  >
                    <Paperclip size={16} />
                  </button>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    disabled={sendingMessage || !messageInput.trim()}
                    className={`p-2 rounded-full flex items-center justify-center transition shadow-md ${
                      isDark ? 'bg-sky-500 hover:bg-sky-400 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    <Send size={14} />
                  </motion.button>
                </div>
              </form>
            </div>

            {/* ── COLUMN 3: SCHEDULE REMINDER / SPRINTS PANEL (MATCHING REFERENCE IMAGE) ── */}
            {showSchedulePanel && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 310, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className={`shrink-0 border-l p-5 space-y-4 overflow-y-auto hidden xl:block ${
                  isDark ? 'border-slate-800 bg-[#0B1120]' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Schedule Reminder
                  </h4>
                  <button
                    onClick={() => setShowSchedulePanel(false)}
                    className={`p-1 rounded-lg transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Card 1: Lavender / Violet Reminder Card */}
                <div className={`p-4 rounded-3xl space-y-3 transition border ${
                  isDark
                    ? 'bg-gradient-to-br from-[#1E1B4B]/80 to-[#2E1065]/60 border-indigo-800/40 text-slate-100'
                    : 'bg-[#EDE9FE] border-indigo-200/80 text-indigo-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-2xl bg-white/90 text-indigo-600 flex items-center justify-center shadow-xs">
                      <Bookmark size={16} />
                    </div>
                    <span className="text-[10px] font-bold opacity-75">
                      {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sprint Cycle'}
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">Sprint Milestone</h5>
                    <p className="text-[11px] opacity-80 mt-1 leading-snug">
                      Deliver continuous verified Git evidence and close high-priority deliverables.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-indigo-300/40 dark:border-indigo-800/40">
                    <span className="flex items-center gap-1 text-[11px] font-bold">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      4.9 Priority
                    </span>
                    <span className="text-[10px] font-bold">
                      {project.totalTasks || 0} Deliverables
                    </span>
                  </div>
                </div>

                {/* Card 2: Amber / Yellow Reminder Card */}
                <div className={`p-4 rounded-3xl space-y-3 transition border ${
                  isDark
                    ? 'bg-gradient-to-br from-[#451A03]/80 to-[#78350F]/60 border-amber-800/40 text-slate-100'
                    : 'bg-[#FEF08A] border-amber-200/80 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-2xl bg-white/90 text-amber-600 flex items-center justify-center shadow-xs">
                      <Flame size={16} />
                    </div>
                    <span className="text-[10px] font-bold opacity-75">
                      Target: Next 48h
                    </span>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm">Code Verification</h5>
                    <p className="text-[11px] opacity-80 mt-1 leading-snug">
                      Push git commits linking to task IDs to boost automated evidence telemetry.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-amber-300/40 dark:border-amber-800/40">
                    <span className="flex items-center gap-1 text-[11px] font-bold">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      Live Auditing
                    </span>
                    <span className="text-[10px] font-bold">
                      {commits.length} Git Commits
                    </span>
                  </div>
                </div>

                {/* Quick Telemetry Pill Card */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2 text-slate-400">
                    Project Radar
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Evidence Index:</span>
                      <span className="font-bold text-emerald-500">{Math.round(project.overallEvidenceScore || 0)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Completed Tasks:</span>
                      <span className="font-bold">{project.completedTasks || 0} / {project.totalTasks || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 3: DEVELOPERS & TEAM ALLOCATION ── */}
      {activeTab === 'team' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Assigned Developers & Project Team
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Engineers and project managers allocated to commit code and review deliverables.
              </p>
            </div>

            {canManage && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAddMember(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <UserPlus size={14} />
                <span>+ Add Developer</span>
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.members?.length === 0 ? (
              <div className={`col-span-full p-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No developers are assigned to this project yet. Click "+ Add Developer" to allocate engineers.
              </div>
            ) : (
              project.members?.map((m: any) => {
                const roleStr = getMemberRoleLabel(m.roleInProject, m.fullName);
                const initials = (m.fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                return (
                  <div
                    key={m.userId}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isDark ? 'bg-[#0B1120] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {m.fullName}
                        </div>
                        <div className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {m.email}
                        </div>
                        <span className={`inline-block mt-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          roleStr === 'Admin'
                            ? 'bg-sky-500/20 text-sky-400'
                            : roleStr === 'Project Manager'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {roleStr}
                        </span>
                      </div>
                    </div>

                    {canManage && m.userId !== user?.id && roleStr !== 'Admin' && (
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className={`p-2 rounded-xl border transition ${
                          isDark
                            ? 'border-rose-900/60 bg-rose-950/20 text-rose-400 hover:bg-rose-900/40'
                            : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                        title="Remove member from project"
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 4: WORK DELIVERABLES ── */}
      {activeTab === 'tasks' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Work Deliverables & Sprints ({project.tasks?.length || 0})
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Tasks tracked with predictive delivery risk and Git commit verification.
              </p>
            </div>

            {canManage && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowAddTaskModal(true)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                  isDark ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <Plus size={14} />
                <span>+ Create Deliverable</span>
              </motion.button>
            )}
          </div>

          <div className="space-y-3">
            {project.tasks?.length === 0 ? (
              <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                No deliverables created yet. Click "+ Create Deliverable" to add your first task.
              </div>
            ) : (
              project.tasks?.map((t: any) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isDark ? 'bg-[#0B1120] border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                      isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800' : 'text-sky-700 bg-sky-50 border-sky-200'
                    }`}>
                      {t.taskCode || `${project.key}-${t.id}`}
                    </span>
                    <div className="min-w-0">
                      <h4 className={`text-xs sm:text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {t.title}
                      </h4>
                      <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.description || 'No description provided.'}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px]">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          Assignee: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{t.assigneeName || 'Unassigned'}</strong>
                        </span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          Est: {t.estimatedHours || 0}h
                        </span>
                        {t.commitCount !== undefined && t.commitCount > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                            <GitCommit size={11} /> {t.commitCount} commits verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <RiskBadge level={t.latestRiskLevel} />
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                      t.status === 2 || t.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : t.status === 1 || t.status === 'InProgress'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t.status === 2 || t.status === 'Completed' ? 'Completed' : t.status === 1 || t.status === 'InProgress' ? 'In Progress' : 'To Do'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* ── TAB 5: GIT ACTIVITY (HIGHLY INTERACTIVE REPOSITORY FEED) ── */}
      {activeTab === 'commits' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 sm:p-8 rounded-3xl border space-y-6 transition-all ${
            isDark ? 'bg-[#0B1120] border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
          }`}
        >
          {/* Top Interactive Git Header */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isDark
              ? 'bg-gradient-to-r from-[#131D33] to-[#0D1527] border-slate-800'
              : 'bg-gradient-to-r from-slate-50 to-sky-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <GitBranch size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`text-base font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Git Telemetry & Commits
                  </h3>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    main
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {project.repositoryUrl ? (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {project.repositoryUrl}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    'Linked repository commits verified by the AI Risk Engine'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {syncMessage && (
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                  syncMessage.toLowerCase().includes('fail') || syncMessage.toLowerCase().includes('error')
                    ? 'text-rose-400 border-rose-800 bg-rose-950/50'
                    : 'text-emerald-400 border-emerald-800 bg-emerald-950/50'
                }`}>
                  {syncMessage}
                </span>
              )}

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={fetchCommits}
                disabled={commitsLoading}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                  isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-white'
                }`}
              >
                <RefreshCw size={13} className={commitsLoading ? 'animate-spin' : ''} />
                Refresh
              </motion.button>

              {canManage && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSyncCommits}
                  disabled={syncing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md ${
                    isDark ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'
                  }`}
                >
                  <GitBranch size={14} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Syncing Repo…' : 'Sync from GitHub'}
                </motion.button>
              )}
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border flex-1 max-w-md ${
              isDark ? 'bg-[#131D33] border-slate-700' : 'bg-slate-50 border-slate-300'
            }`}>
              <Search size={14} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              <input
                type="text"
                value={commitSearch}
                onChange={e => setCommitSearch(e.target.value)}
                placeholder="Search commits by message, author, or task code…"
                className={`bg-transparent text-xs outline-none flex-1 ${
                  isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'
                }`}
              />
              {commitSearch && (
                <button onClick={() => setCommitSearch('')} className="text-slate-400 hover:text-white">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <span className={`px-3 py-1.5 rounded-xl border ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                {filteredCommits.length} Synced Commits
              </span>
            </div>
          </div>

          {/* Commits Timeline Feed */}
          {commitsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`w-9 h-9 border-2 rounded-full animate-spin mb-3 ${
                isDark ? 'border-slate-700 border-t-sky-400' : 'border-slate-200 border-t-sky-600'
              }`} />
              <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Querying Git Records…
              </span>
            </div>
          ) : filteredCommits.length === 0 ? (
            <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed text-center ${
              isDark ? 'border-slate-800 bg-[#0D1527]/50' : 'border-slate-300 bg-slate-50/50'
            }`}>
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                isDark ? 'bg-slate-800/80 text-slate-500' : 'bg-slate-200 text-slate-400'
              }`}>
                <GitCommit size={32} />
              </div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No Commits Detected Yet
              </h4>
              <p className={`text-xs mt-1.5 max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {canManage
                  ? 'Click "Sync from GitHub" above to retrieve latest commits pushed to the repository.'
                  : 'Ask your Project Manager or Admin to trigger a GitHub sync.'}
              </p>
              {canManage && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSyncCommits}
                  disabled={syncing}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md"
                >
                  <GitBranch size={14} />
                  {syncing ? 'Syncing Now…' : 'Sync from GitHub'}
                </motion.button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-sky-500 before:via-indigo-500 before:to-transparent">
              {filteredCommits.map((commit: any, idx: number) => {
                const sha = commit.sha || commit.commitSha || '';
                const shortSha = sha.slice(0, 7);
                const message = commit.message || commit.commitMessage || '';
                const author = commit.authorName || commit.author || 'Unknown';
                const dateStr = commit.committedAt || commit.date || commit.authoredAt || '';
                const commitDate = dateStr ? new Date(dateStr) : null;
                const linkedTask = commit.taskCode || commit.taskItemCode || null;
                const repoUrl = project.repositoryUrl || '';
                const commitUrl = repoUrl && sha ? `${repoUrl.replace(/\/$/, '')}/commit/${sha}` : null;
                const isCopied = copiedSha === sha;

                return (
                  <motion.div
                    key={sha || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`relative p-4 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-[#131D33] border-slate-800 hover:border-slate-700 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Glowing Branch Timeline Node */}
                    <div className="absolute -left-[30px] top-5 w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-500/20" />

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* SHA pill with click to copy */}
                          <button
                            onClick={() => copyToClipboard(sha)}
                            className={`flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                              isCopied
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : isDark
                                ? 'bg-sky-950/60 text-sky-400 border-sky-800/60 hover:bg-sky-900/60'
                                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                            }`}
                            title="Click to copy full SHA"
                          >
                            <GitCommit size={12} />
                            <span>{shortSha}</span>
                            {isCopied ? <Check size={11} /> : <Copy size={11} className="opacity-60" />}
                          </button>

                          {linkedTask && (
                            <span className="flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/60">
                              <CheckCircle2 size={11} />
                              {linkedTask}
                            </span>
                          )}

                          {commitUrl && (
                            <a
                              href={commitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`p-1 rounded-md transition ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                              title="Open on GitHub"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>

                        <p className={`text-xs sm:text-sm font-semibold leading-relaxed ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {message || '(empty commit message)'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]">
                          <span className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            <User size={12} />
                            <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{author}</strong>
                          </span>
                          {commitDate && (
                            <span className={`flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Clock size={12} />
                              {commitDate.toLocaleDateString()} at {commitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Interactive Developer Linking Guide */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            isDark ? 'bg-sky-950/30 border-sky-900/50 text-slate-300' : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}>
            <Sparkles size={18} className="text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="font-bold text-sky-400">Automatic Task Linking:</strong>
              <p className="leading-relaxed opacity-90">
                To link a commit to a deliverable and automatically boost your Git Evidence score, include the deliverable ID in your commit message.
                Example: <code className="font-mono font-bold text-sky-400">{project.key}-1: Add landing page navigation</code>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ADD MEMBER MODAL ── */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
                isDark ? 'bg-[#131D33] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <h3 className="font-bold text-base">Add Developer to Project</h3>
                <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search user by name or email…"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none ${
                    isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {eligibleUsers.length === 0 ? (
                    <p className="text-xs text-center py-6 text-slate-500">No eligible users found</p>
                  ) : (
                    eligibleUsers.map((u: any) => (
                      <div
                        key={u.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{u.fullName}</div>
                          <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          disabled={addingUserId === u.id}
                          onClick={() => handleAddMember(u.id)}
                          className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase transition"
                        >
                          {addingUserId === u.id ? 'Adding…' : 'Add'}
                        </motion.button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD TASK MODAL ── */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
                isDark ? 'bg-[#131D33] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
                <h3 className="font-bold text-base">Create Deliverable</h3>
                <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g. Implement user authentication workflow"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Describe deliverable acceptance criteria…"
                    className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Assignee</label>
                    <select
                      value={taskForm.assigneeId}
                      onChange={e => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <option value="">Unassigned</option>
                      {project.members?.map((m: any) => (
                        <option key={m.userId} value={m.userId}>{m.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      <option value={1}>Low</option>
                      <option value={2}>Medium</option>
                      <option value={3}>High</option>
                      <option value={4}>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Est. Hours</label>
                    <input
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={e => setTaskForm({ ...taskForm, estimatedHours: Number(e.target.value) })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Due Date</label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                        isDark ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="submit"
                    disabled={creatingTask}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-white shadow-md shadow-sky-600/30"
                  >
                    {creatingTask ? 'Creating…' : 'Create Deliverable'}
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
