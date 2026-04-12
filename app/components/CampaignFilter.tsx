'use client';

import { useState, useRef, useEffect } from 'react';

interface CampaignFilterProps {
  campaigns: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function CampaignFilter({ campaigns, selected, onChange }: CampaignFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allSelected = selected.length === campaigns.length;

  const toggle = (camp: string) => {
    if (selected.includes(camp)) {
      if (selected.length === 1) return;
      onChange(selected.filter((c) => c !== camp));
    } else {
      onChange([...selected, camp]);
    }
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : [...campaigns]);
  };

  const label = allSelected
    ? 'Todas las campañas'
    : selected.length === 0
    ? 'Sin campañas'
    : `${selected.length} campañas`;

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn flex items-center gap-2"
        onClick={() => setOpen(!open)}
        style={{ minWidth: 180 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span>{label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.15s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-10 right-0 z-50 rounded-xl shadow-2xl py-2"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid rgba(255,255,255,0.1)',
            minWidth: 260,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={toggleAll}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: allSelected ? '#3b82f6' : 'transparent',
                border: allSelected ? '1.5px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.2)',
              }}
            >
              {allSelected && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              Todas las campañas
            </span>
          </div>

          <div className="my-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />

          {campaigns.map((camp) => {
            const isSelected = selected.includes(camp);
            return (
              <div
                key={camp}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => toggle(camp)}
              >
                <div
                  className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: isSelected ? '#3b82f6' : 'transparent',
                    border: isSelected ? '1.5px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.2)',
                  }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm truncate"
                  style={{ color: isSelected ? 'var(--color-text)' : 'var(--color-text-muted)', maxWidth: 200 }}
                  title={camp}
                >
                  {camp}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
