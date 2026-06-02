import { authFetch } from '../App.jsx';
import React, { useRef, useState } from 'react';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function isImage(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

export default function FileUploadZone({ specId, files, onUploaded, onDeleted, label = 'Reference Images / Site Visits' }) {
  const fileInput = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function uploadFile(file) {
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    form.append('file_type', 'reference');
    form.append('uploaded_by', 'user');
    try {
      const res = await authFetch(`/api/specifications/${specId}/files`, {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const newFile = await res.json();
      onUploaded(newFile);
    } catch (e) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach(uploadFile);
  }

  async function handleDelete(fileId) {
    await authFetch(`/api/files/${fileId}`, { method: 'DELETE' });
    onDeleted(fileId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInput.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '24px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(59,130,246,0.05)' : 'transparent',
          transition: 'all 0.15s',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        <input
          ref={fileInput}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={e => Array.from(e.target.files).forEach(uploadFile)}
        />
        {uploading ? (
          <span>Uploading...</span>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📎</div>
            <div>Drop files here or <span style={{ color: 'var(--accent)' }}>click to browse</span></div>
            <div style={{ fontSize: 11, marginTop: 4, color: 'var(--text-dim)' }}>PNG, JPG, PDF, AI, EPS, MP4 — up to 50MB</div>
          </>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {files && files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
            }}>
              {isImage(f.original_name) ? (
                <img
                  src={`/uploads/${f.filename}`}
                  alt={f.original_name}
                  style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 40, height: 40, borderRadius: 4, flexShrink: 0,
                  background: 'var(--bg-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                }}>
                  {f.original_name.split('.').pop().toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <a
                  href={`/uploads/${f.filename}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--text-primary)', fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {f.original_name}
                </a>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(f.created_at).toLocaleDateString()}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(f.id)}
                style={{ color: 'var(--danger)', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
