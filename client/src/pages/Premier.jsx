import { authFetch } from '../App.jsx';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

function isImage(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
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
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Loading...
      </div>
    );
  }

  const printDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#0F172A',
        color: 'white',
        padding: '40px 60px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>
              CAPE Production · STRIKE
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
              {project?.name}
            </h1>
            {project?.client && (
              <div style={{ fontSize: 16, color: '#94A3B8', marginTop: 8 }}>{project.client}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>{printDate}</div>
            <div style={{
              marginTop: 12,
              padding: '6px 14px',
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              color: '#22C55E',
              display: 'inline-block',
            }}>
              ✓ Approved Assets
            </div>
          </div>
        </div>
      </div>

      {/* Print button */}
      <div className="no-print" style={{ padding: '16px 60px', background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 20px',
            background: '#0F172A',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🖨 Print / Export PDF
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '40px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {approvedItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px',
            background: 'white',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            color: '#64748B',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🎨</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#1A1A1A' }}>No Approved Assets Yet</h2>
            <p>Assets will appear here once they are approved in the production workflow.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24, fontSize: 14, color: '#64748B' }}>
              {approvedItems.length} approved asset{approvedItems.length !== 1 ? 's' : ''}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 24,
            }}>
              {approvedItems.map(({ asset, spec, files }) => {
                const thumbnail = files.find(f => isImage(f.original_name));
                return (
                  <div
                    key={spec.id}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      height: 200,
                      background: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderBottom: '1px solid #E2E8F0',
                    }}>
                      {thumbnail ? (
                        <img
                          src={`/uploads/${thumbnail.filename}`}
                          alt={asset.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <div style={{ color: '#CBD5E1', fontSize: 13 }}>No preview</div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{asset.name}</h3>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#F0FDF4',
                          color: '#16A34A',
                          border: '1px solid #BBF7D0',
                          flexShrink: 0,
                        }}>
                          ✓ Approved
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                        {spec.format && (
                          <span style={{ padding: '2px 8px', background: '#EFF6FF', color: '#2563EB', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                            {spec.format}
                          </span>
                        )}
                        {(spec.width || spec.height) && (
                          <span style={{ padding: '2px 8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11 }}>
                            {spec.width}{spec.width && spec.height ? ' × ' : ''}{spec.height}
                          </span>
                        )}
                        {spec.designer && (
                          <span style={{ padding: '2px 8px', background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11 }}>
                            Designer: {spec.designer}
                          </span>
                        )}
                      </div>

                      {spec.copy && (
                        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, borderTop: '1px solid #F1F5F9', paddingTop: 10, fontStyle: 'italic' }}>
                          "{spec.copy.length > 120 ? spec.copy.slice(0, 120) + '…' : spec.copy}"
                        </div>
                      )}

                      {files.length > 0 && (
                        <div style={{ marginTop: 12, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
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
                                color: '#2563EB',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginBottom: 2,
                              }}
                            >
                              ↓ {f.original_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '24px 60px', borderTop: '1px solid #E2E8F0', marginTop: 40, display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 12 }}>
        <span>STRIKE · CAPE Production</span>
        <span>Generated {printDate}</span>
      </div>
    </div>
  );
}
