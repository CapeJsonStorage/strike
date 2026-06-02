import { authFetch } from '../App.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

const STATUS_COLORS = {
  active: { color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  archived: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  trash: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

function CardMenu({ project, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const actions = [];
  if (project.status !== 'active')   actions.push({ label: 'Restore to Active', value: 'active' });
  if (project.status !== 'archived') actions.push({ label: 'Move to Archived', value: 'archived' });
  if (project.status !== 'trash')    actions.push({ label: 'Move to Trash', value: 'trash', danger: true });

  return (
    <div ref={ref} style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
          padding: '2px 6px', borderRadius: 4,
        }}
        title="Project actions"
      >
        ⋯
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 100,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          minWidth: 170,
          overflow: 'hidden',
        }}>
          {actions.map(a => (
            <button
              key={a.value}
              onClick={() => { setOpen(false); onStatusChange(project.id, a.value); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', background: 'none', border: 'none',
                fontSize: 13, cursor: 'pointer',
                color: a.danger ? 'var(--danger)' : 'var(--text-primary)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick, onStatusChange }) {
  const updated = new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: 20,
        cursor: 'pointer',
        transition: 'border-color 0.15s, transform 0.1s',
        position: 'relative',
        overflow: 'visible',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Top stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        borderRadius: '8px 8px 0 0',
        background: 'var(--accent)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1, paddingRight: 8 }}>
          {project.name}
        </h3>
        <CardMenu project={project} onStatusChange={onStatusChange} />
      </div>

      {project.client && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 3 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>CLIENT </span>
          {project.client}
        </div>
      )}
      {project.lead_producer && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>PRODUCER </span>
          {project.lead_producer}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
        Updated {updated}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState({ section: 'sandbox', status: 'active' });
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(activeFilter);
    authFetch(`/api/projects?${params}`)
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeFilter]);

  async function handleStatusChange(projectId, newStatus) {
    const messages = {
      active: 'Restore this project to active?',
      archived: 'Move this project to archived?',
      trash: 'Move this project to trash?',
    };
    if (!confirm(messages[newStatus])) return;

    // Fetch current project data first to preserve all fields
    const res = await authFetch(`/api/projects/${projectId}`);
    const project = await res.json();
    await authFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...project, status: newStatus }),
    });
    // Remove from current list (moved to another folder)
    setProjects(p => p.filter(x => x.id !== projectId));
  }

  const sectionLabel = activeFilter.section === 'premier' ? 'PREMIER' : 'SANDBOX';
  const statusLabel = activeFilter.status.charAt(0).toUpperCase() + activeFilter.status.slice(1);

  return (
    <div className="app-layout">
      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <div className="main-content">
        <div className="page-header">
          <div>
            <h1>{sectionLabel} — {statusLabel}</h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
          {activeFilter.section === 'sandbox' && (
            <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
              + New Project
            </button>
          )}
        </div>

        <div className="page-body">
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <p>No projects here yet.</p>
              {activeFilter.section === 'sandbox' && activeFilter.status === 'active' && (
                <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                  + Create your first project
                </button>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => navigate(`/projects/${p.id}/overview`)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
