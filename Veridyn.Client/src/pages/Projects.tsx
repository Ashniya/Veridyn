import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { FolderGit2, Plus, Users, Clock, Calendar, CheckSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Projects: React.FC<{ onSelectProject: (id: number) => void }> = ({ onSelectProject }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    budgetHours: 120,
    targetEndDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    gitHubRepoOwner: 'veridyn-corp',
    gitHubRepoName: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        ...formData,
        targetEndDate: new Date(formData.targetEndDate)
      });
      setShowCreateModal(false);
      fetchProjects();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating project');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Software Projects Portfolio</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track multi-signal evidence, team allocation, and predictive delay risk per project repository.
          </p>
        </div>
        {(user?.role === 1 || user?.role === 2) && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg shadow-sky-600/30 transition"
          >
            <Plus size={16} />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div 
            key={p.id}
            onClick={() => onSelectProject(p.id)}
            className="bg-[#131D33] border border-slate-800 hover:border-sky-600/60 rounded-xl p-5 space-y-4 cursor-pointer transition shadow-lg group"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 border border-sky-800 px-2 py-0.5 rounded">
                  {p.key}
                </span>
                <h3 className="font-bold text-base text-white group-hover:text-sky-300 mt-2">{p.name}</h3>
              </div>
              <RiskBadge riskLevel={p.projectRiskLevel} />
            </div>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-400">Progress Completion:</span>
                <span className="text-white font-bold">{p.overallProgressPercentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" 
                  style={{ width: `${p.overallProgressPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Tasks</div>
                <div className="font-bold text-slate-200 mt-0.5">{p.completedTasks}/{p.totalTasks}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-rose-400">Stalled</div>
                <div className="font-bold text-rose-400 mt-0.5">{p.stalledTasksCount}</div>
              </div>
              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">Members</div>
                <div className="font-bold text-slate-200 mt-0.5">{p.memberCount}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                <span>Due {new Date(p.targetEndDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>{p.totalActualHours}h / {p.budgetHours}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#18233C] border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Distributed Auth Engine"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Key (2-5 letters)</label>
                  <input 
                    required
                    maxLength={5}
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
                    placeholder="e.g. DAE"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Budget Hours</label>
                  <input 
                    type="number"
                    value={formData.budgetHours}
                    onChange={(e) => setFormData({ ...formData, budgetHours: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Goals, deliverables and scope..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target End Date</label>
                  <input 
                    type="date"
                    value={formData.targetEndDate}
                    onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">GitHub Repo Name</label>
                  <input 
                    value={formData.gitHubRepoName}
                    onChange={(e) => setFormData({ ...formData, gitHubRepoName: e.target.value })}
                    placeholder="e.g. auth-engine"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
