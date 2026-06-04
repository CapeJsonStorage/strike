import { authFetch } from '../App.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import DateRangePicker from '../components/DateRangePicker.jsx';

function ProjectTabs({ id, active }) {
  const tabs = [
    { key: 'overview',       label: 'Overview',       path: `/projects/${id}/overview` },
    { key: 'assets',         label: 'Assets',         path: `/projects/${id}/assets` },
    { key: 'specifications', label: 'Specifications', path: `/projects/${id}/specifications` },
    { key: 'uploads',        label: 'Uploads',        path: `/projects/${id}/uploads` },
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

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
function isImage(filename) {
  if (!filename) return false;
  return IMAGE_EXTS.includes(filename.split('.').pop().toLowerCase());
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

  // Vendor state
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ vendor_name: '', vendor_type: '', vendor_contact: '' });
  const [addingVendor, setAddingVendor] = useState(false);

  // Venue files state
  const [venueFiles, setVenueFiles] = useState([]);
  const [uploadingVenue, setUploadingVenue] = useState(false);
  const [venueDragging, setVenueDragging] = useState(false);
  const venueFileInput = useRef(null);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`).then(r => r.json()),
      authFetch(`/api/projects/${id}/vendors`).then(r => r.json()),
      authFetch(`/api/projects/${id}/venue-files`).then(r => r.json()),
    ])
      .then(([data, vends, vfiles]) => {
        setProject(data);
        setForm({
          name: data.name || '',
          client: data.client || '',
          lead_producer: data.lead_producer || '',
          assistant_producer: data.assistant_producer || '',
          project_overview: data.project_overview || '',
          timeline_start: data.timeline_start || null,
          timeline_end: data.timeline_end || null,
          ros: data.ros || '',
          budget: data.budget || '',
          venue_name: data.venue_name || '',
          venue_location: data.venue_location || '',
          venue_contact: data.venue_contact || '',
          status: data.status || 'active',
          section: data.section || 'sandbox',
        });
        setVendors(Array.isArray(vends) ? vends : []);
        setVenueFiles(Array.isArray(vfiles) ? vfiles : []);
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

  async function handleStatusChange(newStatus) {
    const messages = {
      archived: 'Archive this project?',
      trash: 'Move this project to trash?',
      active: 'Restore this project to active?',
    };
    if (!confirm(messages[newStatus] || 'Continue?')) return;
    try {
      const res = await authFetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setProject(data);
        setForm(f => ({ ...f, status: data.status }));
        if (newStatus === 'trash') navigate('/');
      }
    } catch {
      setError('Failed to update status.');
    }
  }

  async function handleAddVendor() {
    if (!newVendor.vendor_name.trim()) return;
    setAddingVendor(true);
    try {
      const res = await authFetch(`/api/projects/${id}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor),
      });
      const data = await res.json();
      if (res.ok) {
        setVendors(v => [...v, data]);
        setNewVendor({ vendor_name: '', vendor_type: '', vendor_contact: '' });
      }
    } finally {
      setAddingVendor(false);
    }
  }

  async function handleDeleteVendor(vendorId) {
    await authFetch(`/api/vendors/${vendorId}`, { method: 'DELETE' });
    setVendors(v => v.filter(x => x.id !== vendorId));
  }

  async function uploadVenueFile(file) {
    setUploadingVenue(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await authFetch(`/api/projects/${id}/venue-files`, { method: 'POST', body: fd });
      if (res.ok) {
        const newFile = await res.json();
        setVenueFiles(f => [newFile, ...f]);
      }
    } finally {
      setUploadingVenue(false);
    }
  }

  async function handleDeleteVenueFile(fileId) {
    await authFetch(`/api/venue-files/${fileId}`, { method: 'DELETE' });
    setVenueFiles(f => f.filter(x => x.id !== fileId));
  }

  if (loading) return <div className="loading">Loading...</div>;
  if (!project) return <div className="loading">Project not found.</div>;

  const isActive = project.status === 'active';
  const isArchived = project.status === 'archived';
  const isTrashed = project.status === 'trash';

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
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>SANDBOX</span>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13, textTransform: 'capitalize' }}>{project.status}</span>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{project.name}</span>
      </div>

      <ProjectTabs id={id} active="overview" />

      <div className="page-body" style={{ maxWidth: 1200 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Project Overview</h2>
            {!isActive && (
              <span style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                color: isArchived ? '#F59E0B' : '#EF4444',
                background: isArchived ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                padding: '2px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block',
              }}>
                {project.status}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {saved && <span style={{ color: 'var(--status-green)', fontSize: 13 }}>✓ Saved</span>}
            {isActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('archived')}>Archive</button>
            )}
            {isArchived && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('active')}>Restore</button>
            )}
            {!isTrashed && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleStatusChange('trash')}>
                Trash
              </button>
            )}
            {isTrashed && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange('active')}>Restore</button>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left column — 60% */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Identity */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Identity
              </h3>
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
            </div>

            {/* Team */}
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

            {/* Project Details */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Project Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Project Overview</label>
                  <textarea name="project_overview" value={form.project_overview} onChange={handleChange} rows={4} placeholder="Describe the project..." />
                </div>

                {/* DateRangePicker replaces timeline text input */}
                <div className="form-group">
                  <label>Timeline</label>
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 16,
                  }}>
                    <DateRangePicker
                      startDate={form.timeline_start}
                      endDate={form.timeline_end}
                      onChange={({ start, end }) => setForm(f => ({ ...f, timeline_start: start, timeline_end: end }))}
                      onSave={handleSave}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Budget</label>
                    <input name="budget" value={form.budget} onChange={handleChange} placeholder="e.g. $12,000" />
                  </div>
                  <div className="form-group">
                    <label>ROS (Run of Show)</label>
                    <textarea name="ros" value={form.ros} onChange={handleChange} rows={3} placeholder="Key milestones, deliverable dates..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — 40% */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* Venue card */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Venue
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>Venue Name</label>
                  <input name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="e.g. Grand Ballroom" />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input name="venue_location" value={form.venue_location} onChange={handleChange} placeholder="Address or city" />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input name="venue_contact" value={form.venue_contact} onChange={handleChange} placeholder="Name or email" />
                </div>

                {/* Site visit photos upload */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Site Visit Photos
                  </div>
                  <div
                    onDragOver={e => { e.preventDefault(); setVenueDragging(true); }}
                    onDragLeave={() => setVenueDragging(false)}
                    onDrop={e => { e.preventDefault(); setVenueDragging(false); Array.from(e.dataTransfer.files).forEach(uploadVenueFile); }}
                    onClick={() => venueFileInput.current?.click()}
                    style={{
                      border: `2px dashed ${venueDragging ? '#F97316' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      padding: '20px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: venueDragging ? 'rgba(249,115,22,0.05)' : 'transparent',
                      transition: 'all 0.15s',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                    }}
                  >
                    <input
                      ref={venueFileInput}
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => Array.from(e.target.files).forEach(uploadVenueFile)}
                    />
                    {uploadingVenue ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                        <div>Drop photos or <span style={{ color: '#F97316' }}>click to browse</span></div>
                        <div style={{ fontSize: 11, marginTop: 2, color: 'var(--text-dim)' }}>PNG, JPG, WEBP</div>
                      </>
                    )}
                  </div>

                  {venueFiles.length > 0 && (
                    <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {venueFiles.map(f => (
                        <div key={f.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          {isImage(f.original_name) ? (
                            <img
                              src={`/uploads/${f.filename}`}
                              alt={f.original_name}
                              style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{
                              height: 70, background: 'var(--bg-hover)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, color: 'var(--text-muted)',
                            }}>
                              {f.original_name.split('.').pop().toUpperCase()}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteVenueFile(f.id)}
                            style={{
                              position: 'absolute', top: 3, right: 3,
                              background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                              width: 18, height: 18, cursor: 'pointer', color: '#fff', fontSize: 10,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vendors card */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
                Vendors
              </h3>

              {vendors.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {vendors.map(v => (
                    <div key={v.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: 'var(--bg-primary)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '8px 12px',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.vendor_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                          {[v.vendor_type, v.vendor_contact].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteVendor(v.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13, flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add vendor form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: vendors.length > 0 ? 12 : 0, borderTop: vendors.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 2 }}>+ Add Vendor</div>
                <input
                  value={newVendor.vendor_name}
                  onChange={e => setNewVendor(v => ({ ...v, vendor_name: e.target.value }))}
                  placeholder="Vendor name"
                  style={{ padding: '7px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={newVendor.vendor_type}
                    onChange={e => setNewVendor(v => ({ ...v, vendor_type: e.target.value }))}
                    placeholder="Type (e.g. AV, Catering)"
                    style={{ flex: 1, padding: '7px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  />
                  <input
                    value={newVendor.vendor_contact}
                    onChange={e => setNewVendor(v => ({ ...v, vendor_contact: e.target.value }))}
                    placeholder="Contact"
                    style={{ flex: 1, padding: '7px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVendor}
                  disabled={addingVendor || !newVendor.vendor_name.trim()}
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                >
                  {addingVendor ? 'Adding...' : 'Add Vendor'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Premier link */}
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Client Preview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Share the Premier view of all approved assets with your client</div>
          </div>
          <NavLink to={`/projects/${id}/premier`} target="_blank" className="btn btn-secondary btn-sm">
            Open Premier →
          </NavLink>
        </div>
      </div>
    </div>
  );
}
