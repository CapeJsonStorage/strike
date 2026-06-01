import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ColorTag from '../components/ColorTag.jsx';

function ProjectCard({ project, onClick }) {
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
        overflow: 'hidden',
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
      {/* Section stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: project.section === 'premier' ? 'linear-gradient(90deg, #F59E0B, #F97316)' : 'var(--accent)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {project.name}
        </h3>
        <ColorTag
          label={project.section}
          color={project.section === 'premier' ? '#F59E0B' : '#3B82F6'}
        />
      </div>

      {project.client && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>CLIENT</span>{' '}
          {project.client}
        </div>
      )}
      {project.lead_producer && (
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>PRODUCER</span>{' '}
          {project.lead_producer}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 'auto' }}>
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
    fetch(`/api/projects?${params}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setProjects(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [activeFilter]);

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
          <button
            className="btn btn-primary"
            onClick={() => navigate('/projects/new')}
          >
            + New Project
          </button>
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
              <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>
                + Create your first project
              </button>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
