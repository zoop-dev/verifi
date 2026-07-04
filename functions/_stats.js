import { SB_URL, SB_KEY } from './_config.js';

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function bumpStat(siteId, column) {
  if (!siteId) return;
  try {
    const day = today();
    const r = await fetch(`${SB_URL}/rest/v1/verifi_stats?site_id=eq.${encodeURIComponent(siteId)}&day=eq.${day}&select=${column}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    const current = rows && rows[0] ? rows[0][column] || 0 : 0;

    await fetch(`${SB_URL}/rest/v1/verifi_stats`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ site_id: siteId, day, [column]: current + 1 }),
    });
  } catch {}
}

export function bumpPass(siteId) { return bumpStat(siteId, 'passes'); }
export function bumpFail(siteId) { return bumpStat(siteId, 'fails'); }

export async function getStats(siteId) {
  if (!siteId) return null;
  try {
    // fetch every day-row for this site (daily granularity, so this comfortably covers years of history)
    // to compute a true all-time total, not just whatever window we choose to display
    const r = await fetch(`${SB_URL}/rest/v1/verifi_stats?site_id=eq.${encodeURIComponent(siteId)}&select=day,passes,fails&order=day.desc&limit=3650`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (!Array.isArray(rows)) return null;
    const totals = rows.reduce((acc, row) => {
      acc.passes += row.passes || 0;
      acc.fails += row.fails || 0;
      return acc;
    }, { passes: 0, fails: 0 });
    return { site_id: siteId, totals, days: rows.slice(0, 30) };
  } catch {
    return null;
  }
}
