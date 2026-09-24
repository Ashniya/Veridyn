import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleProtected: React.FC<RoleProtectedProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (allowedRoles.includes(user.roleName)) {
    return <>{children}</>;
  }
  // fallback to generic dashboard
  return <Navigate to="/dashboard" replace />;
};
