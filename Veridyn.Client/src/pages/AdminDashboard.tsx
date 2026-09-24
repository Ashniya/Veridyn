import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { RiskBadge } from '../components/RiskBadge';
import { EvidenceMeter } from '../components/EvidenceMeter';
import { FolderGit2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.roleName === 'Admin') fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/overview');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard – System Overview</h1>
      <div className="mb-4">
        <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-500 transition">
          <span>+ Create New User</span>
        </Link>
      </div>
      {/* Re‑use existing summary cards – same as generic Dashboard */}
      {/* ... (you can copy the core summary UI from the generic Dashboard) */}
    </div>
  );
};
