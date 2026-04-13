'use client';

import { useState, useEffect } from 'react';
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
import { DataRow } from '../lib/types';
import { calcCampaignTotals, calcDailyMetricsByCampaign, shortCampaignName } from '../lib/calculations';
import { format, parseISO } from 'date-fns';

const COLORS = [
  '#2563EB', '#F97316', '#16A34A', '#DC2626', '#8B5CF6',
  '#EC4899', '#14B8A6', '#EAB308', '#06B6D4', '#84CC16', '#F43F5E', '#A855F7',
];

interface MetricOption {
  key: string;
  label: string;
  formula: string;
  isCost: boolean;
}

const METRICS: MetricOption[] = [
  { key: 'costPerLead', label: 'Costo / Lead', formula: 'Gasto / Leads', isCost: true },
  { key: 'costPerSchedule', label: 'Costo / Schedule', formula: 'Gasto / Schedules', isCost: true },
  { key: 'costPerCheckout', label: 'Costo / Agenda Calif.', formula: 'Gasto / Checkouts iniciados', isCost: true },
  { key: 'ctr', label: 'CTR', formula: 'Clics únicos / Impresiones × 100', isCost: false },
  { key: 'vslToLead', label: '% VSL → Lead', formula: 'Leads / Landing Page Views × 100', isCost: false },
  { key: 'leadToSchedule', label: '% Lead → Schedule', formula: 'Schedules / Leads × 100', isCost: false },
  { key: 'scheduleToCheckout', label: '% Schedule → Agenda', formula: 'Checkouts / Schedules × 100', isCost: false },
];

const TOOLTIP_STYLE = {
  backgroundColor: '#181b22',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '10px 14px',
  color: '#e8eaf0',
  fontSize: '12px',
};

function CustomTooltip({ active, payload, label, isCost }: {
  active?: boolean;
  payload?: { name: string; value: number | null; color: string }[];
  label?: string;
  isCost: boolean;
}) {
  if (!active || !payload?.length) return null;
  let dateLabel = label || '';
  try { dateLabel = format(parseISO(label || ''), 'dd/MM/yyyy'); } catch {}

  return (
    <div style={TOOLTIP_STYLE}>
      <p className="font-medium mb-2" style={{ color: '#e8eaf0', fontSize: 11 }}>{dateLabel}</p>
      {payload.filter((p) => p.value !== null).map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: '#9ca3af', fontSize: 11 }}>{p.name}:</span>
          <span className="font-mono" style={{ color: '#e8eaf0', fontSize: 11 }}>
            {p.value !== null ? (isCost ? `$${p.value.toFixed(2)}` : `${p.value.toFixed(1)}%`) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

interface CampaignChartProps {
  rows: DataRow[];
}

export default function CampaignChart({ rows }: CampaignChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('costPerLead');
  const [activeCampaigns, setActiveCampaigns] = useState<string[]>([]);

  const campaigns = Array.from(new Set(rows.map((r) => r.campaignName)));
  const totals = calcCampaignTotals(rows);
  const top5 = totals.sort((a, b) => b.amountSpent - a.amountSpent).slice(0, 5).map((t) => t.campaignName);

  useEffect(() => {
    setActiveCampaigns(top5);
  }, [selectedMetric, rows.length]);

  const dailyByCampaign = calcDailyMetricsByCampaign(rows, selectedMetric);
  const metric = METRICS.find((m) => m.key === selectedMetric)!;

  const toggleCampaign = (camp: string) => {
    setActiveCampaigns((prev) =>
      prev.includes(camp) ? prev.filter((c) => c !== camp) : [...prev, camp]
    );
  };

  const formatDate = (d: string) => {
    try { return format(parseISO(d), 'dd/MM'); } catch { return d; }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
            MÉTRICAS POR CAMPAÑA
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#4b5563' }}>
            {metric.formula}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {METRICS.map((m) => (
          <button
            key={m.key}
            className={`btn text-xs ${selectedMetric === m.key ? 'active' : ''}`}
            style={{ padding: '4px 10px' }}
            onClick={() => setSelectedMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
          Sin datos para el período seleccionado
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={dailyByCampaign} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatDate}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip isCost={metric.isCost} />}
              cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              onClick={(e) => toggleCampaign(e.dataKey as string)}
              formatter={(value) => (
                <span
                  style={{
                    color: activeCampaigns.includes(value) ? '#e8eaf0' : '#4b5563',
                    cursor: 'pointer',
                  }}
                >
                  {shortCampaignName(value)}
                </span>
              )}
            />
            {campaigns.map((camp, i) => (
              <Line
                key={camp}
                type="monotone"
                dataKey={camp}
                name={camp}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={activeCampaigns.includes(camp) ? 1.5 : 0}
                dot={false}
                activeDot={activeCampaigns.includes(camp) ? { r: 3 } : false}
                connectNulls={false}
                hide={!activeCampaigns.includes(camp)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
