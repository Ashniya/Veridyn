import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { 
  FolderGit2, CheckSquare, AlertTriangle, ShieldAlert, GitCommit, 
  Clock, ArrowUpRight, Activity, Cpu, Sparkles, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const Dashboard: React.FC<{ onOpenTask: (id: number) => void }> = ({ onOpenTask }) => {
  const { isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`w-10 h-10 border-2 rounded-full animate-spin mb-4 ${
          isDark ? 'border-slate-700 border-t-sky-400' : 'border-slate-300 border-t-sky-600'
        }`} />
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
            Executive Health & Risk Dashboard
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Real-time multi-signal progress validation combining subtasks, worklogs, dependencies & GitHub commits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isDark 
              ? 'bg-[#131D33] border-slate-700 text-slate-400' 
              : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <Cpu size={14} />
            <span>AI Risk Engine Active</span>
          </span>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchDashboard}
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
        </div>
      </div>

      {/* ── 01: EXECUTIVE OVERVIEW METRIC GRID ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>01 — EXECUTIVE RADAR</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>01</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Projects
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data?.activeProjects || 0}
            </div>
            <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              Out of {data?.totalProjects || 0} Total Initiatives
            </div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>02</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Work Deliverables
            </div>
            <div className={`text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {data?.totalTasks || 0}
            </div>
            <div className="text-[11px] text-sky-500 mt-2 font-medium">Under Active Monitoring</div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>03</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              High Risk Flags
            </div>
            <div className="text-3xl font-bold text-amber-500 mt-1">
              {data?.highRiskTasksCount || 0}
            </div>
            <div className="text-[11px] text-amber-500/90 mt-2 font-medium">
              {data?.stalledTasksCount || 0} Stalled Deliverables
            </div>
          </div>

          <div className={`border rounded-2xl p-5 relative overflow-hidden transition ${
            isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className={`text-3xl font-light mb-1 ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>04</div>
            <div className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Portfolio Evidence
            </div>
            <div className="text-3xl font-bold text-emerald-500 mt-1">
              {Math.round(data?.averageEvidenceScore || 0)}%
            </div>
            <div className="text-[11px] text-emerald-500/90 mt-2 font-medium">Corroborated by VCS Hashes</div>
          </div>
        </div>
      </div>

      {/* ── 02: HIGH RISK RADAR LIST ── */}
      <div>
        <div className={`text-[11px] font-bold tracking-[0.25em] uppercase mb-4 flex items-center gap-2 ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <span>02 — CRITICAL DELAY ALERTS</span>
          <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-xl transition ${
          isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="divide-y divide-slate-800/60">
            {(!data?.recentHighRiskTasks || data?.recentHighRiskTasks.length === 0) ? (
              <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No high-risk discrepancies detected across active sprints.
              </div>
            ) : (
              data.recentHighRiskTasks.map((task: any) => (
                <div key={task.id} className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                      isDark 
                        ? 'text-sky-400 bg-sky-950/70 border-sky-800/60' 
                        : 'text-sky-700 bg-sky-50 border-sky-200'
                    }`}>
                      {task.taskCode}
                    </span>
                    <div>
                      <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</div>
                      <div className={`text-xs mt-0.5 flex items-center gap-3 ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>Project: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{task.projectName}</strong></span>
                        <span>Assignee: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{task.assigneeName}</strong></span>
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
                      <div className="text-sm font-bold text-emerald-500">{Math.round(task.progressEvidenceScore || 0)}%</div>
                    </div>

                    <div>
                      <div className={`text-[10px] uppercase font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Delay Risk</div>
                      <div className="text-sm font-bold text-rose-500">{Math.round(task.latestDelayProbability || 0)}%</div>
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
