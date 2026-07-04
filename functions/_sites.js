import { SB_URL, SB_KEY } from './_config.js';

export async function lookupSite(id) {
  if (!id) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/verifi_sites?id=eq.${encodeURIComponent(id)}&select=id,domain,name`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (rows && rows.length) return rows[0];
  } catch {}
  return null;
}

export function normalizeDomain(input) {
  const s = (input || '').trim().toLowerCase();
  if (!s) return '';
  try {
    const withProto = /^https?:\/\//.test(s) ? s : `https://${s}`;
    return new URL(withProto).hostname;
  } catch {
    return '';
  }
}

export function originMatchesDomain(origin, domain) {
  if (!origin || !domain) return false;
  try {
    const host = new URL(origin).hostname;
    return host === domain || host === `www.${domain}` || `www.${host}` === domain;
  } catch {
    return false;
  }
}
