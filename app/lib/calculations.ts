import { DataRow, KpiMetrics, CampaignTotals, DailyMetrics } from './types';

function safeDiv(a: number, b: number): number | null {
  if (b === 0 || isNaN(b) || !isFinite(b)) return null;
  const result = a / b;
  if (!isFinite(result) || isNaN(result)) return null;
  return result;
}

export function calcKpiMetrics(rows: DataRow[]): KpiMetrics {
  const totalSpent = rows.reduce((s, r) => s + r.amountSpent, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.uniqueLinkClicks, 0);
  const totalLandingViews = rows.reduce((s, r) => s + r.landingPageViews, 0);
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0);
  const totalSchedules = rows.reduce((s, r) => s + r.appointmentsScheduled, 0);
  const totalCheckouts = rows.reduce((s, r) => s + r.checkoutsInitiated, 0);

  return {
    cpm: safeDiv(totalSpent, totalImpressions) !== null ? (totalSpent / totalImpressions) * 1000 : null,
    cpc: safeDiv(totalSpent, totalClicks),
    costPerLead: safeDiv(totalSpent, totalLeads),
    costPerSchedule: safeDiv(totalSpent, totalSchedules),
    costPerCheckout: safeDiv(totalSpent, totalCheckouts),
    ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
    loadRate: totalClicks > 0 ? (totalLandingViews / totalClicks) * 100 : null,
    vslToLead: totalLandingViews > 0 ? (totalLeads / totalLandingViews) * 100 : null,
    leadToSchedule: totalLeads > 0 ? (totalSchedules / totalLeads) * 100 : null,
    scheduleToCheckout: totalSchedules > 0 ? (totalCheckouts / totalSchedules) * 100 : null,
    totalSpent,
    totalLeads,
    totalSchedules,
    totalCheckouts,
    totalImpressions,
    totalClicks,
    totalLandingViews,
  };
}

export function calcCampaignTotals(rows: DataRow[]): CampaignTotals[] {
  const map = new Map<string, DataRow[]>();
  rows.forEach((r) => {
    const arr = map.get(r.campaignName) || [];
    arr.push(r);
    map.set(r.campaignName, arr);
  });

  return Array.from(map.entries()).map(([campaignName, campRows]) => {
    const spent = campRows.reduce((s, r) => s + r.amountSpent, 0);
    const imp = campRows.reduce((s, r) => s + r.impressions, 0);
    const clicks = campRows.reduce((s, r) => s + r.uniqueLinkClicks, 0);
    const lpv = campRows.reduce((s, r) => s + r.landingPageViews, 0);
    const leads = campRows.reduce((s, r) => s + r.leads, 0);
    const sched = campRows.reduce((s, r) => s + r.appointmentsScheduled, 0);
    const checkout = campRows.reduce((s, r) => s + r.checkoutsInitiated, 0);

    return {
      campaignName,
      amountSpent: spent,
      impressions: imp,
      uniqueLinkClicks: clicks,
      landingPageViews: lpv,
      leads,
      appointmentsScheduled: sched,
      checkoutsInitiated: checkout,
      cpm: imp > 0 ? (spent / imp) * 1000 : null,
      cpc: safeDiv(spent, clicks),
      costPerLead: safeDiv(spent, leads),
      costPerSchedule: safeDiv(spent, sched),
      costPerCheckout: safeDiv(spent, checkout),
      ctr: imp > 0 ? (clicks / imp) * 100 : null,
      loadRate: clicks > 0 ? (lpv / clicks) * 100 : null,
      vslToLead: lpv > 0 ? (leads / lpv) * 100 : null,
      leadToSchedule: leads > 0 ? (sched / leads) * 100 : null,
      scheduleToCheckout: sched > 0 ? (checkout / sched) * 100 : null,
    };
  });
}

