import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  FolderGit2, CheckSquare, AlertTriangle, ShieldAlert, GitCommit, 
  Clock, ArrowUpRight, Activity, Cpu, Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC<{ onOpenTask: (id: number) => void }> = ({ onOpenTask }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Health & Risk Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-signal progress validation combining subtasks, worklogs, dependencies & GitHub commits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-sky-950/80 border border-sky-800/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-400">
            <Cpu size={14} />
            <span>AI Risk Model Active</span>
          </span>
          <button 
            onClick={fetchDashboard}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* 4 Core Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131D33] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Active Projects</div>
            <div className="text-2xl font-bold text-white mt-1">{data?.activeProjects} / {data?.totalProjects}</div>
            <div className="text-[11px] text-slate-500 mt-1">{data?.totalTasks} Total Tracked Tasks</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-sky-950 border border-sky-800/60 flex items-center justify-center text-sky-400">
            <FolderGit2 size={22} />
          </div>
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Potentially Stalled</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{data?.stalledTasksCount}</div>
            <div className="text-[11px] text-rose-400/80 mt-1">In-Progress with no commits/logs</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <ShieldAlert size={22} />
          </div>
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">High / Critical Risk Tasks</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{data?.highRiskTasksCount}</div>
            <div className="text-[11px] text-amber-400/80 mt-1">Avg Delay Risk: {Math.round(data?.overallProjectDelayRisk || 0)}%</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-amber-950 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-[#131D33] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-400">Avg Evidence Score</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{Math.round(data?.averageEvidenceScore || 0)}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{data?.totalGitHubCommits} Commits &bull; {data?.totalWorkLogsLogged} Work Logs</div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Activity size={22} />
          </div>
        </div>
      </div>

      {/* Projects Overview Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Project Portfolio Health</h2>
          <Link to="/projects" className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1">
            View All Projects <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.projectsOverview?.map((p: any) => (
            <div key={p.id} className="bg-[#131D33] border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                    {p.key}
                  </span>
                  <h3 className="font-semibold text-sm text-white mt-1.5">{p.name}</h3>
                </div>
                <RiskBadge riskLevel={p.projectRiskLevel} />
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Progress:</span>
                  <span className="font-semibold text-white">{p.overallProgressPercentage}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" 
                    style={{ width: `${p.overallProgressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs text-slate-400">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-slate-200">{p.completedTasks}/{p.totalTasks}</div>
                  <div className="text-[10px]">Tasks</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-rose-400">{p.stalledTasksCount}</div>
                  <div className="text-[10px]">Stalled</div>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                  <div className="font-bold text-amber-400">{p.highRiskTasksCount}</div>
                  <div className="text-[10px]">High Risk</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical & Potentially Stalled Tasks Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="text-rose-400" size={18} />
              <span>Priority Attention & Stalled Tasks</span>
            </h2>
            <Link to="/tasks" className="text-xs font-medium text-sky-400 hover:text-sky-300">
              Explore All Tasks &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.criticalAndStalledTasks?.map((t: any) => (
              <div 
                key={t.id}
                onClick={() => onOpenTask(t.id)}
                className="bg-[#131D33] border border-slate-800 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {t.taskCode}
                    </span>
                    <h4 className="font-semibold text-sm text-white hover:text-sky-300">{t.title}</h4>
                  </div>
                  <RiskBadge riskLevel={t.latestRiskLevel} delayProbability={t.latestDelayProbability} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <EvidenceMeter 
                    evidenceScore={t.progressEvidenceScore} 
                    reportedProgress={t.progressPercentage} 
                    isStalled={t.isPotentiallyStalled} 
                  />
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Assignee: <strong className="text-slate-200">{t.assigneeName || 'Unassigned'}</strong></div>
                    <div>Due Date: <strong className="text-slate-200">{new Date(t.dueDate).toLocaleDateString()}</strong></div>
                    {t.riskExplanationSummary && (
                      <div className="text-[11px] text-amber-300/90 font-medium">
                        &bull; {t.riskExplanationSummary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live GitHub Evidence Activity Stream */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <GitCommit className="text-purple-400" size={18} />
              <span>Recent GitHub Evidence</span>
            </h2>
            <Link to="/github" className="text-xs text-sky-400 hover:text-sky-300">
              View Stream
            </Link>
          </div>

          <div className="bg-[#131D33] border border-slate-800 rounded-xl p-3 divide-y divide-slate-800/80">
            {data?.recentActivity?.map((c: any) => (
              <div key={c.id} className="py-2.5 first:pt-1 last:pb-1 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-sky-400 font-medium">{c.commitSha}</span>
                  <span className="text-slate-500">{new Date(c.commitDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed">{c.message}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <span>Author: <strong className="text-slate-300">{c.authorName}</strong></span>
                  {c.matchedTaskCode && (
                    <span className="bg-slate-900 border border-slate-800 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {c.matchedTaskCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
