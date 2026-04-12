'use client';

import { KpiMetrics } from '../lib/types';
import { formatMetricValue } from '../lib/calculations';

interface FunnelChartProps {
  metrics: KpiMetrics;
}

const STAGES = [
  { key: 'totalImpressions', label: 'Impresiones', color: '#2563EB' },
  { key: 'totalClicks', label: 'Clics', color: '#8B5CF6' },
  { key: 'totalLandingViews', label: 'Visitas VSL', color: '#14B8A6' },
  { key: 'totalLeads', label: 'Leads', color: '#F97316' },
  { key: 'totalSchedules', label: 'Schedules', color: '#EC4899' },
  { key: 'totalCheckouts', label: 'Agendas Calif.', color: '#22c55e' },
];

function conversionBadgeColor(pct: number | null): string {
  if (pct === null) return '#6b7280';
  if (pct >= 60) return '#22c55e';
  if (pct >= 30) return '#eab308';
  return '#ef4444';
}

export default function FunnelChart({ metrics }: FunnelChartProps) {
  const values: Record<string, number> = {
    totalImpressions: metrics.totalImpressions,
    totalClicks: metrics.totalClicks,
    totalLandingViews: metrics.totalLandingViews,
    totalLeads: metrics.totalLeads,
    totalSchedules: metrics.totalSchedules,
    totalCheckouts: metrics.totalCheckouts,
  };

  const max = values.totalImpressions || 1;

  return (
    <div className="card p-6">
      <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--color-text-muted)' }}>
        EMBUDO DE CONVERSIÓN
      </h2>

      <div className="flex flex-col gap-1">
        {STAGES.map((stage, idx) => {
          const value = values[stage.key] || 0;
          const widthPct = Math.max(30, (value / max) * 100);

          const nextStage = STAGES[idx + 1];
          const nextValue = nextStage ? values[nextStage.key] || 0 : null;
          const convPct = nextValue !== null && value > 0 ? (nextValue / value) * 100 : null;

          return (
            <div key={stage.key}>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="h-10 rounded-lg flex items-center px-3 transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    background: `${stage.color}22`,
                    borderLeft: `3px solid ${stage.color}`,
                    minWidth: 120,
                  }}
                >
                  <span className="text-xs font-medium" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                  <span
                    className="ml-auto font-mono text-sm font-semibold"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {value.toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {nextStage && (
                <div className="flex items-center gap-2 pl-4 py-0.5 mb-1">
                  <div className="w-px h-4" style={{ background: `${stage.color}40` }} />
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{
                      color: conversionBadgeColor(convPct),
                      background: `${conversionBadgeColor(convPct)}15`,
                      border: `1px solid ${conversionBadgeColor(convPct)}30`,
                    }}
                  >
                    {convPct !== null ? `${convPct.toFixed(1)}%` : '—'} → {nextStage.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
