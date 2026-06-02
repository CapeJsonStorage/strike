import { authFetch } from '../App.jsx';
import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

export default function NewLaunchpad() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    client: '',
    lead_producer: '',
    assistant_producer: '',
    project_overview: '',
    timeline: '',
    ros: '',
    budget: '',
    section: 'sandbox',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create project.'); return; }
      navigate(`/projects/${data.id}/overview`);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <NavLink to="/" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
          STRIKE
        </NavLink>
        <span style={{ color: 'var(--border)' }}>›</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>New Project</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>Launch a New Project</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Set up your production launchpad. You can edit all details later.</p>
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Project Identity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Project Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Summer Campaign 2025" autoFocus />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client</label>
                    <input name="client" value={form.client} onChange={handleChange} placeholder="Client name" />
                  </div>
                  <div className="form-group">
                    <label>Section</label>
                    <select name="section" value={form.section} onChange={handleChange}>
                      <option value="sandbox">Sandbox</option>
                      <option value="premier">Premier</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
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
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Project Overview</label>
                  <textarea name="project_overview" value={form.project_overview} onChange={handleChange} placeholder="Describe the project scope and goals..." rows={3} />
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
                  <textarea name="ros" value={form.ros} onChange={handleChange} placeholder="Key milestones, deliverable dates..." rows={2} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140, justifyContent: 'center' }}>
                {saving ? 'Creating...' : 'Create Project →'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
