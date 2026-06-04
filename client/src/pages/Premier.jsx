import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function isImage(fn) { return fn && IMAGE_EXTS.includes(fn.split('.').pop().toLowerCase()); }
function isVideo(fn) { return fn && fn.split('.').pop().toLowerCase() === 'mp4'; }

function formatDate(str) {
  if (!str) return null;
  // Handle both "YYYY-MM-DD" and ISO "YYYY-MM-DDT..." from Postgres
  const clean = String(str).slice(0, 10); // take just the date part
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ item, onClose }) {
  const mediaFiles = item.files.filter(f => isVideo(f.original_name) || isImage(f.original_name));
  const [idx, setIdx] = useState(0);
  const current = mediaFiles[idx];
  const isVid = current && isVideo(current.original_name);
  const hasMultiple = mediaFiles.length > 1;

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % mediaFiles.length);
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, mediaFiles.length]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.93)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Close */}
      <button onClick={onClose} style={{
        position: 'fixed', top: 20, right: 28, background: 'none', border: 'none',
        cursor: 'pointer', color: '#888', fontSize: 36, lineHeight: 1, zIndex: 1001,
      }}>×</button>

      {/* Prev arrow */}
      {hasMultiple && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + mediaFiles.length) % mediaFiles.length); }}
          style={{
            position: 'fixed', left: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%', width: 48, height: 48, cursor: 'pointer',
            color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001,
          }}
        >‹</button>
      )}

      {/* Media */}
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '88vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {current ? (
          isVid ? (
            <video key={current.filename} src={`/uploads/${current.filename}`} controls autoPlay muted loop
              style={{ maxWidth: '88vw', maxHeight: '82vh', borderRadius: 8 }} />
          ) : (
            <img key={current.filename} src={`/uploads/${current.filename}`} alt={item.asset.name}
              style={{ maxWidth: '88vw', maxHeight: '82vh', borderRadius: 8, objectFit: 'contain' }} />
          )
        ) : (
          <div style={{ color: '#444', fontSize: 14 }}>No media</div>
        )}
      </div>

      {/* Next arrow */}
      {hasMultiple && (
        <button
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % mediaFiles.length); }}
          style={{
            position: 'fixed', right: 20, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '50%', width: 48, height: 48, cursor: 'pointer',
            color: '#fff', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1001,
          }}
        >›</button>
      )}

      {/* Bottom: asset name + counter */}
      <div style={{
        position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none',
      }}>
        <span style={{ color: '#ccc', fontSize: 14, fontWeight: 600 }}>{item.asset.name}</span>
        {hasMultiple && (
          <div style={{ display: 'flex', gap: 6 }}>
            {mediaFiles.map((_, i) => (
              <div key={i} style={{
                width: i === idx ? 20 : 6, height: 6, borderRadius: 3,
                background: i === idx ? '#F97316' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        )}
        <span style={{ color: '#555', fontSize: 12 }}>
          {hasMultiple ? `${idx + 1} / ${mediaFiles.length} — ` : ''}Esc to close{hasMultiple ? ' · ← → to navigate' : ''}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Premier() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [approvedItems, setApprovedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState(null);

  useEffect(() => {
    Promise.all([
      authFetch(`/api/projects/${id}`).then(r => r.json()),
      authFetch(`/api/projects/${id}/assets`).then(r => r.json()),
      authFetch(`/api/projects/${id}/vendors`).then(r => r.json()).catch(() => []),
    ]).then(async ([proj, assets, vends]) => {
      setProject(proj);
      setVendors(Array.isArray(vends) ? vends : []);

      const items = [];
      for (const asset of (Array.isArray(assets) ? assets : [])) {
        const specs = await authFetch(`/api/assets/${asset.id}/specifications`).then(r => r.json());
        const approved = (Array.isArray(specs) ? specs : []).filter(s => s.status === 'approved');
        for (const spec of approved) {
          const files = await authFetch(`/api/specifications/${spec.id}/files`).then(r => r.json()).catch(() => []);
          items.push({ asset, spec, files: Array.isArray(files) ? files.filter(f => f.file_type === 'version') : [] });
        }
      }
      setApprovedItems(items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontFamily: 'system-ui, sans-serif' }}>
        Loading…
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const hasVenue = project?.venue_name || project?.venue_location || project?.venue_contact;
  const timelineLabel = (project?.timeline_start && project?.timeline_end)
    ? `${formatDate(project.timeline_start)} – ${formatDate(project.timeline_end)}`
    : null;

  return (
    <div style={{ minHeight: '100vh', background: '#111', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Lightbox */}
      {lightboxItem && <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />}

      {/* Sticky header */}
      <div style={{
        background: '#1A1A1A', borderBottom: '1px solid #2A2A2A',
        padding: '18px 48px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <NavLink to={`/projects/${id}/overview`}
            style={{ color: '#666', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </NavLink>
          <div style={{ width: 1, height: 20, background: '#2A2A2A' }} />
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: '#F97316' }}>STRIKE</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>{project?.name}</div>
          {project?.client && <div style={{ fontSize: 13, color: '#888' }}>{project.client}</div>}
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>{today}</div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 48px 80px' }}>

        {/* ── Project Info Block ─────────────────────────────────────── */}
        {(timelineLabel || hasVenue || vendors.length > 0) && (
          <div style={{
            background: '#1A1A1A', borderRadius: 12, border: '1px solid #2A2A2A',
            padding: '32px 40px', marginBottom: 48,
            display: 'grid',
            gridTemplateColumns: `repeat(${[timelineLabel, hasVenue, vendors.length > 0].filter(Boolean).length}, 1fr)`,
            gap: 32,
          }}>

            {/* Timeline */}
            {timelineLabel && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F97316', marginBottom: 10 }}>
                  Production Dates
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 8,
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                }}>
                  <span style={{ fontSize: 14 }}>📅</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F97316' }}>{timelineLabel}</span>
                </div>
              </div>
            )}

            {/* Venue */}
            {hasVenue && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F97316', marginBottom: 10 }}>
                  Venue
                </div>
                {project.venue_name && (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{project.venue_name}</div>
                )}
                {project.venue_location && (
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 3 }}>📍 {project.venue_location}</div>
                )}
                {project.venue_contact && (
                  <div style={{ fontSize: 13, color: '#888' }}>✉ {project.venue_contact}</div>
                )}
              </div>
            )}

            {/* Vendors */}
            {vendors.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F97316', marginBottom: 10 }}>
                  Vendors
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vendors.map(v => (
                    <div key={v.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#ccc' }}>{v.vendor_name}</span>
                      {v.vendor_type && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 7px',
                          borderRadius: 4, background: 'rgba(249,115,22,0.1)',
                          border: '1px solid rgba(249,115,22,0.25)', color: '#F97316',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          {v.vendor_type}
                        </span>
                      )}
                      {v.vendor_contact && (
                        <span style={{ fontSize: 12, color: '#555' }}>{v.vendor_contact}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Approved Assets ────────────────────────────────────────── */}
        {approvedItems.length === 0 ? (
          <div style={{
            background: '#1A1A1A', borderRadius: 16, border: '1px solid #2A2A2A',
            padding: '80px 40px', textAlign: 'center',
          }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 20px' }}>
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>No Approved Assets Yet</h2>
            <p style={{ color: '#888', fontSize: 14 }}>Assets appear here once approved in the Specifications workflow.</p>
          </div>
        ) : (
          approvedItems.map(({ asset, spec, files }, idx) => {
            const mediaFile = files.find(f => isVideo(f.original_name) || isImage(f.original_name));
            const isVid = mediaFile && isVideo(mediaFile.original_name);

            return (
              <div key={spec.id}>
                {/* 16:9 slide */}
                <div style={{
                  background: '#1A1A1A', borderRadius: 12,
                  border: '1px solid #2A2A2A', overflow: 'hidden',
                  aspectRatio: '16 / 9',
                  display: 'flex',
                }}>
                  {/* Left — clickable media */}
                  <div
                    onClick={() => setLightboxItem({ asset, spec, files })}
                    style={{
                      flex: 1, background: '#0D0D0D',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', borderRight: '1px solid #2A2A2A',
                      cursor: 'zoom-in', position: 'relative',
                    }}
                    title="Click to enlarge"
                  >
                    {mediaFile ? (
                      isVid ? (
                        <video
                          src={`/uploads/${mediaFile.filename}`}
                          muted loop autoPlay
                          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                        />
                      ) : (
                        <img
                          src={`/uploads/${mediaFile.filename}`}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      )
                    ) : (
                      <div style={{ color: '#2A2A2A', textAlign: 'center' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2A2A2A" strokeWidth="1.5" style={{ display: 'block', margin: '0 auto 8px' }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                        </svg>
                        <span style={{ fontSize: 12 }}>No preview</span>
                      </div>
                    )}
                    {/* Hover zoom indicator */}
                    {mediaFile && (
                      <div style={{
                        position: 'absolute', bottom: 10, right: 10,
                        background: 'rgba(0,0,0,0.6)', borderRadius: 6,
                        padding: '4px 8px', fontSize: 11, color: '#aaa',
                        pointerEvents: 'none',
                      }}>
                        🔍 Click to enlarge
                      </div>
                    )}
                  </div>

                  {/* Right — info */}
                  <div style={{
                    flex: 1, padding: '36px 44px',
                    display: 'flex', flexDirection: 'column',
                    justifyContent: 'center', gap: 18, overflowY: 'auto',
                  }}>
                    <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                      {asset.name}
                    </h2>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {spec.format && (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'rgba(249,115,22,0.12)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                          {spec.format}
                        </span>
                      )}
                      {(spec.width || spec.height) && (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, color: '#888', background: '#222', border: '1px solid #2A2A2A' }}>
                          {spec.width}{spec.width && spec.height ? ' × ' : ''}{spec.height}
                        </span>
                      )}
                      {asset.type && (
                        <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, color: '#888', background: '#222', border: '1px solid #2A2A2A', textTransform: 'capitalize' }}>
                          {asset.type}
                        </span>
                      )}
                    </div>

                    {spec.copy && (
                      <div style={{
                        fontSize: 13, color: '#aaa', lineHeight: 1.6, fontStyle: 'italic',
                        borderLeft: '3px solid #F97316', paddingLeft: 14,
                        maxHeight: 100, overflow: 'hidden',
                      }}>
                        "{spec.copy.length > 180 ? spec.copy.slice(0, 180) + '…' : spec.copy}"
                      </div>
                    )}

                    {files.length > 0 && (
                      <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: 12, marginTop: 4 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                          Files ({files.length})
                        </div>
                        {files.map(f => (
                          <a key={f.id} href={`/uploads/${f.filename}`} target="_blank" rel="noreferrer"
                            style={{ display: 'block', fontSize: 12, color: '#F97316', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3, textDecoration: 'none' }}
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

                {idx < approvedItems.length - 1 && (
                  <div style={{ margin: '32px 0', height: 1, background: '#2A2A2A' }} />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '20px 48px', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: 12 }}>
        <span style={{ color: '#F97316', fontWeight: 700 }}>STRIKE</span>
        <span>Generated {today}</span>
      </div>
    </div>
  );
}
