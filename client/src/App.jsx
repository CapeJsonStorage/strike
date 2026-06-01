import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
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
