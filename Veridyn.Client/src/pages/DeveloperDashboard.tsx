import React from 'react';
import { useAuth } from '../context/AuthContext';

export const DeveloperDashboard: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Developer Dashboard</h1>
      <p className="text-slate-300 mt-2">
        Hello, {user?.fullName}. View your assigned tasks, log work, and see GitHub activity.
      </p>
    </div>
  );
};
