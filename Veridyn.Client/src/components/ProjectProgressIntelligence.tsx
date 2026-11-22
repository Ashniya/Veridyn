import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Clock,
  Users, GitCommit, Target, Zap, BarChart2, ArrowRight, Shield
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { RiskBadge } from './RiskBadge';

interface Props {
  project: any;       // full project object from API
  commits: any[];     // commits from /api/github/commits
}

function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function formatDate(d: string | null | undefined): string {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Build a list of PM recommendations from project data
function buildPMRecommendations(project: any, commits: any[]): { icon: any; color: string; text: string }[] {
  const recs: { icon: any; color: string; text: string }[] = [];
  const now = Date.now();

  // Stalled tasks
  const stalledTasks = (project.tasks || []).filter((t: any) => t.isPotentiallyStalled);
  if (stalledTasks.length > 0) {
    recs.push({
      icon: AlertTriangle,
      color: 'text-amber-400',
      text: `${stalledTasks.length} task${stalledTasks.length > 1 ? 's are' : ' is'} potentially stalled with no recent commits or work logs. Review: ${stalledTasks.slice(0, 2).map((t: any) => t.taskCode).join(', ')}.`,
    });
  }

  // High risk tasks
  const highRisk = (project.tasks || []).filter((t: any) => t.latestRiskLevel === 'High' || t.latestRiskLevel === 'Critical' || t.latestRiskLevel === 3 || t.latestRiskLevel === 4);
  if (highRisk.length > 0) {
    recs.push({
      icon: Shield,
      color: 'text-rose-400',
      text: `${highRisk.length} task${highRisk.length > 1 ? 's have' : ' has'} High/Critical delay risk. Consider redistributing work or adjusting scope.`,
    });
  }

  // Overdue tasks
  const overdue = (project.tasks || []).filter((t: any) => {
    const due = t.dueDate;
    return due && new Date(due).getTime() < now && t.status !== 2 && t.status !== 'Completed';
  });
  if (overdue.length > 0) {
    recs.push({
      icon: Clock,
      color: 'text-rose-400',
      text: `${overdue.length} task${overdue.length > 1 ? 's are' : ' is'} past due date without being marked complete. Immediate action required.`,
    });
  }

  // No recent commits in 7d
  const recentCommits = commits.filter(c => {
    const d = c.commitDate || c.committedAt || c.date || '';
    return d && (now - new Date(d).getTime()) < 7 * 86400000;
  });
  if (recentCommits.length === 0 && commits.length > 0) {
    recs.push({
      icon: GitCommit,
      color: 'text-amber-400',
      text: 'No GitHub commits in the last 7 days. Team may be blocked, idle, or working on undocumented tasks.',
    });
  }

  // Low evidence score
  const avgEvidence = project.overallEvidenceScore || 0;
  if (avgEvidence < 40 && (project.totalTasks || 0) > 0) {
    recs.push({
      icon: BarChart2,
      color: 'text-sky-400',
      text: `Evidence score is ${Math.round(avgEvidence)}% — below threshold. Ensure developers link commits to task codes and log work hours.`,
    });
  }

  // Project deadline approaching
  if (project.targetEndDate) {
    const daysLeft = daysBetween(new Date(), project.targetEndDate);
    const completedPct = project.overallProgressPercentage || 0;
    if (daysLeft <= 14 && daysLeft > 0 && completedPct < 70) {
      recs.push({
        icon: Target,
        color: 'text-amber-400',
        text: `Only ${daysLeft} days to deadline with ${Math.round(completedPct)}% progress. Recommend daily standups and scope review.`,
      });
    }
  }

  if (recs.length === 0) {
    recs.push({
      icon: CheckCircle2,
      color: 'text-emerald-400',
      text: 'Project is progressing well. No immediate action items detected. Keep monitoring commit velocity and evidence scores.',
    });
  }

  return recs;
}

export const ProjectProgressIntelligence: React.FC<Props> = ({ project, commits }) => {
  const { isDark } = useTheme();
  const now = Date.now();

  // ── DERIVED METRICS ──
  const tasks = project.tasks || [];
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 2 || t.status === 'Completed').length;
  const inProgressTasks = tasks.filter((t: any) => t.status === 1 || t.status === 'InProgress').length;
  const stalledTasks = tasks.filter((t: any) => t.isPotentiallyStalled).length;
  const overdueCount = tasks.filter((t: any) => {
    const due = t.dueDate;
    return due && new Date(due).getTime() < now && t.status !== 2 && t.status !== 'Completed';
  }).length;

  const reportedProgress = project.overallProgressPercentage || 0;
  const evidenceScore = project.overallEvidenceScore || 0;

  // Schedule variance
  const startDate = project.startDate || project.createdAt;
  const endDate = project.targetEndDate;
  let scheduleVariance = 0;
  let expectedProgress = 0;
  let daysLeft = 0;
  let forecastDate: string | null = null;

  if (startDate && endDate) {
    const totalDays = daysBetween(startDate, endDate);
    const elapsedDays = daysBetween(startDate, new Date());
    expectedProgress = Math.min(100, (elapsedDays / Math.max(totalDays, 1)) * 100);
    scheduleVariance = reportedProgress - expectedProgress;
    daysLeft = Math.max(0, daysBetween(new Date(), endDate));

    // Velocity-based forecast
    const velocity = completedTasks > 0 && elapsedDays > 0
      ? elapsedDays / completedTasks
      : null;
    if (velocity && completedTasks < totalTasks) {
      const remainingTasks = totalTasks - completedTasks;
      const projectedDaysNeeded = remainingTasks * velocity;
      const forecastMs = now + projectedDaysNeeded * 86400000;
      forecastDate = new Date(forecastMs).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } else if (completedTasks >= totalTasks) {
      forecastDate = 'All tasks complete!';
    }
  }

  // Developer workload
  const members = project.members || [];
  const devWorkloads = useMemo(() => {
    return members.map((m: any) => {
      const assignedTasks = tasks.filter((t: any) => t.assigneeId === m.userId || t.assigneeName === m.fullName);
      const completedByDev = assignedTasks.filter((t: any) => t.status === 2 || t.status === 'Completed').length;
      const totalHrs = assignedTasks.reduce((s: number, t: any) => s + (t.estimatedHours || 0), 0);
      const devEvidence = assignedTasks.length > 0
        ? Math.round(assignedTasks.reduce((s: number, t: any) => s + (t.progressEvidenceScore || 0), 0) / assignedTasks.length)
        : 0;
      return {
        ...m,
        assignedCount: assignedTasks.length,
        completedCount: completedByDev,
        totalHours: totalHrs,
        evidenceScore: devEvidence,
      };
    }).filter((m: any) => m.assignedCount > 0);
  }, [members, tasks]);

  // PM recommendations
  const recommendations = useMemo(() => buildPMRecommendations(project, commits), [project, commits]);

  // Blocked tasks (stalled + overdue)
  const blockedTasks = tasks.filter((t: any) =>
    t.isPotentiallyStalled ||
    (t.dueDate && new Date(t.dueDate).getTime() < now && t.status !== 2 && t.status !== 'Completed')
  ).slice(0, 8);

  const card = `p-5 rounded-2xl border transition-all ${
    isDark ? 'bg-[#131D33] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  }`;

  return (
    <div className="space-y-5">

      {/* ── ROW 1: SCHEDULE HEALTH ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reported Progress */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className={card}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Reported Progress
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {Math.round(reportedProgress)}%
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
              style={{ width: `${Math.min(reportedProgress, 100)}%` }}
            />
          </div>
          <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {completedTasks}/{totalTasks} tasks done
          </div>
        </motion.div>

        {/* Expected (Schedule-Based) Progress */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={card}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Expected (Schedule)
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {Math.round(expectedProgress)}%
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800/40 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all"
              style={{ width: `${Math.min(expectedProgress, 100)}%` }}
            />
          </div>
          <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {daysLeft > 0 ? `${daysLeft}d remaining` : endDate ? 'Deadline passed' : 'No deadline set'}
          </div>
        </motion.div>

        {/* Schedule Variance */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Schedule Variance
          </div>
          <div className={`text-3xl font-black flex items-center gap-2 ${
            scheduleVariance >= 5 ? 'text-emerald-400' :
            scheduleVariance >= -5 ? 'text-amber-400' :
            'text-rose-400'
          }`}>
            {scheduleVariance > 0 ? <TrendingUp size={22} /> : scheduleVariance < 0 ? <TrendingDown size={22} /> : null}
            {scheduleVariance > 0 ? '+' : ''}{Math.round(scheduleVariance)}%
          </div>
          <div className={`text-[11px] mt-3 font-semibold ${
            scheduleVariance >= 5 ? 'text-emerald-400' : scheduleVariance >= -5 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {scheduleVariance >= 10 ? '🚀 Ahead of schedule' :
             scheduleVariance >= 0 ? '✅ On track' :
             scheduleVariance >= -15 ? '⚠️ Slightly behind' :
             '🔴 Significantly behind'}
          </div>
        </motion.div>

        {/* Forecast Completion */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={card}>
          <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Forecast Completion
          </div>
          <div className={`text-sm font-black mt-1 ${
            forecastDate === 'All tasks complete!' ? 'text-emerald-400' : isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {forecastDate || 'Calculating…'}
          </div>
          {endDate && forecastDate && forecastDate !== 'All tasks complete!' && (
            <div className={`text-[11px] mt-2 font-semibold ${
              new Date(forecastDate) <= new Date(endDate) ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              Target: {formatDate(endDate)}
            </div>
          )}
          <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Based on current velocity
          </div>
        </motion.div>
      </div>

      {/* ── ROW 2: PLANNED vs ACTUAL VISUAL ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={card}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <BarChart2 size={16} className="text-sky-400" />
          Planned vs. Actual Progress
        </h3>
        <div className="space-y-3">
          {/* Planned */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Expected (schedule-based)
              </span>
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {Math.round(expectedProgress)}%
              </span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-500 to-slate-400 transition-all"
                style={{ width: `${Math.min(expectedProgress, 100)}%` }}
              />
            </div>
          </div>
          {/* Actual reported */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Reported progress
              </span>
              <span className="text-[11px] font-bold text-sky-400">{Math.round(reportedProgress)}%</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                style={{ width: `${Math.min(reportedProgress, 100)}%` }}
              />
            </div>
          </div>
          {/* Evidence score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Evidence score (verified by GitHub + work logs)
              </span>
              <span className="text-[11px] font-bold text-emerald-400">{Math.round(evidenceScore)}%</span>
            </div>
            <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${Math.min(evidenceScore, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Key stats row */}
        <div className={`mt-4 pt-4 border-t grid grid-cols-2 sm:grid-cols-4 gap-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          {[
            { label: 'Completed', val: completedTasks, color: 'text-emerald-400' },
            { label: 'In Progress', val: inProgressTasks, color: 'text-sky-400' },
            { label: 'Stalled', val: stalledTasks, color: 'text-amber-400' },
            { label: 'Overdue', val: overdueCount, color: 'text-rose-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <div className={`text-xl font-black ${color}`}>{val}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── ROW 3: DEVELOPER WORKLOAD + BLOCKED TASKS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Developer Workload */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={card}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Users size={16} className="text-indigo-400" />
            Developer Workload
          </h3>
          {devWorkloads.length === 0 ? (
            <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No assigned tasks found for team members.</p>
          ) : (
            <div className="space-y-3">
              {devWorkloads.map((dev: any) => {
                const load = dev.totalHours;
                const maxLoad = Math.max(...devWorkloads.map((d: any) => d.totalHours), 1);
                const pct = Math.round((load / maxLoad) * 100);
                const completionPct = dev.assignedCount > 0 ? Math.round((dev.completedCount / dev.assignedCount) * 100) : 0;
                const initials = (dev.fullName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={dev.userId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {dev.fullName}
                        </span>
                        <span className={`text-[10px] font-mono ml-2 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {dev.assignedCount} tasks · {load}h · ev {dev.evidenceScore}%
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct > 80 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {completionPct}% tasks complete
                        {pct > 80 && <span className="ml-2 text-amber-400 font-semibold">⚠ High load</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Blocked / Stalled Tasks */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={card}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <AlertTriangle size={16} className="text-amber-400" />
            Blocked & Stalled Tasks
            {blockedTasks.length > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                {blockedTasks.length}
              </span>
            )}
          </h3>
          {blockedTasks.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 size={16} />
              No stalled or blocked tasks detected. Great work!
            </div>
          ) : (
            <div className="space-y-2">
              {blockedTasks.map((t: any) => {
                const isOverdue = t.dueDate && new Date(t.dueDate).getTime() < now;
                return (
                  <div key={t.id} className={`p-3 rounded-xl border transition-all ${
                    isDark ? 'bg-[#0B1120] border-slate-800 hover:border-amber-800/40' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        isDark ? 'text-sky-400 bg-sky-950/60 border-sky-800' : 'text-sky-700 bg-sky-50 border-sky-200'
                      }`}>
                        {t.taskCode}
                      </span>
                      {t.isPotentiallyStalled && (
                        <span className="text-[10px] font-bold text-amber-400">STALLED</span>
                      )}
                      {isOverdue && (
                        <span className="text-[10px] font-bold text-rose-400">OVERDUE</span>
                      )}
                      <RiskBadge level={t.latestRiskLevel} />
                    </div>
                    <p className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.title}
                    </p>
                    {t.stallReason && (
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {t.stallReason}
                      </p>
                    )}
                    <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Assignee: {t.assigneeName || 'Unassigned'} · Due: {formatDate(t.dueDate)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── ROW 4: PM RECOMMENDATIONS ── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={card}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Zap size={16} className="text-amber-400" />
          PM Action Items
          <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            isDark ? 'bg-amber-950/40 text-amber-400 border-amber-800/50' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            AI-Derived from Evidence Data
          </span>
        </h3>
        <div className="space-y-3">
          {recommendations.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                  isDark ? 'bg-[#0B1120] border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Icon size={15} className={`${rec.color} shrink-0 mt-0.5`} />
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {rec.text}
                </p>
                <ArrowRight size={14} className={`${rec.color} shrink-0 mt-0.5 ml-auto`} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
