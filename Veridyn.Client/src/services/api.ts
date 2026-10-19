import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('alliure_token') || localStorage.getItem('veridyn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 occurs during login attempt, do not redirect, let form display the error
    if (error.response?.status === 401) {
      if (error.config?.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }
      localStorage.removeItem('alliure_token');
      localStorage.removeItem('alliure_user');
      localStorage.removeItem('veridyn_token');
      localStorage.removeItem('veridyn_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
