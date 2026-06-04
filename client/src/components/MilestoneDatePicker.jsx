import React from 'react';

const MILESTONES = [
  {
    field: 'due_revision',
    label: 'For Revision',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
  },
  {
    field: 'due_client_review',
    label: 'Client Review',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.3)',
  },
  {
    field: 'due_approved',
    label: 'Approved',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
  },
];

export default function MilestoneDatePicker({ dueRevision, dueClientReview, dueApproved, onChange }) {
  const values = {
    due_revision: dueRevision || '',
    due_client_review: dueClientReview || '',
    due_approved: dueApproved || '',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {MILESTONES.map(m => (
        <div key={m.field} style={{
          background: m.bg,
          border: `1px solid ${m.border}`,
          borderRadius: 8,
          padding: '12px 14px',
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: m.color,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: m.color, display: 'inline-block', flexShrink: 0,
            }} />
            {m.label}
          </div>
          <input
            type="date"
            value={values[m.field]}
            onChange={e => onChange(m.field, e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: `1px solid ${m.border}`,
              borderRadius: 5,
              padding: '6px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
              colorScheme: 'dark',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
    </div>
  );
}
