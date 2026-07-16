import { getStats } from './_stats.js';
import { rateLimit } from './_ratelimit.js';
import { listSites, lookupSite, verifySiteKey } from './_sites.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const providedKey = request.headers.get('x-admin-key') || url.searchParams.get('admin_key');
  const siteKey = url.searchParams.get('key');
  const siteId = url.searchParams.get('site_id');

  const rl = await rateLimit(request, env, { scope: 'stats', limit: 30, windowSeconds: 60 });
  if (rl.limited) {
    return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  // Global admin view: list all sites
  if (!siteId) {
    const adminKey = env?.VERIFI_ADMIN_KEY;
    if (!adminKey || providedKey !== adminKey) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const sites = await listSites();
    return new Response(JSON.stringify({ sites }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  // Per-site owner view
  if (siteKey) {
    const ok = await verifySiteKey(siteId, siteKey, env);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
  } else {
    // Fall back to global admin key for single-site stats
    const adminKey = env?.VERIFI_ADMIN_KEY;
    if (!adminKey || providedKey !== adminKey) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
  }

  const stats = await getStats(siteId);
  if (!stats) {
    return new Response(JSON.stringify({ error: 'no data' }), { status: 404, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  const site = await lookupSite(siteId);
  if (site) {
    stats.site = { id: site.id, name: site.name, domain: site.domain, created_at: site.created_at };
  }

  return new Response(JSON.stringify(stats), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
}
