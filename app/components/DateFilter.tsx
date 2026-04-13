'use client';

import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DateFilterProps {
  preset: string;
  dateRange: { start: string; end: string };
  previousRange: { start: string; end: string };
  onPresetChange: (preset: string, custom?: { start: string; end: string }) => void;
  onCompareRangeChange: (range: { start: string; end: string }) => void;
}

type SelectingStep = 'main-start' | 'main-end' | 'compare-start' | 'compare-end';

interface MiniCalendarProps {
  label: string;
  highlightStart: string | null;
  highlightEnd: string | null;
  tempStart: string | null;
  isSelectingEnd: boolean;
  color: string;
  onDayClick: (d: string) => void;
}

function MiniCalendar({ label, highlightStart, highlightEnd, tempStart, isSelectingEnd, color, onDayClick }: MiniCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const startOffset = startOfMonth(month).getDay();

  const toStr = (d: Date) => d.toISOString().split('T')[0];

  const isStart = (d: Date) => toStr(d) === highlightStart;
  const isEnd = (d: Date) => toStr(d) === highlightEnd;
  const isTS = (d: Date) => isSelectingEnd && toStr(d) === tempStart;
  const isInRange = (d: Date) => {
    const s = toStr(d);
    if (!highlightStart || !highlightEnd) return false;
    return s > highlightStart && s < highlightEnd;
  };
  const isToday = (d: Date) => isSameDay(d, new Date());

  return (
    <div className="flex-1 min-w-0">
      <div
        className="text-xs font-semibold mb-3 px-1"
        style={{ color }}
      >
        {label}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
          style={{ color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.05)' }}
        >
          ‹
        </button>
        <span className="text-xs font-medium capitalize" style={{ color: 'var(--color-text)' }}>
          {format(month, 'MMM yyyy', { locale: es })}
        </span>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-sm"
          style={{ color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.05)' }}
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs py-0.5" style={{ color: 'var(--color-text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startOffset }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((day) => {
          const s = isStart(day);
          const e = isEnd(day);
          const ts = isTS(day);
          const inR = isInRange(day);
          const tod = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(toStr(day))}
              className="text-xs py-1.5 transition-all relative"
              style={{
                background: s || e || ts
                  ? color
                  : inR
                  ? `${color}20`
                  : 'transparent',
                color: s || e || ts
                  ? '#fff'
                  : tod
                  ? color
                  : 'var(--color-text)',
                fontWeight: s || e || ts ? 600 : 400,
                borderRadius: s || ts ? '50% 0 0 50%' : e ? '0 50% 50% 0' : s && e ? '50%' : '0',
              }}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DateFilter({
  preset,
  dateRange,
  previousRange,
  onPresetChange,
  onCompareRangeChange,
}: DateFilterProps) {
  const [calOpen, setCalOpen] = useState(false);
  const [step, setStep] = useState<SelectingStep>('main-start');

  // Temp state while selecting
  const [mainTempStart, setMainTempStart] = useState<string | null>(null);
  const [compareTempStart, setCompareTempStart] = useState<string | null>(null);

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

  const formatDateShort = (d: string) => {
    try { return format(parseISO(d), 'd MMM', { locale: es }); } catch { return d; }
  };

  const handleMainDayClick = (d: string) => {
    if (step === 'main-start') {
      setMainTempStart(d);
      setStep('main-end');
    } else if (step === 'main-end') {
      const start = mainTempStart!;
      if (d < start) {
        setMainTempStart(d);
        return;
      }
      onPresetChange('custom', { start, end: d });
      setMainTempStart(null);
      setStep('compare-start');
    }
  };

  const handleCompareDayClick = (d: string) => {
    if (step === 'compare-start') {
      setCompareTempStart(d);
      setStep('compare-end');
    } else if (step === 'compare-end') {
      const start = compareTempStart!;
      if (d < start) {
        setCompareTempStart(d);
        return;
      }
      onCompareRangeChange({ start, end: d });
      setCompareTempStart(null);
      setCalOpen(false);
      setStep('main-start');
    }
  };

  const stepLabels: Record<SelectingStep, string> = {
    'main-start': 'Seleccioná fecha inicio del período principal',
    'main-end': `Desde ${mainTempStart ? formatDateShort(mainTempStart) : '...'} → seleccioná fecha fin`,
    'compare-start': 'Ahora seleccioná inicio del período de comparación',
    'compare-end': `Comparar desde ${compareTempStart ? formatDateShort(compareTempStart) : '...'} → seleccioná fecha fin`,
  };

  const isMainStep = step === 'main-start' || step === 'main-end';
  const isCompareStep = step === 'compare-start' || step === 'compare-end';

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
                setStep('main-start');
                setMainTempStart(null);
                setCompareTempStart(null);
              } else {
                onPresetChange(p.key);
                setCalOpen(false);
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
            className="absolute top-10 left-0 z-50 rounded-xl shadow-xl p-5"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              width: 560,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isMainStep ? '#2563eb' : '#22c55e',
                    color: '#fff',
                  }}
                >
                  {isMainStep ? '1' : '✓'}
                </div>
                <span className="text-xs font-medium" style={{ color: isMainStep ? '#2563eb' : '#22c55e' }}>
                  Período principal
                </span>
              </div>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: isCompareStep ? '#f97316' : 'var(--color-border)',
                    color: isCompareStep ? '#fff' : 'var(--color-text-muted)',
                  }}
                >
                  2
                </div>
                <span className="text-xs font-medium" style={{ color: isCompareStep ? '#f97316' : 'var(--color-text-muted)' }}>
                  Comparar con
                </span>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-xs mb-4 text-center font-medium" style={{ color: 'var(--color-text-muted)' }}>
              {stepLabels[step]}
            </p>

            {/* Two calendars side by side */}
            <div className="flex gap-6">
              <MiniCalendar
                label="Período principal"
                highlightStart={isMainStep && mainTempStart ? mainTempStart : dateRange.start}
                highlightEnd={isMainStep ? null : dateRange.end}
                tempStart={step === 'main-end' ? mainTempStart : null}
                isSelectingEnd={step === 'main-end'}
                color="#2563eb"
                onDayClick={isMainStep ? handleMainDayClick : () => {}}
              />

              <div style={{ width: 1, background: 'var(--color-border)' }} />

              <MiniCalendar
                label="Comparar con"
                highlightStart={isCompareStep && compareTempStart ? compareTempStart : previousRange.start}
                highlightEnd={isCompareStep ? null : previousRange.end}
                tempStart={step === 'compare-end' ? compareTempStart : null}
                isSelectingEnd={step === 'compare-end'}
                color="#f97316"
                onDayClick={isCompareStep ? handleCompareDayClick : () => {}}
              />
            </div>

            {/* Skip compare button */}
            {isCompareStep && (
              <div className="mt-4 flex justify-end">
                <button
                  className="btn text-xs"
                  style={{ padding: '4px 12px' }}
                  onClick={() => {
                    setCalOpen(false);
                    setStep('main-start');
                    setCompareTempStart(null);
                  }}
                >
                  Omitir comparación
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date display */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <span
          className="px-2 py-1 rounded-md font-medium"
          style={{ background: 'rgba(37,99,235,0.08)', color: '#2563eb' }}
        >
          {formatDateShort(dateRange.start)} — {formatDateShort(dateRange.end)}
        </span>
        <span className="opacity-50">vs</span>
        <span
          className="px-2 py-1 rounded-md"
          style={{ background: 'rgba(249,115,22,0.08)', color: '#f97316' }}
        >
          {formatDateShort(previousRange.start)} — {formatDateShort(previousRange.end)}
        </span>
      </div>
    </div>
  );
}
