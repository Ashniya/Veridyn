import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  Briefcase, UserPlus, FolderGit2, AlertTriangle, CheckSquare, 
  RefreshCw, GitPullRequest, Code, Clock, ArrowUpRight 
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <div className="w-10 h-10 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin mb-4" />
        <span className="text-xs font-bold tracking-[0.25em] text-slate-400 uppercase">
          Synthesizing Project Telemetry…
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto font-['Inter',sans-serif]">
      {/* ── TOP ARCHITECTURAL HEADER ── */}
      <div className="border-b border-dotted border-slate-700/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-slate-400">
              ALLIURE // PROJECT MANAGEMENT
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Sprint Governance & Engineering Velocity
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <strong className="text-white">{user?.fullName}</strong>. Supervise project deliveries, unblock stalled tasks, and invite developers to your projects.
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

          {/* PM-Authorized Developer Provisioning */}
          <Link
            to="/register"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20"
          >
            <UserPlus size={15} />
            <span>+ Invite Developer</span>
          </Link>
        </div>
      </div>

      {/* ── 01: SPRINT DELIVERY METRICS ── */}
      <div>
        <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 mb-4 flex items-center gap-2">
          <span>01 — PORTFOLIO VELOCITY</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">01</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Supervised Projects</div>
            <div className="text-3xl font-bold text-white mt-1">{projects.length}</div>
            <div className="text-[11px] text-slate-500 mt-2">{overview?.totalTasks || 0} Open Work Items</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">02</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Engineering Roster</div>
            <div className="text-3xl font-bold text-sky-400 mt-1">{developers.length}</div>
            <div className="text-[11px] text-sky-400/80 mt-2">Active Developers</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">03</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">At-Risk Deliverables</div>
            <div className="text-3xl font-bold text-rose-400 mt-1">{overview?.highRiskTasksCount || 0}</div>
            <div className="text-[11px] text-rose-400/80 mt-2">{overview?.stalledTasksCount || 0} Stalled Without Git Commits</div>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            <div className="text-3xl font-light text-slate-500 mb-1">04</div>
            <div className="text-xs font-semibold tracking-wider uppercase text-slate-400">Average Evidence Index</div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{Math.round(overview?.averageEvidenceScore || 0)}%</div>
            <div className="text-[11px] text-emerald-400/80 mt-2">Subtasks + Git PR Ground Truth</div>
          </div>
        </div>
      </div>

      {/* ── 02: ACTIVE PROJECTS & HEALTH ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 flex items-center gap-2">
            <span>02 — ACTIVE SPRINT PROJECTS</span>
          </div>
          <Link to="/projects" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition">
            View All Projects &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="bg-[#131D33] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {proj.projectCode || `PRJ-${proj.id}`}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{proj.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                </div>
                <RiskBadge level={proj.calculatedRiskLevel || 1} />
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Self-Reported</div>
                  <div className="text-sm font-bold text-white mt-0.5">{Math.round(proj.overallProgress || 0)}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Verified Evidence</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{Math.round(proj.averageEvidenceScore || 0)}%</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Team Size</div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">{proj.members?.length || 0} Members</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 03: DEVELOPER TEAM & PROVISIONING ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400 flex items-center gap-2">
            <span>03 — DEVELOPER WORKFORCE</span>
          </div>
          <Link
            to="/register"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            + Add Developer Account &rarr;
          </Link>
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1120] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-5">Developer</th>
                <th className="py-3.5 px-5">Specialization</th>
                <th className="py-3.5 px-5">GitHub Telemetry</th>
                <th className="py-3.5 px-5">Account Status</th>
                <th className="py-3.5 px-5 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {developers.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs">
                        {dev.fullName?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{dev.fullName}</div>
                        <div className="text-[11px] text-slate-400">{dev.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-slate-300">
                    {dev.jobTitle || 'Software Engineer'}
                  </td>
                  <td className="py-3.5 px-5">
                    {dev.gitHubUsername ? (
                      <a
                        href={`https://github.com/${dev.gitHubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-mono"
                      >
                        @{dev.gitHubUsername}
                      </a>
                    ) : (
                      <span className="text-slate-600 italic">No GitHub</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Provisioned</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right text-slate-500 font-mono">
                    {new Date(dev.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
