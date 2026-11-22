import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit, GitBranch, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
  Zap, AlertTriangle, CheckCircle2, Clock, Copy, Check, Link2
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface Props {
  projectId: number;
  projectKey: string;
  repositoryUrl?: string;
  canSync?: boolean;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export const GitHubIntelligenceStrip: React.FC<Props> = ({
  projectId,
  projectKey,
  repositoryUrl,
  canSync = false,
}) => {
  const { isDark } = useTheme();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [copiedSha, setCopiedSha] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const fetchCommits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/github/commits?projectId=${projectId}`);
      setCommits(res.data || []);
      setLastSynced(new Date().toISOString());
    } catch {
      /* silently skip */
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchCommits(); }, [fetchCommits]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await api.post('/github/sync', { projectId });
      setSyncMsg(res.data?.message || 'Sync complete!');
      await fetchCommits();
    } catch (e: any) {
      setSyncMsg(e.response?.data?.message || 'Sync failed.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  };

  const copy = (sha: string) => {
    navigator.clipboard.writeText(sha);
    setCopiedSha(sha);
    setTimeout(() => setCopiedSha(null), 2000);
  };

  // Derived metrics
  const now = Date.now();
  const recentCommits = commits.filter(c => {
    const d = c.committedAt || c.commitDate || c.date || '';
    return d && (now - new Date(d).getTime()) < 7 * 86400000;
  });
  const linkedCommits = commits.filter(c => c.matchedTaskCode || c.taskCode || c.taskItemCode);
  const linkedPct = commits.length > 0 ? Math.round((linkedCommits.length / commits.length) * 100) : 0;
  const noActivity = recentCommits.length === 0 && commits.length > 0;
  const visibleCommits = expanded ? commits.slice(0, 30) : commits.slice(0, 5);

  const healthColor = noActivity
    ? 'text-amber-400'
    : recentCommits.length >= 3
    ? 'text-emerald-400'
    : 'text-sky-400';

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${
      isDark ? 'bg-[#0D1527] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {/* ── HEADER BAR ── */}
      <div className={`px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b ${
        isDark ? 'border-slate-800 bg-gradient-to-r from-[#131D33] to-[#0D1527]' : 'border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50'
      }`}>
        <div className="flex items-center gap-3">
          {/* Pulsing status dot */}
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md shadow-sky-500/20 shrink-0">
            <GitBranch size={18} className="text-white" />
            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 ${
              isDark ? 'border-[#0D1527]' : 'border-white'
            } ${noActivity ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                GitHub Intelligence
              </h3>
              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-sky-950/70 text-sky-400 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {projectKey}
              </span>
              {noActivity && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded-full">
                  <AlertTriangle size={10} /> No activity (7d)
                </span>
              )}
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {loading ? 'Loading commit data…' : (
                <>
                  <span className={`font-bold ${healthColor}`}>{recentCommits.length}</span> commits this week &nbsp;·&nbsp;
                  <span className="font-bold text-emerald-400">{linkedPct}%</span> linked to tasks &nbsp;·&nbsp;
                  <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>
                    {commits.length} total
                  </span>
                  {lastSynced && (
                    <>&nbsp;·&nbsp; synced {timeAgo(lastSynced)}</>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Health stat pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isDark ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <CheckCircle2 size={10} /> {linkedCommits.length} linked
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              isDark ? 'bg-sky-950/50 text-sky-400 border-sky-800/60' : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              <Zap size={10} /> {recentCommits.length} recent
            </span>
          </div>

          {syncMsg && (
            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl border ${
              syncMsg.toLowerCase().includes('fail') || syncMsg.toLowerCase().includes('error')
                ? 'text-rose-400 border-rose-800 bg-rose-950/50'
                : 'text-emerald-400 border-emerald-800 bg-emerald-950/50'
            }`}>
              {syncMsg}
            </span>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchCommits}
            disabled={loading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
              isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </motion.button>

          {canSync && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition shadow-md ${
                isDark
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
              }`}
            >
              <GitBranch size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync GitHub'}
            </motion.button>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition ${
              isDark ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : 'border-slate-300 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Collapse' : `View all ${commits.length}`}
          </button>
        </div>
      </div>

      {/* ── COMMIT FEED ── */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="flex items-center gap-3 py-4 px-2">
            <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
              isDark ? 'border-slate-700 border-t-sky-400' : 'border-slate-200 border-t-sky-600'
            }`} />
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Querying commit history…
            </span>
          </div>
        ) : commits.length === 0 ? (
          <div className={`flex items-center gap-3 py-4 px-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <GitCommit size={16} />
            <span>No commits synced yet.{canSync ? ' Click "Sync GitHub" to pull latest activity.' : ' Ask your PM to trigger a sync.'}</span>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className={`absolute left-[18px] top-4 bottom-4 w-px ${
              isDark ? 'bg-gradient-to-b from-sky-500/50 via-indigo-500/30 to-transparent' : 'bg-gradient-to-b from-sky-300/60 via-indigo-300/30 to-transparent'
            }`} />

            <div className="space-y-2 pl-10">
              <AnimatePresence>
                {visibleCommits.map((commit: any, idx: number) => {
                  const sha = commit.commitSha || commit.sha || '';
                  const shortSha = sha.slice(0, 7);
                  const message = commit.message || commit.commitMessage || '';
                  const author = commit.authorName || commit.author || 'Unknown';
                  const dateStr = commit.commitDate || commit.committedAt || commit.date || '';
                  const taskCode = commit.matchedTaskCode || commit.taskCode || commit.taskItemCode || null;
                  const linesAdded = commit.linesAdded || 0;
                  const linesDeleted = commit.linesDeleted || 0;
                  const isCopied = copiedSha === sha;
                  const commitUrl = repositoryUrl && sha
                    ? `${repositoryUrl.replace(/\/$/, '')}/commit/${sha}`
                    : commit.htmlUrl;

                  return (
                    <motion.div
                      key={sha || idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all group ${
                        isDark
                          ? 'bg-[#131D33]/60 border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Timeline node */}
                      <div className="absolute -left-[34px] top-3.5 w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-sky-500/20 shrink-0" />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* SHA */}
                          <button
                            onClick={() => copy(sha)}
                            className={`flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border transition ${
                              isCopied
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : isDark
                                ? 'bg-sky-950/60 text-sky-400 border-sky-800/60 hover:bg-sky-900/60'
                                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100'
                            }`}
                            title="Copy SHA"
                          >
                            {isCopied ? <Check size={9} /> : <Copy size={9} />}
                            {shortSha}
                          </button>

                          {/* Task code link */}
                          {taskCode && (
                            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                              isDark ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <Link2 size={9} /> {taskCode}
                            </span>
                          )}

                          {/* Lines changed */}
                          {(linesAdded > 0 || linesDeleted > 0) && (
                            <span className="text-[10px] font-mono font-bold">
                              <span className="text-emerald-400">+{linesAdded}</span>
                              {' '}
                              <span className="text-rose-400">-{linesDeleted}</span>
                            </span>
                          )}

                          {/* Timestamp */}
                          {dateStr && (
                            <span className={`text-[10px] flex items-center gap-1 ml-auto ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              <Clock size={9} />
                              {timeAgo(dateStr)}
                            </span>
                          )}
                        </div>

                        {/* Commit message */}
                        <p className={`text-xs font-medium leading-snug line-clamp-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            by <strong className={isDark ? 'text-slate-300' : 'text-slate-600'}>{author}</strong>
                          </span>
                          {commitUrl && (
                            <a
                              href={commitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`opacity-0 group-hover:opacity-100 text-[10px] flex items-center gap-1 transition ${
                                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-800'
                              }`}
                            >
                              View <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {!expanded && commits.length > 5 && (
                <button
                  onClick={() => setExpanded(true)}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl border border-dashed transition ${
                    isDark
                      ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50'
                      : 'border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  + Show {commits.length - 5} more commits
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
