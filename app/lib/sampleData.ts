import { DataRow } from './types';

export const SAMPLE_DATA: DataRow[] = (() => {
  const campaigns = [
    '[349] [CEL] [COLD] [AR] VSL 1 - Intereses',
    '[352] [CEL] [COLD] [AR, URU] VSL 2 - Lookalike',
    '[358] [CEL] [RETARG] [AR] VSL 3 - Retargeting',
    '[361] [CEL] [COLD] [AR] VSL 4 - Broad',
    '[365] [CEL] [COLD] [MX] VSL 5 - México',
  ];

  const rows: DataRow[] = [];
  const today = new Date();

  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const day = date.toISOString().split('T')[0];

    campaigns.forEach((campaignName, i) => {
      const base = 80 + i * 20 + Math.random() * 40;
      const impressions = Math.round(3000 + Math.random() * 2000 + i * 500);
      const clicks = Math.round(impressions * (0.015 + Math.random() * 0.01));
      const lpv = Math.round(clicks * (0.7 + Math.random() * 0.2));
      const leads = Math.round(lpv * (0.08 + Math.random() * 0.06));
      const schedules = Math.round(leads * (0.3 + Math.random() * 0.2));
      const checkouts = Math.round(schedules * (0.2 + Math.random() * 0.2));

      rows.push({
        day,
        campaignName,
        amountSpent: Math.round(base * 100) / 100,
        impressions,
        uniqueLinkClicks: clicks,
        landingPageViews: lpv,
        leads,
        appointmentsScheduled: schedules,
        checkoutsInitiated: checkouts,
      });
    });
  }

  return rows;
})();
