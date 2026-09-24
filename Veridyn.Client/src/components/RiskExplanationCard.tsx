import React from 'react';
import { AlertOctagon, GitCommit, Clock, GitBranch, Calendar } from 'lucide-react';

interface RiskFactor {
  factor: string;
  severity: string;
  impactScore: number;
  details: string;
  category: string;
}

interface Props {
  factors: RiskFactor[];
  delayProbability: number;
  calculationMethod: string;
}

export const RiskExplanationCard: React.FC<Props> = ({ factors, delayProbability, calculationMethod }) => {
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'github': return <GitCommit size={14} className="text-purple-400" />;
      case 'worklog': return <Clock size={14} className="text-blue-400" />;
      case 'dependencies': return <GitBranch size={14} className="text-rose-400" />;
      case 'schedule': return <Calendar size={14} className="text-amber-400" />;
      default: return <AlertOctagon size={14} className="text-sky-400" />;
    }
  };

  return (
    <div className="bg-[#131D33] border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h4 className="text-sm font-semibold text-white">Why is this Task at Risk? (Transparent AI Insights)</h4>
          <p className="text-xs text-slate-400 mt-0.5">Calculated via {calculationMethod}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Delay Risk: </span>
          <span className="text-sm font-bold text-rose-400">{Math.round(delayProbability)}%</span>
        </div>
      </div>

      <div className="space-y-2">
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 text-xs">
            <div className="mt-0.5">{getCategoryIcon(f.category)}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{f.factor}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  f.severity === 'Critical' ? 'bg-rose-950 text-rose-300' :
                  f.severity === 'High' ? 'bg-amber-950 text-amber-300' :
                  f.severity === 'Medium' ? 'bg-yellow-950 text-yellow-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {f.severity}
                </span>
              </div>
              <p className="text-slate-400 mt-1 leading-relaxed">{f.details}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
