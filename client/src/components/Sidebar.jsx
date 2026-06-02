import { authFetch } from '../App.jsx';
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sandboxItems = [
    { key: 'sandbox-active',   label: 'Active',   section: 'sandbox', status: 'active' },
    { key: 'sandbox-archived', label: 'Archived', section: 'sandbox', status: 'archived' },
    { key: 'sandbox-trash',    label: 'Trash',    section: 'sandbox', status: 'trash' },
  ];

  // Premier is a read-only view — it shows all sandbox projects that have approved assets.
  // No separate folder structure needed; it lives as a section in the sidebar for navigation.
  const premierItems = [
    { key: 'premier-active',   label: 'Active',   section: 'premier', status: 'active' },
    { key: 'premier-archived', label: 'Archived', section: 'premier', status: 'archived' },
    { key: 'premier-trash',    label: 'Trash',    section: 'premier', status: 'trash' },
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

        {/* Premier — label only, click goes to active sandbox projects with approved assets */}
        <div style={{ marginBottom: 4 }}>
          <div style={{
            padding: '6px 16px',
            color: 'var(--text-dim)',
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            Premier
          </div>
          <div style={{ paddingLeft: 12, paddingRight: 12, paddingBottom: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '4px 16px', lineHeight: 1.5 }}>
              Open a project and click{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Open Premier →</span>
              {' '}on the Overview tab to view the client-facing approved assets page.
            </div>
          </div>
        </div>
      </nav>

      {/* New Project + User */}
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
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { logout(); navigate('/login'); }}
              title="Logout"
            >
              ↩
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
