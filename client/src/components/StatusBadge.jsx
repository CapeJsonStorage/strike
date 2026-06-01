import React from 'react';

const STATUS_CONFIG = {
  producer_input: { label: 'Producer Input', color: '#64748B', bg: 'rgba(100,116,139,0.15)' },
  for_revision: { label: 'For Revision', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  for_client_revision: { label: 'For Client Review', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  approved: { label: 'Approved', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
};

export default function StatusBadge({ status, size = 'md' }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.producer_input;
  const fontSize = size === 'sm' ? '11px' : '12px';
  const padding = size === 'sm' ? '2px 8px' : '3px 10px';

  return (
    <span style={{
      display: 'inline-block',
      padding,
      borderRadius: '999px',
      fontSize,
      fontWeight: 600,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}40`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {cfg.label}
    </span>
  );
}

export { STATUS_CONFIG };
