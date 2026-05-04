'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DailyMetrics } from '../lib/types';
import { format, parseISO } from 'date-fns';

interface TrendChartsProps {
  dailyData: DailyMetrics[];
  prevDailyData: DailyMetrics[];
}

const TOOLTIP_STYLE = {
  backgroundColor: '#181b22',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '10px 14px',
  color: '#e8eaf0',
  fontSize: '12px',
};

function CustomTooltip({ active, payload, label, formatValue }: {
  active?: boolean;
  payload?: { name: string; value: number | null; color: string }[];
  label?: string;
  formatValue: (name: string, value: number | null) => string;
}) {
  if (!active || !payload?.length) return null;
  let dateLabel = label || '';
  try { dateLabel = format(parseISO(label || ''), 'dd/MM/yyyy'); } catch {}

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="font-medium mb-2" style={{ color: '#e8eaf0', fontSize: 11 }}>{dateLabel}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span style={{ color: '#9ca3af', fontSize: 11 }}>{p.name}:</span>
          <span className="font-mono" style={{ color: '#e8eaf0', fontSize: 11 }}>
            {formatValue(p.name, p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

const formatDate = (d: string) => {
  try { return format(parseISO(d), 'dd/MM'); } catch { return d; }
};

// Calculate % change between current and prev period totals for a metric key
function calcChange(current: DailyMetrics[], prev: DailyMetrics[], key: keyof DailyMetrics): number | null {
  const sumCurrent = current.reduce((s, d) => s + ((d[key] as number) || 0), 0);
  const sumPrev = prev.reduce((s, d) => s + ((d[key] as number) || 0), 0);
  if (sumPrev === 0) return null;
  return ((sumCurrent - sumPrev) / Math.abs(sumPrev)) * 100;
}

function ChangeBadge({ pct, invert = false }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return null;
  const isGood = invert ? pct < 0 : pct > 0;
  const color = isGood ? '#22c55e' : '#ef4444';
  const arrow = pct >= 0 ? '↑' : '↓';
  return (
    <span
      className="font-mono text-xs ml-1 px-1 py-0.5 rounded"
      style={{ color, background: `${color}18`, fontSize: 9 }}
    >
      {arrow}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

interface LineConfig {
  key: keyof DailyMetrics;
  label: string;
  color: string;
  yAxisId?: string;
  isGlobal?: boolean;
  invertBadge?: boolean;
}

interface ChartConfig {
  title: string;
  lines: LineConfig[];
  formatValue: (name: string, value: number | null) => string;
}

export default function TrendCharts({ dailyData, prevDailyData }: TrendChartsProps) {
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const charts: ChartConfig[] = [
    {
      title: 'Costos por Evento',
      lines: [
        { key: 'costPerLead', label: 'Costo/Lead', color: '#8B5CF6', invertBadge: true },
        { key: 'costPerSchedule', label: 'Costo/Schedule', color: '#F97316', invertBadge: true },
        { key: 'costPerCheckout', label: 'Costo/Agenda Calif.', color: '#2563EB', invertBadge: true },
        { key: 'costPerShow', label: 'Costo/Show ⚡', color: '#EAB308', isGlobal: true, invertBadge: true },
      ],
      formatValue: (_, v) => (v !== null && v !== 0 ? `$${v.toFixed(2)}` : v === 0 ? '$0' : '—'),
    },
    {
      title: 'Conversión desde VSL',
      lines: [
        { key: 'vslToLead', label: 'VSL → Lead', color: '#8B5CF6' },
        { key: 'vslToSchedule', label: 'VSL → Agenda', color: '#14B8A6' },
        { key: 'vslToCheckout', label: 'VSL → Agenda Calif.', color: '#F97316' },
      ],
      formatValue: (_, v) => (v !== null ? `${v.toFixed(1)}%` : '—'),
    },
    {
      title: 'Volumen Diario',
      lines: [
        { key: 'amountSpent', label: 'Gasto', color: '#F97316', yAxisId: 'left' },
        { key: 'leads', label: 'Leads', color: '#8B5CF6', yAxisId: 'right' },
        { key: 'appointmentsScheduled', label: 'Schedules', color: '#2563EB', yAxisId: 'right' },
        { key: 'checkoutsInitiated', label: 'Agendas Calif.', color: '#22c55e', yAxisId: 'right' },
        { key: 'shows', label: 'Shows ⚡', color: '#EAB308', yAxisId: 'right', isGlobal: true },
      ],
      formatValue: (name, v) => {
        if (v === null) return '—';
        return name === 'Gasto' ? `$${v.toFixed(2)}` : v.toString();
      },
    },
    {
      title: 'Eficiencia de Tráfico',
      lines: [
        { key: 'cpc', label: 'CPC', color: '#ef4444', yAxisId: 'left', invertBadge: true },
        { key: 'cpm', label: 'CPM', color: '#14B8A6', yAxisId: 'left', invertBadge: true },
        { key: 'ctr', label: 'CTR', color: '#EAB308', yAxisId: 'right' },
      ],
      formatValue: (name, v) => {
        if (v === null) return '—';
        return name === 'CTR' ? `${v.toFixed(2)}%` : `$${v.toFixed(2)}`;
      },
    },
  ];

  const toggleLine = (chartIdx: number, lineKey: string) => {
    const key = `${chartIdx}-${lineKey}`;
    setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isHidden = (chartIdx: number, lineKey: string) => !!hiddenLines[`${chartIdx}-${lineKey}`];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {charts.map((chart, chartIdx) => {
        const hasRightAxis = chart.lines.some((l) => l.yAxisId === 'right');

        return (
          <div key={chartIdx} className="card p-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                {chart.title.toUpperCase()}
              </h3>
              {chart.lines.some((l) => l.isGlobal) && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', fontSize: 9 }}
                  title="Las líneas ⚡ son globales y no responden al filtro de campaña"
                >
                  ⚡ incl. global
                </span>
              )}
            </div>

            {/* Legend with change badges */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
              {chart.lines.map((line) => {
                const hidden = isHidden(chartIdx, line.key as string);
                const pct = calcChange(dailyData, prevDailyData, line.key);
                return (
                  <button
                    key={line.key as string}
                    onClick={() => toggleLine(chartIdx, line.key as string)}
                    className="flex items-center gap-1"
                    style={{ opacity: hidden ? 0.35 : 1 }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: line.color }} />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{line.label}</span>
                    {!hidden && <ChangeBadge pct={pct} invert={line.invertBadge} />}
                  </button>
                );
              })}
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyData} margin={{ top: 5, right: hasRightAxis ? 20 : 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  tickFormatter={formatDate}
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                {hasRightAxis && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                )}
                <Tooltip
                  content={<CustomTooltip formatValue={chart.formatValue} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                />
                {chart.lines.map((line) => (
                  <Line
                    key={line.key as string}
                    type="monotone"
                    dataKey={line.key as string}
                    name={line.label}
                    stroke={line.color}
                    strokeWidth={isHidden(chartIdx, line.key as string) ? 0 : 1.5}
                    dot={false}
                    activeDot={{ r: 3, fill: line.color }}
                    yAxisId={line.yAxisId || 'left'}
                    connectNulls={false}
                    hide={isHidden(chartIdx, line.key as string)}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
