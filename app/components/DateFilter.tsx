'use client';

import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateFilterProps {
  preset: string;
  dateRange: { start: string; end: string };
  previousRange: { start: string; end: string };
  onPresetChange: (preset: string, custom?: { start: string; end: string }) => void;
}

export default function DateFilter({ preset, dateRange, previousRange, onPresetChange }: DateFilterProps) {
  const [calOpen, setCalOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setCalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const presets = [
    { key: '7d', label: 'Últ. 7 días' },
    { key: '14d', label: 'Últ. 14 días' },
    { key: '30d', label: 'Últ. 30 días' },
    { key: 'custom', label: 'Custom' },
  ];

  const days = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });
  const startOfWeek = startOfMonth(calMonth).getDay();

  const handleDayClick = (date: Date) => {
    const d = date.toISOString().split('T')[0];
    if (selecting === 'start') {
      setTempStart(d);
      setSelecting('end');
    } else {
      const start = tempStart!;
      const end = d;
      if (start > end) {
        setTempStart(d);
        setSelecting('end');
      } else {
        onPresetChange('custom', { start, end });
        setCalOpen(false);
        setSelecting('start');
        setTempStart(null);
      }
    }
  };

  const isInRange = (date: Date): boolean => {
    const d = date.toISOString().split('T')[0];
    if (selecting === 'end' && tempStart) {
      return d >= tempStart && d <= (tempStart);
    }
    return d >= dateRange.start && d <= dateRange.end;
  };

  const isRangeDay = (date: Date): boolean => {
    if (selecting === 'end' && tempStart) return false;
    const d = date.toISOString().split('T')[0];
    return d > dateRange.start && d < dateRange.end;
  };

  const isStart = (date: Date) => date.toISOString().split('T')[0] === dateRange.start;
  const isEnd = (date: Date) => date.toISOString().split('T')[0] === dateRange.end;
  const isTempStart = (date: Date) => selecting === 'end' && tempStart === date.toISOString().split('T')[0];

  const formatDateShort = (d: string) => {
    try { return format(parseISO(d), 'd MMM', { locale: es }); } catch { return d; }
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1">
        {presets.map((p) => (
          <button
            key={p.key}
            className={`btn ${preset === p.key ? 'active' : ''}`}
            onClick={() => {
              if (p.key === 'custom') {
                setCalOpen(true);
                setSelecting('start');
                setTempStart(null);
              } else {
                onPresetChange(p.key);
              }
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative" ref={ref}>
        {calOpen && (
          <div
            className="absolute top-10 left-0 z-50 rounded-xl shadow-2xl p-4"
            style={{ background: 'var(--color-surface-2)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 280 }}
          >
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalMonth(subMonths(calMonth, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400"
              >
                ‹
              </button>
              <span className="text-sm font-medium capitalize">
                {format(calMonth, 'MMMM yyyy', { locale: es })}
              </span>
              <button
                onClick={() => setCalMonth(addMonths(calMonth, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-0 mb-1">
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0">
              {Array.from({ length: startOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
              {days.map((day) => {
                const inRange = isRangeDay(day);
                const isS = isStart(day);
                const isE = isEnd(day);
                const isTS = isTempStart(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      text-xs py-1.5 relative transition-colors
                      ${isS || isE || isTS ? 'text-white font-semibold' : 'text-gray-300'}
                      ${inRange ? 'bg-blue-500/20' : ''}
                      ${isS || isTS ? 'bg-blue-500 rounded-l-full' : ''}
                      ${isE && !isS ? 'bg-blue-500 rounded-r-full' : ''}
                      ${isS && isE ? 'rounded-full' : ''}
                      ${isToday && !isS && !isE && !isTS ? 'text-blue-400' : ''}
                      hover:opacity-80
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {selecting === 'end' && tempStart && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Desde {formatDateShort(tempStart)} → seleccioná fecha fin
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span>{formatDateShort(dateRange.start)} — {formatDateShort(dateRange.end)}</span>
        <span className="opacity-50">vs</span>
        <span className="opacity-60">{formatDateShort(previousRange.start)} — {formatDateShort(previousRange.end)}</span>
      </div>
    </div>
  );
}
