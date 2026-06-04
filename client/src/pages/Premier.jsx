import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function isImage(filename) {
  if (!filename) return false;
  return IMAGE_EXTS.includes(filename.split('.').pop().toLowerCase());
}

function isVideo(filename) {
  if (!filename) return false;
  return filename.split('.').pop().toLowerCase() === 'mp4';
}

function formatApprovedDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Premier() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [approvedItems, setApprovedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`, { }).then(r => r.json()),
      authFetch(`/api/projects/${id}/assets`, { }).then(r => r.json()),
    ]).then(async ([proj, assets]) => {
      setProject(proj);
      const items = [];
      for (const asset of (Array.isArray(assets) ? assets : [])) {
        const specsRes = await authFetch(`/api/assets/${asset.id}/specifications`, { });
        const specs = await specsRes.json();
        const approved = (Array.isArray(specs) ? specs : []).filter(s => s.status === 'approved');
        for (const spec of approved) {
          const filesRes = await authFetch(`/api/specifications/${spec.id}/files`, { });
          const files = await filesRes.json();
          items.push({ asset, spec, files: Array.isArray(files) ? files : [] });
        }
      }
      setApprovedItems(items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        Loading...
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Top header bar */}
      <div style={{
        background: '#1A1A1A',
        borderBottom: '1px solid #2A2A2A',
        padding: '20px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <NavLink
            to={`/projects/${id}/overview`}
            style={{ color: '#888888', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            ← Back
          </NavLink>
          <div style={{ width: 1, height: 20, background: '#2A2A2A' }} />
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: '#F97316' }}>
            STRIKE
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            {project?.name}
          </div>
          {project?.client && (
            <div style={{ fontSize: 14, color: '#888888' }}>{project.client}</div>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#888888' }}>{today}</div>
      </div>

      {/* Content */}
      <div style={{ padding: '48px 0', maxWidth: 1280, margin: '0 auto' }}>
        {approvedItems.length === 0 ? (
          <div style={{
            margin: '0 48px',
            background: '#1A1A1A',
            borderRadius: 16,
            border: '1px solid #2A2A2A',
            padding: '80px 40px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginBottom: 10 }}>No Approved Assets Yet</h2>
            <p style={{ color: '#888888', fontSize: 14 }}>Assets will appear here once they are approved in the production workflow.</p>
          </div>
        ) : (
          approvedItems.map(({ asset, spec, files }, idx) => {
            const mediaFile = files.find(f => isVideo(f.original_name) || isImage(f.original_name));
            const isVid = mediaFile && isVideo(mediaFile.original_name);

            return (
              <div key={spec.id}>
                {/* Slide — 16:9 aspect ratio */}
                <div style={{
                  margin: '0 48px',
                  background: '#1A1A1A',
                  borderRadius: 12,
                  border: '1px solid #2A2A2A',
                  overflow: 'hidden',
                  aspectRatio: '16 / 9',
                  maxWidth: 1200,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  display: 'flex',
                }}>
                  {/* Left half: media */}
                  <div style={{
                    flex: 1,
                    background: '#111111',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRight: '1px solid #2A2A2A',
                  }}>
                    {mediaFile ? (
                      isVid ? (
                        <video
                          src={`/uploads/${mediaFile.filename}`}
                          controls
                          autoPlay
                          muted
                          loop
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <img
                          src={`/uploads/${mediaFile.filename}`}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )
                    ) : (
                      <div style={{ color: '#2A2A2A', fontSize: 13, textAlign: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 8px' }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="M21 15l-5-5L5 21" />
                        </svg>
                        No preview
                      </div>
                    )}
                  </div>

                  {/* Right half: info */}
                  <div style={{
                    flex: 1,
                    padding: '40px 44px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 20,
                    overflowY: 'auto',
                  }}>
                    {/* Approved badge */}
                    <div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'rgba(34,197,94,0.12)',
                        color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.3)',
                        display: 'inline-block',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}>
                        ✓ Approved
                      </span>
                    </div>

                    {/* Asset name */}
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                      {asset.name}
                    </h2>

                    {/* Badges row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {spec.format && (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                          {spec.format}
                        </span>
                      )}
                      {(spec.width || spec.height) && (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, color: '#888888', background: '#222222', border: '1px solid #2A2A2A' }}>
                          {spec.width}{spec.width && spec.height ? ' × ' : ''}{spec.height}
                        </span>
                      )}
                    </div>

                    {/* Designer */}
                    {spec.designer && (
                      <div style={{ fontSize: 13, color: '#888888' }}>
                        <span style={{ color: '#555555', marginRight: 6 }}>Designer</span>
                        <span style={{ color: '#CCCCCC', fontWeight: 600 }}>{spec.designer}</span>
                      </div>
                    )}

                    {/* Copy */}
                    {spec.copy && (
                      <div style={{
                        fontSize: 14,
                        color: '#AAAAAA',
                        lineHeight: 1.6,
                        fontStyle: 'italic',
                        borderLeft: '3px solid #F97316',
                        paddingLeft: 14,
                        maxHeight: 120,
                        overflow: 'hidden',
                      }}>
                        "{spec.copy.length > 200 ? spec.copy.slice(0, 200) + '…' : spec.copy}"
                      </div>
                    )}

                    {/* Approved date */}
                    {spec.due_approved && (
                      <div style={{ fontSize: 12, color: '#555555' }}>
                        Due: <span style={{ color: '#22C55E' }}>{formatApprovedDate(spec.due_approved)}</span>
                      </div>
                    )}

                    {/* All files list */}
                    {files.length > 0 && (
                      <div style={{ marginTop: 4, borderTop: '1px solid #2A2A2A', paddingTop: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Files ({files.length})
                        </div>
                        {files.map(f => (
                          <a
                            key={f.id}
                            href={`/uploads/${f.filename}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'block',
                              fontSize: 12,
                              color: '#F97316',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginBottom: 3,
                              textDecoration: 'none',
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            ↓ {f.original_name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider between slides */}
                {idx < approvedItems.length - 1 && (
                  <div style={{ margin: '32px 48px', height: 1, background: '#2A2A2A' }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '24px 48px', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', color: '#555555', fontSize: 12 }}>
        <span style={{ color: '#F97316', fontWeight: 700 }}>STRIKE</span>
        <span>Generated {today}</span>
      </div>
    </div>
  );
}
