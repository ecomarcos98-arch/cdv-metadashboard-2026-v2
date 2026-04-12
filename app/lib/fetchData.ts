import Papa from 'papaparse';
import { DataRow } from './types';
import { SAMPLE_DATA } from './sampleData';

function parseAmount(value: string | undefined): number {
  if (!value || value === '') return 0;
  const cleaned = value.replace(/"/g, '').trim().replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

function parseInteger(value: string | undefined): number {
  if (!value || value === '') return 0;
  const cleaned = value.replace(/"/g, '').replace(/,/g, '').trim();
  return Number(cleaned) || 0;
}

export async function fetchData(): Promise<{ data: DataRow[]; isExample: boolean }> {
  const csvUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL_cdv;

  if (!csvUrl) {
    return { data: SAMPLE_DATA, isExample: true };
  }

  try {
    const res = await fetch(csvUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        quoteChar: '"',
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rows: DataRow[] = (results.data as Record<string, string>[])
              .filter((row) => row['Day'] && row['Campaign Name'])
              .map((row) => ({
                day: row['Day']?.trim() ?? '',
                campaignName: row['Campaign Name']?.trim() ?? '',
                amountSpent: parseAmount(row['Amount Spent']),
                impressions: parseInteger(row['Impressions']),
                uniqueLinkClicks: parseInteger(row['Unique Link Clicks']),
                landingPageViews: parseInteger(row['Landing Page Views']),
                leads: parseInteger(row['Leads']),
                appointmentsScheduled: parseInteger(row['Appointments Scheduled']),
                checkoutsInitiated: parseInteger(row['Checkouts Initiated']),
              }));
            resolve({ data: rows, isExample: false });
          } catch (e) {
            reject(e);
          }
        },
        error: reject,
      });
    });
  } catch {
    return { data: SAMPLE_DATA, isExample: true };
  }
}
