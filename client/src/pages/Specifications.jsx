import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams, NavLink, useSearchParams } from 'react-router-dom';
import StatusBadge, { STATUS_CONFIG } from '../components/StatusBadge.jsx';
import FileUploadZone from '../components/FileUploadZone.jsx';
import ColorTag from '../components/ColorTag.jsx';
import MilestoneDatePicker from '../components/MilestoneDatePicker.jsx';

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

const STATUS_ORDER = ['producer_input', 'for_revision', 'for_client_revision', 'approved'];
const DESIGNERS = ['Manu', 'Korina', 'Lina', 'Dana'];
const FORMATS = ['PNG', 'JPG', 'PDF', 'AI', 'EPS', 'MP4'];

function notesConfig(status) {
  switch (status) {
    case 'producer_input': return { label: 'Producer Notes', field: 'producer_notes' };
    case 'for_revision': return { label: 'Designer Notes / Questions', field: 'designer_notes' };
    case 'for_client_revision': return { label: 'Client / Internal Notes', field: 'client_notes' };
    case 'approved': return { label: 'Internal Notes (Read Only)', field: 'internal_notes', readOnly: true };
    default: return { label: 'Notes', field: 'producer_notes' };
  }
}

function uploadConfig(status) {
  switch (status) {
    case 'producer_input':
      return { label: 'Reference Images / Site Visits', fileType: 'reference', filterType: 'reference', readOnly: false };
    case 'for_revision':
      return { label: 'Design Versions', fileType: 'version', filterType: 'version', readOnly: false };
    case 'for_client_revision':
      return { label: 'Design Versions', fileType: 'version', filterType: 'version', readOnly: false };
    case 'approved':
      return { label: 'Approved Files', fileType: 'version', filterType: 'version', readOnly: true };
    default:
      return { label: 'Files', fileType: 'reference', filterType: null, readOnly: false };
  }
}

function stageBorderStyle(status) {
  switch (status) {
    case 'for_revision':
      return {
        border: '2px solid rgba(245,158,11,0.6)',
        boxShadow: '0 0 0 2px rgba(245,158,11,0.15), inset 0 0 40px rgba(245,158,11,0.04)',
        borderRadius: 10,
      };
    case 'for_client_revision':
      return {
        border: '2px solid rgba(249,115,22,0.6)',
        boxShadow: '0 0 0 2px rgba(249,115,22,0.15), inset 0 0 40px rgba(249,115,22,0.04)',
        borderRadius: 10,
      };
    case 'approved':
      return {
        border: '2px solid rgba(34,197,94,0.6)',
        boxShadow: '0 0 0 2px rgba(34,197,94,0.15), inset 0 0 40px rgba(34,197,94,0.04)',
        borderRadius: 10,
      };
    default:
      return { borderRadius: 10 };
  }
}

