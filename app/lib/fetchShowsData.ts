import Papa from 'papaparse';
import { ShowsByDay } from './types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export async function fetchShowsData(): Promise<{ showsByDay: ShowsByDay; isExample: boolean; unavailable: boolean }> {
  const csvUrl = process.env.NEXT_PUBLIC_SHEET_CSV_URL_cdv_shows;

  if (!csvUrl) {
    return { showsByDay: generateSampleShows(), isExample: true, unavailable: true };
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
            const showsByDay: ShowsByDay = {};
            (results.data as Record<string, string>[]).forEach((row) => {
              const estado = (row['Estado'] || '').trim().toLowerCase();
              if (estado !== 'showed') return;
              const day = row['Fecha limpia']?.trim();
              if (!day || !DATE_REGEX.test(day)) return;
              showsByDay[day] = (showsByDay[day] || 0) + 1;
            });
            resolve({ showsByDay, isExample: false, unavailable: false });
          } catch (e) {
            reject(e);
          }
        },
        error: reject,
      });
    });
  } catch (err) {
    console.error('[fetchShowsData] Error fetching shows CSV:', err);
    return { showsByDay: generateSampleShows(), isExample: true, unavailable: false };
  }
}

function generateSampleShows(): ShowsByDay {
  const shows: ShowsByDay = {};
  const today = new Date();
  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const day = date.toISOString().split('T')[0];
    // ~35% of schedules show up (rough sample)
    shows[day] = Math.floor(Math.random() * 4) + 1;
  }
  return shows;
}

export function filterShowsByDateRange(showsByDay: ShowsByDay, start: string, end: string): ShowsByDay {
  const filtered: ShowsByDay = {};
  Object.entries(showsByDay).forEach(([day, count]) => {
    if (day >= start && day <= end) filtered[day] = count;
  });
  return filtered;
}

export function totalShows(showsByDay: ShowsByDay): number {
  return Object.values(showsByDay).reduce((s, n) => s + n, 0);
}
