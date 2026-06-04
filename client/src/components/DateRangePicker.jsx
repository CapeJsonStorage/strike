import React, { useState } from 'react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d) {
  if (!d) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(str) {
  if (!str) return null;
  const d = parseDate(str);
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day, start, end) {
  if (!start || !end) return false;
  return day > start && day < end;
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(startDate ? parseDate(startDate).getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate ? parseDate(startDate).getMonth() : today.getMonth());
  // picking: 'start' or 'end'
  const [picking, setPicking] = useState('start');

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
    const ds = formatDate(day);
    if (picking === 'start') {
      // If new start is after current end, clear end
      if (endD && day > endD) {
        onChange({ start: ds, end: null });
      } else {
        onChange({ start: ds, end: endDate || null });
      }
      setPicking('end');
    } else {
      // picking end
      if (startD && day < startD) {
        // clicked before start — reset and treat as new start
        onChange({ start: ds, end: null });
        setPicking('end');
      } else {
        onChange({ start: startDate || null, end: ds });
        setPicking('start');
      }
    }
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  // Display label
  let rangeLabel = null;
  if (startDate || endDate) {
    const sLabel = startDate ? formatDisplay(startDate) : '?';
    const eLabel = endDate ? formatDisplay(endDate) : '?';
    if (startDate && endDate) rangeLabel = `${sLabel} – ${eLabel}`;
    else if (startDate) rangeLabel = `From ${sLabel}`;
    else rangeLabel = `Until ${eLabel}`;
  }

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          type="button"
          onClick={prevMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '4px 8px', borderRadius: 4 }}
        >
          ‹
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, padding: '4px 8px', borderRadius: 4 }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', padding: '2px 0', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
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
                background: isEndpoint ? '#F97316' : inRange ? 'rgba(249,115,22,0.25)' : 'transparent',
                color: isEndpoint ? '#fff' : inRange ? '#F97316' : isToday ? '#F97316' : 'var(--text-primary)',
                textAlign: 'center',
                transition: 'all 0.1s',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isEndpoint) e.currentTarget.style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                if (!isEndpoint) e.currentTarget.style.background = inRange ? 'rgba(249,115,22,0.25)' : 'transparent';
              }}
            >
              {day.getDate()}
              {isEndpoint && (
                <span style={{
                  position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: '#fff', display: 'block',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Picking hint */}
      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        {picking === 'start' ? 'Click to set start date' : 'Click to set end date'}
      </div>

      {/* Range label */}
      {rangeLabel && (
        <div style={{
          marginTop: 10,
          padding: '6px 12px',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: '#F97316',
          textAlign: 'center',
        }}>
          {rangeLabel}
        </div>
      )}

      {/* Clear button */}
      {(startDate || endDate) && (
        <button
          type="button"
          onClick={() => { onChange({ start: null, end: null }); setPicking('start'); }}
          style={{
            marginTop: 8, width: '100%', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 11, color: 'var(--text-dim)', textDecoration: 'underline',
          }}
        >
          Clear dates
        </button>
      )}
    </div>
  );
}
