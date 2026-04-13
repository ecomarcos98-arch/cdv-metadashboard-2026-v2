'use client';

import { KpiMetrics } from '../lib/types';

interface FunnelChartProps {
  metrics: KpiMetrics;
  allCampaignsSelected: boolean;
}

const STAGES = [
  { key: 'totalImpressions', label: 'Impresiones', color: '#2563EB', isGlobal: false },
  { key: 'totalClicks', label: 'Clics', color: '#8B5CF6', isGlobal: false },
  { key: 'totalLandingViews', label: 'Visitas VSL', color: '#14B8A6', isGlobal: false },
  { key: 'totalLeads', label: 'Leads', color: '#F97316', isGlobal: false },
  { key: 'totalSchedules', label: 'Schedules', color: '#EC4899', isGlobal: false },
  { key: 'totalCheckouts', label: 'Agendas Calif.', color: '#22c55e', isGlobal: false },
  { key: 'totalShows', label: 'Shows', color: '#EAB308', isGlobal: true },
];

function conversionBadgeColor(pct: number | null): string {
  if (pct === null) return '#6b7280';
  if (pct >= 60) return '#22c55e';
  if (pct >= 30) return '#eab308';
  return '#ef4444';
}

export default function FunnelChart({ metrics, allCampaignsSelected }: FunnelChartProps) {
  const values: Record<string, number> = {
    totalImpressions: metrics.totalImpressions,
    totalClicks: metrics.totalClicks,
    totalLandingViews: metrics.totalLandingViews,
    totalLeads: metrics.totalLeads,
    totalSchedules: metrics.totalSchedules,
    totalCheckouts: metrics.totalCheckouts,
    totalShows: metrics.totalShows,
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

          // Shows conversion: only show % if all campaigns selected
          let convPct: number | null = null;
          if (nextValue !== null && value > 0) {
            if (nextStage?.isGlobal && !allCampaignsSelected) {
              convPct = null; // can't compare filtered agendas vs global shows
            } else {
              convPct = (nextValue / value) * 100;
            }
          }

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
                  <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: stage.color }}>
                    {stage.label}
                    {stage.isGlobal && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308', fontSize: 9, fontFamily: 'sans-serif' }}
                        title="Métrica global — no se desglosa por campaña porque el CSV de shows no contiene atribución por UTM."
                      >
                        global
                      </span>
                    )}
                  </span>
                  <span className="ml-auto font-mono text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {value.toLocaleString('en-US')}
                    {stage.isGlobal && !allCampaignsSelected && (
                      <span className="ml-1 text-xs" title="Valor global, no filtrado por campaña">⚠</span>
                    )}
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
