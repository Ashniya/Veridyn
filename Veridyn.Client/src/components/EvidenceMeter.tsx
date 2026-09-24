import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

interface Props {
  evidenceScore: number;
  reportedProgress: number;
  isStalled: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const EvidenceMeter: React.FC<Props> = ({ evidenceScore, reportedProgress, isStalled, size = 'md' }) => {
  const diff = reportedProgress - evidenceScore;
  const isDivergent = diff > 25 && reportedProgress > 30;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Progress Evidence:</span>
          <span className={`font-bold ${evidenceScore >= 70 ? 'text-emerald-400' : evidenceScore >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
            {Math.round(evidenceScore)}%
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Reported: <strong className="text-slate-200">{Math.round(reportedProgress)}%</strong>
        </span>
      </div>

      {/* Comparative Multi-Signal Bar */}
      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
        {/* Reported bar background */}
        <div 
          className="h-full bg-slate-600/40 absolute top-0 left-0 transition-all duration-500" 
          style={{ width: `${Math.min(100, Math.max(0, reportedProgress))}%` }} 
        />
        {/* Objective evidence score bar */}
        <div 
          className={`h-full absolute top-0 left-0 transition-all duration-500 ${
            evidenceScore >= 70 ? 'bg-emerald-500' : evidenceScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'
          }`} 
          style={{ width: `${Math.min(100, Math.max(0, evidenceScore))}%` }} 
        />
      </div>

      {isStalled ? (
        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/60 px-2 py-0.5 rounded">
          <ShieldAlert size={12} />
          <span>Potentially Stalled</span>
        </div>
      ) : isDivergent ? (
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded">
          <AlertTriangle size={11} />
          <span>Evidence Gap ({Math.round(diff)}% gap)</span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded">
          <CheckCircle size={11} />
          <span>Evidence Verified</span>
        </div>
      )}
    </div>
  );
};
