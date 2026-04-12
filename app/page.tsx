'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchData } from './lib/fetchData';
import {
  calcKpiMetrics,
  calcCampaignTotals,
  calcDailyMetrics,
  filterByDateRange,
  getDateRange,
  getPreviousDateRange,
} from './lib/calculations';
import { DataRow } from './lib/types';
import DateFilter from './components/DateFilter';
import CampaignFilter from './components/CampaignFilter';
import KpiCards from './components/KpiCards';
import FunnelChart from './components/FunnelChart';
import TrendCharts from './components/TrendCharts';
import CampaignChart from './components/CampaignChart';
import CampaignTable from './components/CampaignTable';
import { format } from 'date-fns';

export default function Dashboard() {
  const [allData, setAllData] = useState<DataRow[]>([]);
  const [isExample, setIsExample] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [preset, setPreset] = useState('7d');
  const [customRange, setCustomRange] = useState<{ start: string; end: string } | undefined>();
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchData();
    setAllData(result.data);
    setIsExample(result.isExample);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allCampaigns = [...new Set(allData.map((r) => r.campaignName))].sort();

  useEffect(() => {
    setSelectedCampaigns(allCampaigns);
  }, [allData.length]);

  const dateRange = getDateRange(preset, customRange);
  const previousRange = getPreviousDateRange(dateRange);

  const filteredRows = filterByDateRange(allData, dateRange.start, dateRange.end).filter((r) =>
    selectedCampaigns.includes(r.campaignName)
  );

  const prevRows = filterByDateRange(allData, previousRange.start, previousRange.end).filter((r) =>
    selectedCampaigns.includes(r.campaignName)
  );

  const currentMetrics = calcKpiMetrics(filteredRows);
  const prevMetrics = calcKpiMetrics(prevRows);
  const campaignTotals = calcCampaignTotals(filteredRows);
  const dailyMetrics = calcDailyMetrics(filteredRows);

  const handlePresetChange = (p: string, custom?: { start: string; end: string }) => {
    setPreset(p);
    if (custom) setCustomRange(custom);
  };

  const hasData = filteredRows.length > 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 px-6 py-3"
        style={{
          background: 'rgba(10, 11, 15, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider"
              style={{ background: '#1e293b', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}
            >
              CDV
            </div>
            <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Meta Ads Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {isExample && (
              <span
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{
                  background: 'rgba(234,179,8,0.1)',
                  color: '#eab308',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}
              >
                ⚠ Usando datos de ejemplo — configurá NEXT_PUBLIC_SHEET_CSV_URL_cdv en Vercel
              </span>
            )}

            {lastUpdated && (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Actualizado: {format(lastUpdated, 'HH:mm:ss')}
              </span>
            )}

            <button
              className="btn"
              onClick={load}
              disabled={loading}
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <svg
                  className="animate-spin"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
              )}
              Actualizar
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4 mt-3 flex-wrap">
          <DateFilter
            preset={preset}
            dateRange={dateRange}
            previousRange={previousRange}
            onPresetChange={handlePresetChange}
          />
          <CampaignFilter
            campaigns={allCampaigns}
            selected={selectedCampaigns}
            onChange={setSelectedCampaigns}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {loading && allData.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <svg
                className="animate-spin mx-auto mb-3"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              <p style={{ color: 'var(--color-text-muted)' }}>Cargando datos...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="flex items-center justify-center py-32">
            <p style={{ color: 'var(--color-text-muted)' }}>
              No hay datos para el período y campañas seleccionadas.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* KPI Cards */}
            <KpiCards current={currentMetrics} previous={prevMetrics} />

            {/* Funnel */}
            <FunnelChart metrics={currentMetrics} />

            {/* Trend Charts */}
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Tendencias
              </h2>
              <TrendCharts dailyData={dailyMetrics} />
            </section>

            {/* Campaign Chart */}
            <CampaignChart rows={filteredRows} />

            {/* Campaign Table */}
            <CampaignTable campaigns={campaignTotals} />
          </div>
        )}
      </main>
    </div>
  );
}
