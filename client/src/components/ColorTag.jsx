import React from 'react';

export default function ColorTag({ label, color = '#3B82F6' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 600,
      color,
      background: `${color}20`,
      border: `1px solid ${color}40`,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  );
}
