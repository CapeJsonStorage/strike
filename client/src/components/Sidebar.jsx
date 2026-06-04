import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App.jsx';

function SidebarSection({ title, items, onSelect, activeFilter }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '6px 16px',
          background: 'none', border: 'none', color: 'var(--text-dim)',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', cursor: 'pointer',
        }}
      >
        {title}
        <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div>
          {items.map(item => {
            const isActive = activeFilter?.section === item.section && activeFilter?.status === item.status;
            return (
              <button
                key={item.key}
                onClick={() => onSelect({ section: item.section, status: item.status })}
                style={{
                  width: '100%', display: 'block', textAlign: 'left',
                  padding: '7px 16px 7px 28px',
                  background: isActive ? 'rgba(249,115,22,0.12)' : 'none',
                  border: 'none',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Fetches all premier saves across all projects and groups by project
function PremierSection() {
  const [saves, setSaves] = useState([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get all active sandbox projects, then fetch their premier saves
    authFetch('/api/projects?section=sandbox&status=active')
      .then(r => r.json())
      .then(async projects => {
        if (!Array.isArray(projects)) return;
        const all = [];
        await Promise.all(projects.map(async proj => {
          try {
            const res = await authFetch(`/api/projects/${proj.id}/premier-saves`);
            const projSaves = await res.json();
            if (Array.isArray(projSaves) && projSaves.length > 0) {
              projSaves.forEach(s => all.push({ ...s, project_name: proj.name, project_id: proj.id }));
            }
          } catch { /* skip */ }
        }));
        // Sort newest first
        all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSaves(all);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '6px 16px',
          background: 'none', border: 'none', color: 'var(--text-dim)',
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', cursor: 'pointer',
        }}
      >
        Premier
        <span style={{ fontSize: 9 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div>
          {loading ? (
            <div style={{ padding: '6px 28px', fontSize: 12, color: 'var(--text-dim)' }}>Loading…</div>
          ) : saves.length === 0 ? (
            <div style={{ padding: '6px 16px 10px', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Open a project and click{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>↓ Save Version</span>
              {' '}in the Premier view to archive a version here.
            </div>
          ) : (
            saves.map(save => (
              <NavLink
                key={save.id}
                to={`/projects/${save.project_id}/premier`}
                style={({ isActive }) => ({
                  display: 'block', padding: '6px 16px 6px 20px',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  background: isActive ? 'rgba(249,115,22,0.08)' : 'none',
                  textDecoration: 'none', transition: 'all 0.12s',
                })}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'none'; }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {save.label}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>
                  {save.project_name} · {new Date(save.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </NavLink>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activeFilter, onFilterChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sandboxItems = [
    { key: 'sandbox-active',   label: 'Active',   section: 'sandbox', status: 'active' },
    { key: 'sandbox-archived', label: 'Archived', section: 'sandbox', status: 'archived' },
    { key: 'sandbox-trash',    label: 'Trash',    section: 'sandbox', status: 'trash' },
  ];

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <NavLink to="/" style={{ display: 'block' }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
            STRIKE
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            CAPE Production
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>
        <SidebarSection
          title="Sandbox"
          items={sandboxItems}
          onSelect={onFilterChange}
          activeFilter={activeFilter}
        />

        <div style={{ height: 1, background: 'var(--border)', margin: '8px 16px' }} />

        <PremierSection />
      </nav>

      {/* Footer: New Project + User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => navigate('/projects/new')}
        >
          + New Project
        </button>

        {user && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{user.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }} title="Logout">
              ↩
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
