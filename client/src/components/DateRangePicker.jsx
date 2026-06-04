import React, { useState, useEffect } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDate(str) {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(str) {
  const d = parseDate(str);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sameDay(a, b) {
  return a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(day, start, end) {
  if (!start || !end) return false;
  return day > start && day < end;
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const today = new Date();

  // Safe initial month/year — fall back to today if startDate is null/invalid
  const initFromDate = parseDate(startDate);
  const [viewYear, setViewYear] = useState(initFromDate ? initFromDate.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initFromDate ? initFromDate.getMonth() : today.getMonth());
  const [picking, setPicking] = useState('start');
  const [locked, setLocked] = useState(!!(startDate && endDate));

  // When props arrive after initial render (e.g. loaded from DB), sync the view
  useEffect(() => {
    const d = parseDate(startDate);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
    // If both dates present on load, lock automatically
    if (startDate && endDate) {
      setLocked(true);
    }
  }, [startDate, endDate]);

  const startD = parseDate(startDate);
  const endD = parseDate(endDate);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function handleDayClick(day) {
    if (locked) return;
    const ds = formatDate(day);
    if (picking === 'start') {
      onChange({ start: ds, end: null });
      setPicking('end');
    } else {
      if (startD && day < startD) {
        // clicked before start — swap
        onChange({ start: ds, end: null });
        setPicking('end');
      } else {
        onChange({ start: startDate || null, end: ds });
        setPicking('start');
        // Auto-lock once both are set
        setLocked(true);
      }
    }
  }

  function handleClear() {
    onChange({ start: null, end: null });
    setPicking('start');
    setLocked(false);
  }

  function handleEdit() {
    setLocked(false);
    setPicking('start');
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  // Range label
  let rangeLabel = null;
  if (startDate || endDate) {
    const sLabel = formatDisplay(startDate) || '?';
    const eLabel = formatDisplay(endDate) || '?';
    if (startDate && endDate) rangeLabel = `${sLabel} – ${eLabel}`;
    else if (startDate) rangeLabel = `From ${sLabel}`;
    else rangeLabel = `Until ${eLabel}`;
  }

  // --- LOCKED VIEW: just show the saved range as a pill with Edit button ---
  if (locked && startDate && endDate) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          padding: '10px 16px',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.35)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F97316' }}>
              {formatDisplay(startDate)} – {formatDisplay(endDate)}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleEdit}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={handleClear}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--danger)', textDecoration: 'underline' }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- OPEN VIEW: full calendar ---
  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px', borderRadius: 4 }}>
          ‹
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button type="button" onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, padding: '4px 8px', borderRadius: 4 }}>
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const isStart = startD && sameDay(day, startD);
          const isEnd = endD && sameDay(day, endD);
          const inRange = isInRange(day, startD, endD);
          const isToday = sameDay(day, today);
          const isEndpoint = isStart || isEnd;

          return (
            <button
              key={day.getDate()}
              type="button"
              onClick={() => handleDayClick(day)}
              style={{
                border: 'none',
                borderRadius: isEndpoint ? '50%' : 4,
                padding: '6px 0',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: isEndpoint ? 700 : isToday ? 600 : 400,
                background: isEndpoint ? '#F97316' : inRange ? 'rgba(249,115,22,0.22)' : 'transparent',
                color: isEndpoint ? '#fff' : inRange ? '#F97316' : isToday ? '#F97316' : 'var(--text-primary)',
                textAlign: 'center',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { if (!isEndpoint) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!isEndpoint) e.currentTarget.style.background = inRange ? 'rgba(249,115,22,0.22)' : 'transparent'; }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        {!startDate ? 'Click to set start date' : !endDate ? 'Click to set end date' : ''}
      </div>

      {/* Range preview */}
      {rangeLabel && (
        <div style={{
          marginTop: 10, padding: '8px 14px',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 6, fontSize: 12, fontWeight: 600,
          color: '#F97316', textAlign: 'center',
        }}>
          {rangeLabel}
        </div>
      )}

      {/* Save / Clear */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {startDate && endDate && (
          <button
            type="button"
            onClick={() => { setLocked(true); }}
            style={{
              flex: 1, padding: '7px 0',
              background: '#F97316', border: 'none',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}
          >
            ✓ Save Dates
          </button>
        )}
        {(startDate || endDate) && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              flex: 1, background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 6, cursor: 'pointer',
              fontSize: 12, color: 'var(--text-dim)', padding: '7px 0',
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
