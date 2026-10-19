import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, CheckSquare, GitPullRequest, Clock, ShieldCheck, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role; // 1 = Admin, 2 = PM, 3 = Dev

  const navItems = [
    { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects Health', path: '/projects', icon: FolderGit2 },
  ];

  if (role === 1 || user?.roleName === 'Admin') {
    navItems.push({ label: 'Admin Governance', path: '/admin', icon: ShieldCheck });
  } else if (role === 2 || user?.roleName === 'ProjectManager') {
    navItems.push({ label: 'Manager Workbench', path: '/manager', icon: ShieldCheck });
  } else if (role === 3 || user?.roleName === 'Developer') {
    navItems.push({ label: 'Dev Workbench', path: '/dev', icon: CheckSquare });
  }

  return (
    <aside className="w-64 bg-[#0F172A] border-r border-slate-800/80 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-sky-600 text-white font-semibold shadow-lg shadow-sky-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 m-3 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80">
        <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold mb-1">
          <Cpu size={14} className="animate-pulse" />
          <span>Visual Studio 2022</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          ASP.NET Core Web API + SQL Server LocalDB + Scikit-Learn Hybrid Engine.
        </p>
      </div>
    </aside>
  );
};
