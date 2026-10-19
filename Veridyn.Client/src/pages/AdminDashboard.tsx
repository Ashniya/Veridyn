import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Users, UserPlus, Shield, Briefcase, Code, FolderGit2, 
  AlertTriangle, CheckSquare, Activity, RefreshCw, Cpu
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [overviewRes, usersRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/auth/users')
      ]);
      setOverview(overviewRes.data);
      setUsersList(usersRes.data);
    } catch (err) {
      console.error("Failed to load admin telemetry", err);
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
        <div className="w-10 h-10 border-2 border-slate-700 border-t-white rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold tracking-[0.25em] text-slate-400 uppercase">
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
      <div className="border-b border-dotted border-slate-700/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">
              ALLIURE // GOVERNANCE CONSOLE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System Administration & Access Control
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Central governance: provision project managers, invite developers, and audit predictive risk telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#131D33] border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          
          <Link
            to="/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition shadow-lg shadow-white/10"
          >
            <UserPlus size={15} />
            <span>+ Provision New User</span>
          </Link>
        </div>
      </div>

      {/* ── 01: TELEMETRY METRIC GRID ── */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-4 flex items-center gap-2">
          <span>01 — SYSTEM TELEMETRY</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="text-3xl font-light text-slate-500 mb-1">01</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Total Active Users</div>
            <div className="text-3xl font-bold text-white mt-1">{usersList.length}</div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
              <span className="text-sky-400">{adminCount} Admins</span> • 
              <span className="text-emerald-400">{pmCount} PMs</span> • 
              <span className="text-indigo-400">{devCount} Devs</span>
            </div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="text-3xl font-light text-slate-500 mb-1">02</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Active Projects</div>
            <div className="text-3xl font-bold text-white mt-1">{overview?.activeProjects || 0} / {overview?.totalProjects || 0}</div>
            <div className="text-[11px] text-slate-500 mt-2">{overview?.totalTasks || 0} Total Work Units</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="text-3xl font-light text-slate-500 mb-1">03</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Critical Delay Risks</div>
            <div className="text-3xl font-bold text-amber-400 mt-1">{overview?.highRiskTasksCount || 0}</div>
            <div className="text-[11px] text-amber-400/80 mt-2">{overview?.stalledTasksCount || 0} Potentially Stalled Tasks</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden group">
            <div className="text-3xl font-light text-slate-500 mb-1">04</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Average Evidence Index</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{Math.round(overview?.averageEvidenceScore || 0)}%</div>
            <div className="text-[11px] text-emerald-400/80 mt-2">Validated against Git & Worklogs</div>
          </div>
        </div>
      </div>

      {/* ── 02: USER DIRECTORY & ACCESS CONTROL TABLE ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 flex items-center gap-2">
            <span>02 — USER ACCESS & ROLE DIRECTORY</span>
          </div>
          <Link
            to="/register"
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition"
          >
            + Create Manager or Developer &rarr;
          </Link>
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1120] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">System Role</th>
                  <th className="py-3.5 px-5">Job Title</th>
                  <th className="py-3.5 px-5">GitHub Handle</th>
                  <th className="py-3.5 px-5">Access Status</th>
                  <th className="py-3.5 px-5 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usersList.map((u) => {
                  const roleStr = typeof u.role === 'string' ? u.role : (u.role === 1 ? 'Admin' : u.role === 2 ? 'ProjectManager' : 'Developer');
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs">
                            {u.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{u.fullName}</div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          roleStr === 'Admin'
                            ? 'bg-sky-950 text-sky-400 border-sky-800/80'
                            : roleStr === 'ProjectManager'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80'
                            : 'bg-indigo-950 text-indigo-400 border-indigo-800/80'
                        }`}>
                          {roleStr === 'Admin' && <Shield size={11} />}
                          {roleStr === 'ProjectManager' && <Briefcase size={11} />}
                          {roleStr === 'Developer' && <Code size={11} />}
                          <span>{roleStr}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-300">
                        {u.jobTitle || 'Team Member'}
                      </td>
                      <td className="py-3.5 px-5">
                        {u.gitHubUsername ? (
                          <a
                            href={`https://github.com/${u.gitHubUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-400 hover:underline font-mono"
                          >
                            @{u.gitHubUsername}
                          </a>
                        ) : (
                          <span className="text-slate-600 italic">Not Linked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 03: HIGH-RISK DISCREPANCY TASKS ── */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-4 flex items-center gap-2">
          <span>03 — CRITICAL RISK RADAR (DISCREPANCY DETECTION)</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Tasks Flagged by Hybrid ML Engine</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Automatic Telemetry
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {overview?.recentHighRiskTasks?.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All tracked software deliverables are currently within acceptable evidence variance thresholds.
              </div>
            ) : (
              overview?.recentHighRiskTasks?.map((task: any) => (
                <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/70 border border-sky-800/60 px-2 py-0.5 rounded">
                      {task.taskCode}
                    </span>
                    <div>
                      <div className="font-semibold text-sm text-white">{task.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>Project: <strong className="text-slate-300">{task.projectName}</strong></span>
                        <span>Assignee: <strong className="text-slate-300">{task.assigneeName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Reported Progress</div>
                      <div className="text-sm font-bold text-white">{task.progressPercentage}%</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Verified Evidence</div>
                      <div className="text-sm font-bold text-emerald-400">{Math.round(task.progressEvidenceScore || 0)}%</div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500">Delay Probability</div>
                      <div className="text-sm font-bold text-rose-400">{Math.round(task.latestDelayProbability || 0)}%</div>
                    </div>

                    <RiskBadge level={task.latestRiskLevel} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
