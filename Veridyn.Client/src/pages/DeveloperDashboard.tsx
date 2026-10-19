import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Code, GitCommit, GitPullRequest, CheckSquare, Clock, 
  AlertCircle, ExternalLink, RefreshCw, Sparkles 
} from 'lucide-react';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/tasks');
      // Filter to tasks assigned to this developer if assigneeId matches, or show active tasks
      const myTasks = res.data.filter((t: any) => t.assigneeId === user?.id || t.assigneeName === user?.fullName);
      setTasks(myTasks.length > 0 ? myTasks : res.data.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch developer tasks", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-slate-700 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold tracking-[0.25em] text-slate-400 uppercase">
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
      <div className="border-b border-dotted border-slate-700/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">
              ALLIURE // ENGINEERING WORKBENCH
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Developer Tasks & Git Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <strong className="text-white">{user?.fullName}</strong> ({user?.gitHubUsername ? `@${user.gitHubUsername}` : 'No GitHub handle'}). Your commits and completed subtasks automatically validate your progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#131D33] border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Sync Commits</span>
          </button>
        </div>
      </div>

      {/* ── 01: DEVELOPER STATS ── */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-4 flex items-center gap-2">
          <span>01 — ASSIGNED WORKLOAD</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">01</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Assigned Tasks</div>
            <div className="text-3xl font-bold text-white mt-1">{tasks.length}</div>
            <div className="text-[11px] text-slate-500 mt-2">{inProgressCount} Currently In Progress</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">02</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Completed Units</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{completedCount}</div>
            <div className="text-[11px] text-emerald-400/80 mt-2">Verified Complete</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">03</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Average Evidence Index</div>
            <div className="text-3xl font-bold text-indigo-400 mt-1">{avgEvidence}%</div>
            <div className="text-[11px] text-indigo-400/80 mt-2">Backed by Git Commits</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">04</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Git Telemetry</div>
            <div className="text-3xl font-bold text-sky-400 mt-1">Live</div>
            <div className="text-[11px] text-sky-400/80 mt-2">Webhook Synchronization</div>
          </div>
        </div>
      </div>

      {/* ── 02: ASSIGNED TASKS & EVIDENCE STATUS ── */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-4 flex items-center gap-2">
          <span>02 — DELIVERABLE CHECKLIST & RISK TELEMETRY</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-xs">
              No tasks currently assigned. Ask your Project Manager to assign deliverables to your profile.
            </div>
          ) : (
            tasks.map((task) => (
              <div 
                key={task.id} 
                className="bg-[#131D33] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-2 py-0.5 rounded">
                      {task.taskCode}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-white">{task.title}</h3>
                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span>Project: <strong className="text-slate-300">{task.projectName}</strong></span>
                        {task.dueDate && (
                          <span>Due: <strong className="text-slate-300">{new Date(task.dueDate).toLocaleDateString()}</strong></span>
                        )}
                        <span>Estimated: <strong className="text-slate-300">{task.estimatedHours}h</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Self-Reported</div>
                      <div className="text-base font-bold text-white">{task.progressPercentage}%</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-500">Verified Evidence</div>
                      <div className="text-base font-bold text-emerald-400">{Math.round(task.progressEvidenceScore || 0)}%</div>
                    </div>

                    <RiskBadge level={task.latestRiskLevel || 1} />
                  </div>
                </div>

                {/* Pill Progress Evidence Bar (Styled like LoadingScreen pill meter) */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Evidence Bar:</span>
                    <div className="h-4 bg-[#0B1120] rounded-full flex-1 max-w-xs flex items-center px-1.5 gap-1 border border-slate-700">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-2 flex-1 rounded-sm transition-all"
                          style={{
                            backgroundColor:
                              (task.progressEvidenceScore || 0) > (i / 10) * 100 
                                ? '#38bdf8' 
                                : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-slate-300">{Math.round(task.progressEvidenceScore || 0)}%</span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Clock size={13} />
                    <span>Logged: <strong className="text-white">{task.loggedHours || 0}h</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