function formatDatePill(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Specifications() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [spec, setSpec] = useState(null);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`, { }).then(r => r.json()),
      authFetch(`/api/projects/${id}/assets`, { }).then(r => r.json()),
    ]).then(([proj, assetList]) => {
      setProject(proj);
      const list = Array.isArray(assetList) ? assetList : [];
      setAssets(list);

      const preselect = searchParams.get('asset');
      if (preselect) {
        const found = list.find(a => String(a.id) === preselect);
        if (found) { setSelectedAsset(found); }
        else if (list.length > 0) setSelectedAsset(list[0]);
      } else if (list.length > 0) {
        setSelectedAsset(list[0]);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedAsset) return;
    setSpec(null);
    setFiles([]);
    setForm({});
    authFetch(`/api/assets/${selectedAsset.id}/specifications`, { })
      .then(r => r.json())
      .then(async specs => {
        if (specs && specs.length > 0) {
          const s = specs[0];
          setSpec(s);
          setForm({
            designer: s.designer || '',
            copy: s.copy || '',
            width: s.width || '',
            height: s.height || '',
            format: s.format || '',
            producer_notes: s.producer_notes || '',
            designer_notes: s.designer_notes || '',
            client_notes: s.client_notes || '',
            internal_notes: s.internal_notes || '',
            due_revision: s.due_revision ? s.due_revision.slice(0, 10) : '',
            due_client_review: s.due_client_review ? s.due_client_review.slice(0, 10) : '',
            due_approved: s.due_approved ? s.due_approved.slice(0, 10) : '',
          });
          const filesRes = await authFetch(`/api/specifications/${s.id}/files`, { });
          const filesData = await filesRes.json();
          setFiles(Array.isArray(filesData) ? filesData : []);
        } else {
          const res = await authFetch(`/api/assets/${selectedAsset.id}/specifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const newSpec = await res.json();
          setSpec(newSpec);
          setForm({
            designer: '', copy: '', width: '', height: '', format: '',
            producer_notes: '', designer_notes: '', client_notes: '', internal_notes: '',
            due_revision: '', due_client_review: '', due_approved: '',
          });
        }
      });
  }, [selectedAsset]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleMilestoneChange(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    if (!spec) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await authFetch(`/api/specifications/${spec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSpec(data);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAdvance() {
    if (!spec) return;
    const idx = STATUS_ORDER.indexOf(spec.status);
    if (idx === STATUS_ORDER.length - 1) return;
    setAdvancing(true);
    try {
      await handleSave();
      const res = await authFetch(`/api/specifications/${spec.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setSpec(data);
        setForm(f => ({ ...f }));
      }
    } finally {
      setAdvancing(false);
    }
  }

  if (loading) return <div className="loading">Loading...</div>;

  const notes = spec ? notesConfig(spec.status) : { label: 'Notes', field: 'producer_notes' };
  const statusIdx = spec ? STATUS_ORDER.indexOf(spec.status) : 0;
  const isApproved = spec?.status === 'approved';
  const upload = spec ? uploadConfig(spec.status) : { label: 'Files', fileType: 'reference', filterType: null, readOnly: false };

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

      <ProjectTabs id={id} active="specifications" />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Asset sidebar */}
        <div style={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          padding: '16px 0',
        }}>
          <div style={{ padding: '0 16px 10px', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Assets
          </div>
          {assets.length === 0 ? (
            <div style={{ padding: '16px', fontSize: 12, color: 'var(--text-muted)' }}>
              No assets yet.{' '}
              <NavLink to={`/projects/${id}/assets`} style={{ color: 'var(--accent)' }}>Add one</NavLink>
            </div>
          ) : (
            assets.map(asset => {
              const isSelected = selectedAsset?.id === asset.id;
              return (
                <button
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  style={{
                    width: '100%',
                    display: 'block',
                    textAlign: 'left',
                    padding: '10px 16px',
                    background: isSelected ? 'rgba(59,130,246,0.1)' : 'none',
                    border: 'none',
                    borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                  <div style={{ marginTop: 2 }}>
                    <ColorTag
                      label={asset.type}
                      color={asset.type === 'print' ? '#A855F7' : '#3B82F6'}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Spec form area — with gradient border based on status */}
        {selectedAsset && spec ? (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 24,
              ...stageBorderStyle(spec.status),
            }}
          >
            {/* Status bar */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {STATUS_ORDER.map((s, i) => {
                  const cfg = STATUS_CONFIG[s];
                  const isCurrent = spec.status === s;
                  const isPast = i < statusIdx;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (!isCurrent) {
                          authFetch(`/api/specifications/${spec.id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: s }),
                          }).then(r => r.json()).then(data => { if (data.id) setSpec(data); });
                        }
                      }}
                      style={{
                        padding: '5px 14px',
                        borderRadius: '999px',
                        border: `1px solid ${isCurrent ? cfg.color : isPast ? cfg.color + '60' : 'var(--border)'}`,
                        background: isCurrent ? cfg.bg : 'transparent',
                        color: isCurrent ? cfg.color : isPast ? cfg.color + 'aa' : 'var(--text-dim)',
                        fontSize: 12,
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                    >
                      {isCurrent && <span style={{ marginRight: 4 }}>●</span>}
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {saved && <span style={{ color: 'var(--status-green)', fontSize: 13 }}>✓ Saved</span>}
                <button className="btn btn-secondary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {!isApproved && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleAdvance}
                    disabled={advancing}
                    style={{ background: STATUS_CONFIG[STATUS_ORDER[statusIdx + 1]]?.color || 'var(--accent)' }}
                  >
                    {advancing ? '...' : `→ ${STATUS_CONFIG[STATUS_ORDER[statusIdx + 1]]?.label || 'Advance'}`}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              {/* Left: spec form 2/3 */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                    {selectedAsset.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label>Designer</label>
                      <select name="designer" value={form.designer} onChange={handleChange} disabled={isApproved}>
                        <option value="">— Select designer —</option>
                        {DESIGNERS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Copy</label>
                      <textarea name="copy" value={form.copy} onChange={handleChange} rows={3} placeholder="Text content for this asset..." readOnly={isApproved} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Width</label>
                        <input name="width" value={form.width} onChange={handleChange} placeholder="e.g. 1920px" readOnly={isApproved} />
                      </div>
                      <div style={{ color: 'var(--text-dim)', paddingBottom: 10, fontSize: 18 }}>×</div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Height</label>
                        <input name="height" value={form.height} onChange={handleChange} placeholder="e.g. 1080px" readOnly={isApproved} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Format</label>
                        <select name="format" value={form.format} onChange={handleChange} disabled={isApproved}>
                          <option value="">— Format —</option>
                          {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes card */}
                <div className="card" style={{ padding: 20 }}>
                  <div className="form-group">
                    <label>{notes.label}</label>
                    <textarea
                      name={notes.field}
                      value={form[notes.field] || ''}
                      onChange={handleChange}
                      rows={4}
                      readOnly={notes.readOnly}
                      placeholder={notes.readOnly ? '' : `Add ${notes.label.toLowerCase()}...`}
                    />
                  </div>
                </div>

                {/* Milestone dates */}
                <div className="card" style={{ padding: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                    Milestone Dates
                  </div>
                  {spec.status === 'producer_input' ? (
                    <MilestoneDatePicker
                      dueRevision={form.due_revision}
                      dueClientReview={form.due_client_review}
                      dueApproved={form.due_approved}
                      onChange={handleMilestoneChange}
                    />
                  ) : (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {spec.status === 'for_revision' && form.due_revision && (
                        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}>
                          For Revision: {formatDatePill(form.due_revision)}
                        </span>
                      )}
                      {spec.status === 'for_client_revision' && form.due_client_review && (
                        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(249,115,22,0.1)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                          Client Review: {formatDatePill(form.due_client_review)}
                        </span>
                      )}
                      {spec.status === 'approved' && form.due_approved && (
                        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                          Approved: {formatDatePill(form.due_approved)}
                        </span>
                      )}
                      {!form.due_revision && !form.due_client_review && !form.due_approved && (
                        <span style={{ fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>No milestone dates set.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: file uploads 1/3 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card" style={{ padding: 20 }}>
                  <FileUploadZone
                    specId={spec.id}
                    files={files}
                    onUploaded={f => setFiles(prev => [f, ...prev])}
                    onDeleted={fid => setFiles(prev => prev.filter(x => x.id !== fid))}
                    label={upload.label}
                    fileType={upload.fileType}
                    filterType={upload.filterType}
                    readOnly={upload.readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state" style={{ flex: 1 }}>
            <p>{assets.length === 0 ? 'Add assets to get started.' : 'Select an asset to view its specification.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
