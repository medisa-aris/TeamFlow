'use client';
import { useState, useEffect, useRef } from 'react';
import { Icons } from '@/components/ui/icons';

export function MultiSelectDropdown({ options, selected, onChange, placeholder, onSelectAll, onClearAll }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const displayLabel = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label || selected[0])
      : `${selected.length} dipilih`;

  return (
    <div ref={ref} style={{ position: 'relative', flex: '1 1 160px', minWidth: 140 }}>
      <div className="tbx row" style={{ cursor: 'pointer', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
           onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 13, color: selected.length ? 'var(--text)' : 'var(--text-dim2, #888)' }}>{displayLabel}</span>
        <Icons.Chevron size={14} style={{ flexShrink: 0 }} />
      </div>
      {open && (
        <div className="card solid" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          padding: '4px 0', maxHeight: 240, overflowY: 'auto', boxShadow: 'var(--shadow-flyout)', borderRadius: 8 }}>
          {(onSelectAll || onClearAll) && (
            <div className="row gap8" style={{ padding: '6px 12px 4px', borderBottom: '1px solid var(--divider)' }}>
              {onSelectAll && (
                <button style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                        onClick={(e) => { e.stopPropagation(); onSelectAll(); }}>Semua Anggota</button>
              )}
              {onSelectAll && onClearAll && <span className="dim2" style={{ fontSize: 12 }}>·</span>}
              {onClearAll && (
                <button style={{ fontSize: 12, color: '#c42b1c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={(e) => { e.stopPropagation(); onClearAll(); }}>Hapus Semua</button>
              )}
            </div>
          )}
          {options.map((o) => (
            <label key={o.value} className="row gap8 reveal" style={{ padding: '7px 12px', cursor: 'pointer', alignItems: 'center' }}>
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)}
                     style={{ accentColor: 'var(--accent)', width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ fontSize: 13 }}>{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
