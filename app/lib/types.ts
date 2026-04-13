export interface DataRow {
  day: string;
  campaignName: string;
  amountSpent: number;
  impressions: number;
  uniqueLinkClicks: number;
  landingPageViews: number;
  leads: number;
  appointmentsScheduled: number;
  checkoutsInitiated: number;
}

export interface KpiMetrics {
  cpm: number | null;
  cpc: number | null;
  costPerLead: number | null;
  costPerSchedule: number | null;
  costPerCheckout: number | null;
  costPerShow: number | null;
  ctr: number | null;
  loadRate: number | null;
  vslToLead: number | null;
  leadToSchedule: number | null;
  scheduleToCheckout: number | null;
  showRate: number | null;
  totalSpent: number;
  totalLeads: number;
  totalSchedules: number;
  totalCheckouts: number;
  totalShows: number;
  totalImpressions: number;
  totalClicks: number;
  totalLandingViews: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface CampaignTotals {
  campaignName: string;
  amountSpent: number;
  impressions: number;
  uniqueLinkClicks: number;
  landingPageViews: number;
  leads: number;
  appointmentsScheduled: number;
  checkoutsInitiated: number;
  cpm: number | null;
  cpc: number | null;
  costPerLead: number | null;
  costPerSchedule: number | null;
  costPerCheckout: number | null;
  ctr: number | null;
  loadRate: number | null;
  vslToLead: number | null;
  leadToSchedule: number | null;
  scheduleToCheckout: number | null;
}

export interface DailyMetrics {
  day: string;
  costPerLead: number | null;
  costPerSchedule: number | null;
  costPerCheckout: number | null;
  costPerShow: number | null;
  loadRate: number | null;
  vslToLead: number | null;
  leadToSchedule: number | null;
  scheduleToCheckout: number | null;
  showRate: number | null;
  amountSpent: number;
  leads: number;
  appointmentsScheduled: number;
  checkoutsInitiated: number;
  shows: number;
  cpc: number | null;
  cpm: number | null;
  ctr: number | null;
}

export interface ShowRow {
  day: string;
}

export interface ShowsByDay {
  [day: string]: number;
}
