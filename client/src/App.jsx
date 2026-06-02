import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NewLaunchpad from './pages/NewLaunchpad.jsx';
import Overview from './pages/Overview.jsx';
import Assets from './pages/Assets.jsx';
import Specifications from './pages/Specifications.jsx';
import Premier from './pages/Premier.jsx';

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// Attach JWT to every fetch call
export function authFetch(url, options = {}) {
  const token = localStorage.getItem('strike_token');
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function TokenHandler({ setUser, setLoading }) {
  const navigate = useNavigate();

  useEffect(() => {
    // Pick up token from Google OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('strike_token', token);
      window.history.replaceState({}, '', '/');
    }

    // Validate token
    authFetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return null;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function logout() {
    localStorage.removeItem('strike_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      <BrowserRouter>
        <TokenHandler setUser={setUser} setLoading={setLoading} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewLaunchpad /></ProtectedRoute>} />
          <Route path="/projects/:id/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/projects/:id/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
          <Route path="/projects/:id/specifications" element={<ProtectedRoute><Specifications /></ProtectedRoute>} />
          <Route path="/projects/:id/premier" element={<Premier />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
