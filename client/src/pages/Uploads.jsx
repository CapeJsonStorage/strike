import { authFetch } from '../App.jsx';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, NavLink } from 'react-router-dom';

const IMAGE_EXTS = ['jpg','jpeg','png','gif','webp','svg'];
function isImage(fn) { return fn && IMAGE_EXTS.includes(fn.split('.').pop().toLowerCase()); }
function isVideo(fn) { return fn && fn.split('.').pop().toLowerCase() === 'mp4'; }

const FILE_TYPE_LABELS = {
  reference: { label: 'Reference', color: '#3B82F6' },
  version:   { label: 'Version',   color: '#F97316' },
  venue:     { label: 'Venue',     color: '#A855F7' },
};

function ProjectTabs({ id, active }) {
  const tabs = [
    { key: 'overview',        label: 'Overview',        path: `/projects/${id}/overview` },
    { key: 'assets',          label: 'Assets',          path: `/projects/${id}/assets` },
    { key: 'specifications',  label: 'Specifications',  path: `/projects/${id}/specifications` },
    { key: 'uploads',         label: 'Uploads',         path: `/projects/${id}/uploads` },
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

function Thumbnail({ file }) {
  const fn = file.original_name;
  if (isImage(fn)) {
    return (
      <img
        src={`/uploads/${file.filename}`}
        alt={fn}
        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#0D0D0D' }}
      />
    );
  }
  if (isVideo(fn)) {
    return (
      <div style={{
        width: 48, height: 48, borderRadius: 6, flexShrink: 0,
        background: '#1A1A1A', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>▶</div>
    );
  }
  const ext = fn.split('.').pop().toUpperCase();
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 6, flexShrink: 0,
      background: 'var(--bg-hover)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.05em',
    }}>
      {ext}
    </div>
  );
}

function ReplaceDialog({ file, onReplaced, onClose }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(f) {
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', f);
    try {
      const endpoint = file.source === 'venue'
        ? `/api/venue-files/${file.id}/replace`
        : `/api/files/${file.id}/replace`;
      const res = await authFetch(endpoint, { method: 'PUT', body: fd });
      if (!res.ok) throw new Error('Replace failed');
      const updated = await res.json();
      onReplaced(updated);
      onClose();
    } catch {
      setError('Replace failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 28, width: 400,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Replace File</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Replacing: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{file.original_name}</span>
        </div>

        <div
          onClick={() => fileInput.current?.click()}
          style={{
            border: '2px dashed var(--accent)', borderRadius: 8,
            padding: '28px 20px', textAlign: 'center', cursor: 'pointer',
            background: 'rgba(249,115,22,0.04)',
          }}
        >
          <input ref={fileInput} type="file" style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          {uploading ? (
            <span style={{ color: 'var(--accent)' }}>Uploading…</span>
          ) : (
            <>
              <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Click to choose replacement file
              </div>
            </>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}

export default function Uploads() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [replaceTarget, setReplaceTarget] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`).then(r => r.json()),
      authFetch(`/api/projects/${id}/all-files`).then(r => r.json()),
    ]).then(([proj, allFiles]) => {
      setProject(proj);
      setFiles(Array.isArray(allFiles) ? allFiles : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function handleDelete(file) {
    if (!confirm(`Delete "${file.original_name}"?`)) return;
    const endpoint = file.source === 'venue'
      ? `/api/venue-files/${file.id}`
      : `/api/files/${file.id}`;
    await authFetch(endpoint, { method: 'DELETE' });
    setFiles(f => f.filter(x => x.id !== file.id || x.source !== file.source));
  }

  function handleReplaced(updated) {
    setFiles(f => f.map(x =>
      x.id === updated.id ? { ...x, filename: updated.filename, original_name: updated.original_name, created_at: updated.created_at } : x
    ));
  }

  const filtered = filter === 'all' ? files : files.filter(f => f.file_type === filter);

  const filterOptions = [
    { value: 'all',       label: `All (${files.length})` },
    { value: 'version',   label: `Versions (${files.filter(f => f.file_type === 'version').length})` },
    { value: 'reference', label: `Reference (${files.filter(f => f.file_type === 'reference').length})` },
    { value: 'venue',     label: `Venue (${files.filter(f => f.file_type === 'venue').length})` },
  ];

  if (loading) return <div className="loading">Loading…</div>;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {replaceTarget && (
        <ReplaceDialog
          file={replaceTarget}
          onReplaced={handleReplaced}
          onClose={() => setReplaceTarget(null)}
        />
      )}

      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
        padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <NavLink to="/" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>
          STRIKE
        </NavLink>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>SANDBOX</span>
        <span style={{ color: 'var(--text-dim)' }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>{project?.name}</span>
      </div>

      <ProjectTabs id={id} active="uploads" />

      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Uploads</h2>
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6 }}>
            {filterOptions.map(o => (
              <button
                key={o.value}
                onClick={() => setFilter(o.value)}
                className="btn btn-sm"
                style={{
                  background: filter === o.value ? 'var(--accent)' : 'var(--bg-hover)',
                  color: filter === o.value ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${filter === o.value ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>No uploads yet.</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['', 'File Name', 'Asset', 'Type', 'Uploaded', 'Actions'].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px', textAlign: i === 5 ? 'right' : 'left',
                      fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((file, i) => {
                  const typeInfo = FILE_TYPE_LABELS[file.file_type] || { label: file.file_type, color: 'var(--text-muted)' };
                  return (
                    <tr
                      key={`${file.source}-${file.id}`}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Thumbnail */}
                      <td style={{ padding: '10px 16px', width: 64 }}>
                        <Thumbnail file={file} />
                      </td>

                      {/* File name + URL */}
                      <td style={{ padding: '10px 16px', maxWidth: 260 }}>
                        <a
                          href={`/uploads/${file.filename}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                            display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}
                        >
                          {file.original_name}
                        </a>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          /uploads/{file.filename}
                        </span>
                      </td>

                      {/* Asset name */}
                      <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.asset_name}
                      </td>

                      {/* Type badge */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: `${typeInfo.color}18`, color: typeInfo.color,
                          border: `1px solid ${typeInfo.color}40`, textTransform: 'capitalize',
                        }}>
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setReplaceTarget(file)}
                          >
                            Replace
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(file)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
