import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';

interface Props {
  riskLevel?: number | string; // 1: Low, 2: Med, 3: High, 4: Critical
  level?: number | string;
  delayProbability?: number;
}

export const RiskBadge: React.FC<Props> = ({ riskLevel, level, delayProbability }) => {
  const effectiveLevel = riskLevel ?? level ?? 1;
  const levelStr = typeof effectiveLevel === 'number' 
    ? (effectiveLevel === 4 ? 'Critical' : effectiveLevel === 3 ? 'High' : effectiveLevel === 2 ? 'Medium' : 'Low')
    : effectiveLevel;

  const styles = {
    Critical: 'bg-rose-950/60 border-rose-700/80 text-rose-300',
    High: 'bg-amber-950/60 border-amber-700/80 text-amber-300',
    Medium: 'bg-yellow-950/50 border-yellow-700/70 text-yellow-300',
    Low: 'bg-emerald-950/50 border-emerald-700/70 text-emerald-300'
  }[levelStr] || 'bg-slate-800 border-slate-700 text-slate-300';

  const icons = {
    Critical: <Flame size={12} className="text-rose-400 animate-pulse" />,
    High: <AlertCircle size={12} className="text-amber-400" />,
    Medium: <AlertTriangle size={12} className="text-yellow-400" />,
    Low: <CheckCircle2 size={12} className="text-emerald-400" />
  }[levelStr];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-sm ${styles}`}>
      {icons}
      <span>{levelStr} Risk</span>
      {delayProbability !== undefined && (
        <span className="opacity-80 text-[10px]">({Math.round(delayProbability)}% delay)</span>
      )}
    </span>
  );
};
