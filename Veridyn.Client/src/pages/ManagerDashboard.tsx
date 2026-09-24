import React from 'react';
import { useAuth } from '../context/AuthContext';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Project Manager Dashboard</h1>
      <p className="text-slate-300 mt-2">
        Welcome, {user?.fullName}. Here you can manage your assigned projects, create tasks, and monitor progress.
      </p>
    </div>
  );
};
