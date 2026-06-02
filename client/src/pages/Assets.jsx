import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import ColorTag from '../components/ColorTag.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function ProjectTabs({ id, active }) {
  const tabs = [
    { key: 'overview', label: 'Overview', path: `/projects/${id}/overview` },
    { key: 'assets', label: 'Assets', path: `/projects/${id}/assets` },
    { key: 'specifications', label: 'Specifications', path: `/projects/${id}/specifications` },
  ];
  return (
    <div className="tab-nav">
      {tabs.map(t => (
        <NavLink key={t.key} to={t.path} className={active === t.key ? 'active' : ''}>
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}

export default function Assets() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetStatuses, setAssetStatuses] = useState({}); // assetId -> status string
  const [assetDesigners, setAssetDesigners] = useState({}); // assetId -> designer name
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', type: 'digital' });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`).then(r => r.json()),
      authFetch(`/api/projects/${id}/assets`).then(r => r.json()),
    ]).then(async ([proj, assetList]) => {
      setProject(proj);
      const list = Array.isArray(assetList) ? assetList : [];
      setAssets(list);

      // Fetch spec status + designer for each asset in parallel
      const statusMap = {};
      const designerMap = {};
      await Promise.all(list.map(async asset => {
        try {
          const res = await authFetch(`/api/assets/${asset.id}/specifications`);
          const specs = await res.json();
          if (specs && specs.length > 0) {
            statusMap[asset.id] = specs[0].status;
            designerMap[asset.id] = specs[0].designer || '—';
          } else {
            statusMap[asset.id] = 'producer_input';
            designerMap[asset.id] = '—';
          }
        } catch {
          statusMap[asset.id] = 'producer_input';
          designerMap[asset.id] = '—';
        }
      }));
      setAssetStatuses(statusMap);
      setAssetDesigners(designerMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function handleAddAsset(e) {
    e.preventDefault();
    if (!newAsset.name.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await authFetch(`/api/projects/${id}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setAssets(a => [...a, data]);
      setAssetStatuses(s => ({ ...s, [data.id]: 'producer_input' }));
      setAssetDesigners(s => ({ ...s, [data.id]: '—' }));
      setNewAsset({ name: '', type: 'digital' });
      setShowForm(false);
    } catch {
      setError('Failed to add asset.');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(assetId) {
    if (!confirm('Delete this asset and all its specifications?')) return;
    await authFetch(`/api/assets/${assetId}`, { method: 'DELETE' });
    setAssets(a => a.filter(x => x.id !== assetId));
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <NavLink to="/" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
          STRIKE
        </NavLink>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{project?.section?.toUpperCase()}</span>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{project?.name}</span>
      </div>

      <ProjectTabs id={id} active="assets" />

      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Assets</h2>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ Add Asset'}
          </button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}

        {showForm && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <form onSubmit={handleAddAsset} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Asset Name</label>
                <input
                  value={newAsset.name}
                  onChange={e => setNewAsset(a => ({ ...a, name: e.target.value }))}
                  placeholder="e.g. Hero Banner, Email Header..."
                  autoFocus
                />
              </div>
              <div className="form-group" style={{ width: 160 }}>
                <label>Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['digital', 'print'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAsset(a => ({ ...a, type: t }))}
                      className="btn btn-sm"
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        background: newAsset.type === t ? 'var(--accent)' : 'var(--bg-hover)',
                        color: newAsset.type === t ? 'white' : 'var(--text-muted)',
                        border: `1px solid ${newAsset.type === t ? 'var(--accent)' : 'var(--border)'}`,
                        textTransform: 'capitalize',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={adding}>
                {adding ? 'Adding...' : 'Add'}
              </button>
            </form>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No assets yet. Add your first asset above.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Asset Name', 'Type', 'Designer', 'Created', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 20px',
                      textAlign: i === 5 ? 'right' : 'left',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, i) => (
                  <tr
                    key={asset.id}
                    style={{
                      borderBottom: i < assets.length - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500 }}>{asset.name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <ColorTag
                        label={asset.type}
                        color={asset.type === 'print' ? '#A855F7' : 'var(--accent)'}
                      />
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-primary)' }}>
                      {assetDesigners[asset.id] || '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(asset.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <StatusBadge status={assetStatuses[asset.id] || 'producer_input'} size="sm" />
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/projects/${id}/specifications?asset=${asset.id}`)}
                        >
                          Spec →
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => handleDelete(asset.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