export function calcDailyMetrics(rows: DataRow[]): DailyMetrics[] {
  const map = new Map<string, DataRow[]>();
  rows.forEach((r) => {
    const arr = map.get(r.day) || [];
    arr.push(r);
    map.set(r.day, arr);
  });

  const days = Array.from(map.keys()).sort();

  return days.map((day) => {
    const dayRows = map.get(day)!;
    const spent = dayRows.reduce((s, r) => s + r.amountSpent, 0);
    const imp = dayRows.reduce((s, r) => s + r.impressions, 0);
    const clicks = dayRows.reduce((s, r) => s + r.uniqueLinkClicks, 0);
    const lpv = dayRows.reduce((s, r) => s + r.landingPageViews, 0);
    const leads = dayRows.reduce((s, r) => s + r.leads, 0);
    const sched = dayRows.reduce((s, r) => s + r.appointmentsScheduled, 0);
    const checkout = dayRows.reduce((s, r) => s + r.checkoutsInitiated, 0);

    return {
      day,
      costPerLead: safeDiv(spent, leads),
      costPerSchedule: safeDiv(spent, sched),
      costPerCheckout: safeDiv(spent, checkout),
      loadRate: clicks > 0 ? (lpv / clicks) * 100 : null,
      vslToLead: lpv > 0 ? (leads / lpv) * 100 : null,
      leadToSchedule: leads > 0 ? (sched / leads) * 100 : null,
      scheduleToCheckout: sched > 0 ? (checkout / sched) * 100 : null,
      amountSpent: spent,
      leads,
      appointmentsScheduled: sched,
      checkoutsInitiated: checkout,
      cpc: safeDiv(spent, clicks),
      cpm: imp > 0 ? (spent / imp) * 1000 : null,
      ctr: imp > 0 ? (clicks / imp) * 100 : null,
    };
  });
}

export function calcDailyMetricsByCampaign(
  rows: DataRow[],
  metricKey: string
): { day: string; [campaign: string]: number | null | string }[] {
  const allDays = [...new Set(rows.map((r) => r.day))].sort();
  const allCampaigns = [...new Set(rows.map((r) => r.campaignName))];

  return allDays.map((day) => {
    const result: { day: string; [key: string]: number | null | string } = { day };
    allCampaigns.forEach((camp) => {
      const campRows = rows.filter((r) => r.day === day && r.campaignName === camp);
      if (campRows.length === 0) {
        result[camp] = null;
        return;
      }
      const spent = campRows.reduce((s, r) => s + r.amountSpent, 0);
      const imp = campRows.reduce((s, r) => s + r.impressions, 0);
      const clicks = campRows.reduce((s, r) => s + r.uniqueLinkClicks, 0);
      const lpv = campRows.reduce((s, r) => s + r.landingPageViews, 0);
      const leads = campRows.reduce((s, r) => s + r.leads, 0);
      const sched = campRows.reduce((s, r) => s + r.appointmentsScheduled, 0);
      const checkout = campRows.reduce((s, r) => s + r.checkoutsInitiated, 0);

      switch (metricKey) {
        case 'costPerLead': result[camp] = safeDiv(spent, leads); break;
        case 'costPerSchedule': result[camp] = safeDiv(spent, sched); break;
        case 'costPerCheckout': result[camp] = safeDiv(spent, checkout); break;
        case 'ctr': result[camp] = imp > 0 ? (clicks / imp) * 100 : null; break;
        case 'vslToLead': result[camp] = lpv > 0 ? (leads / lpv) * 100 : null; break;
        case 'leadToSchedule': result[camp] = leads > 0 ? (sched / leads) * 100 : null; break;
        case 'scheduleToCheckout': result[camp] = sched > 0 ? (checkout / sched) * 100 : null; break;
        default: result[camp] = null;
      }
    });
    return result;
  });
}

export function filterByDateRange(rows: DataRow[], start: string, end: string): DataRow[] {
  return rows.filter((r) => r.day >= start && r.day <= end);
}

export function getDateRange(preset: string, customRange?: { start: string; end: string }): { start: string; end: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (preset === 'custom' && customRange) {
    return customRange;
  }

  const days = preset === '7d' ? 7 : preset === '14d' ? 14 : 30;
  const end = new Date(today);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function getPreviousDateRange(current: { start: string; end: string }): { start: string; end: string } {
  const startDate = new Date(current.start);
  const endDate = new Date(current.end);
  const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (days - 1));

  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  };
}

export function formatMetricValue(value: number | null, type: 'cost' | 'percent' | 'volume' | 'cpm'): string {
  if (value === null || value === undefined) return '—';
  if (!isFinite(value) || isNaN(value)) return '—';

  if (type === 'cost') return `$${value.toFixed(2)}`;
  if (type === 'cpm') return `$${value.toFixed(2)}`;
  if (type === 'percent') return `${value.toFixed(1)}%`;
  if (type === 'volume') return value.toLocaleString('en-US');
  return value.toFixed(2);
}

export function calcPercentChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) return null;
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function shortCampaignName(name: string): string {
  const match = name.match(/\[(\d{3,})\]/);
  if (match) return `[${match[1]}]`;
  const words = name.split(' ');
  return words.slice(0, 2).join(' ');
}
