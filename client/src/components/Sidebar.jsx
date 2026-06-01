import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App.jsx';

function SidebarSection({ title, items, onSelect, activeFilter }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          background: 'none',
          border: 'none',
          color: 'var(--text-dim)',
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          cursor: 'pointer',
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
                  width: '100%',
                  display: 'block',
                  textAlign: 'left',
                  padding: '7px 16px 7px 28px',
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'none',
                  border: 'none',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
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

export default function Sidebar({ activeFilter, onFilterChange }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    navigate('/login');
  }

  const sandboxItems = [
    { key: 'sandbox-active', label: 'Active', section: 'sandbox', status: 'active' },
    { key: 'sandbox-archived', label: 'Archived', section: 'sandbox', status: 'archived' },
    { key: 'sandbox-trash', label: 'Trash', section: 'sandbox', status: 'trash' },
  ];

  const premierItems = [
    { key: 'premier-active', label: 'Active', section: 'premier', status: 'active' },
    { key: 'premier-archived', label: 'Archived', section: 'premier', status: 'archived' },
    { key: 'premier-trash', label: 'Trash', section: 'premier', status: 'trash' },
  ];

  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <NavLink to="/" style={{ display: 'block' }}>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
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
        <SidebarSection
          title="Premier"
          items={premierItems}
          onSelect={onFilterChange}
          activeFilter={activeFilter}
        />
      </nav>

      {/* New Project button */}
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
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{user.role}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
              ↩
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
