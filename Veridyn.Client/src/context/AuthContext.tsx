import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: number | string;
  roleName: string;
  jobTitle?: string;
  avatarUrl?: string;
  gitHubUsername?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('alliure_token') || localStorage.getItem('veridyn_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('alliure_user') || localStorage.getItem('veridyn_user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        logout();
      }
    }
    setIsLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    const roleName = typeof userData.role === 'string' ? userData.role : (() => {
      const map: { [key: number]: string } = { 1: 'Admin', 2: 'ProjectManager', 3: 'Developer' };
      return map[userData.role] ?? 'Admin';
    })();
    const enrichedUser = { ...userData, roleName };
    localStorage.setItem('alliure_token', jwtToken);
    localStorage.setItem('veridyn_token', jwtToken);
    localStorage.setItem('alliure_user', JSON.stringify(enrichedUser));
    localStorage.setItem('veridyn_user', JSON.stringify(enrichedUser));
    setToken(jwtToken);
    setUser(enrichedUser);
  };

  const logout = () => {
    localStorage.removeItem('alliure_token');
    localStorage.removeItem('alliure_user');
    localStorage.removeItem('veridyn_token');
    localStorage.removeItem('veridyn_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
