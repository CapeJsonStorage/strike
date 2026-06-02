import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';

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

export default function Overview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`/api/projects/${id}`, { })
      .then(r => r.json())
      .then(data => {
        setProject(data);
        setForm({
          name: data.name || '',
          client: data.client || '',
          lead_producer: data.lead_producer || '',
          assistant_producer: data.assistant_producer || '',
          project_overview: data.project_overview || '',
          timeline: data.timeline || '',
          ros: data.ros || '',
          budget: data.budget || '',
          status: data.status || 'active',
          section: data.section || 'sandbox',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await authFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setProject(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Move this project to trash?')) return;
    await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/');
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="loading">Project not found.</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
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
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {project.section?.toUpperCase()}
        </span>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{project.name}</span>
      </div>

      <ProjectTabs id={id} active="overview" />

      <div className="page-body" style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Project Overview</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saved && <span style={{ color: 'var(--status-green)', fontSize: 13 }}>✓ Saved</span>}
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Trash</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Identity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Project Name</label>
                  <input name="name" value={form.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Client</label>
                  <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Section</label>
                  <select name="section" value={form.section} onChange={handleChange}>
                    <option value="sandbox">Sandbox</option>
                    <option value="premier">Premier</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={form.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="trash">Trash</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Team
            </h3>
            <div className="form-row">
              <div className="form-group">
                <label>Lead Producer</label>
                <input name="lead_producer" value={form.lead_producer} onChange={handleChange} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Assistant Producer</label>
                <input name="assistant_producer" value={form.assistant_producer} onChange={handleChange} placeholder="Full name" />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Project Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Project Overview</label>
                <textarea name="project_overview" value={form.project_overview} onChange={handleChange} rows={4} placeholder="Describe the project..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Timeline</label>
                  <input name="timeline" value={form.timeline} onChange={handleChange} placeholder="e.g. Jan 15 – Feb 28" />
                </div>
                <div className="form-group">
                  <label>Budget</label>
                  <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. $12,000" />
                </div>
              </div>
              <div className="form-group">
                <label>ROS (Run of Show)</label>
                <textarea name="ros" value={form.ros} onChange={handleChange} rows={3} placeholder="Key milestones, deliverable dates..." />
              </div>
            </div>
          </div>
        </div>

        {/* Premier link */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Client Preview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share the approved assets page with your client</div>
          </div>
          <NavLink to={`/projects/${id}/premier`} target="_blank" className="btn btn-secondary btn-sm">
            Open Premier →
          </NavLink>
        </div>
      </div>
    </div>
  );
}
