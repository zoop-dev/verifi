import { SB_URL, SB_KEY } from './_config.js';

export async function lookupSite(id, withKey = false, env = null) {
  if (!id) return null;
  try {
    const key = withKey ? env?.SUPABASE_SERVICE_KEY : SB_KEY;
    if (withKey && !key) throw new Error('SUPABASE_SERVICE_KEY not set');
    const select = withKey ? 'id,domain,domains,name,admin_key,created_at' : 'id,domain,domains,name,created_at';
    const r = await fetch(`${SB_URL}/rest/v1/verifi_sites?id=eq.${encodeURIComponent(id)}&select=${select}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const rows = await r.json();
    if (rows && rows.length) return rows[0];
  } catch {}
  return null;
}

export async function verifySiteKey(id, key, env) {
  if (!id || !key) return false;
  const site = await lookupSite(id, true, env);
  return site && site.admin_key === key;
}

export async function listSites() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/verifi_sites?select=id,name,domain,created_at&order=created_at.desc&limit=200`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function getSiteDomains(site) {
  if (site?.domains?.length) return site.domains;
  if (site?.domain) return [site.domain];
  return [];
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

export function originMatchesDomain(origin, domains) {
  if (!origin || !domains) return false;
  const list = Array.isArray(domains) ? domains : [domains];
  if (!list.length) return false;
  try {
    const host = new URL(origin).hostname;
    return list.some(d => host === d || host === `www.${d}` || `www.${host}` === d);
  } catch {
    return false;
  }
}

export function hasValidTld(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  return tld.length > 0 && /^[a-zA-Z]+$/.test(tld);
}
