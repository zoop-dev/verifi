import { getStats } from './_stats.js';
import { rateLimit } from './_ratelimit.js';

export async function onRequestGet({ request, env }) {
  const adminKey = env?.VERIFI_ADMIN_KEY;
  if (!adminKey) throw new Error('VERIFI_ADMIN_KEY not set');

  const url = new URL(request.url);
  const providedKey = request.headers.get('x-admin-key') || url.searchParams.get('admin_key');
  if (providedKey !== adminKey) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const rl = await rateLimit(request, env, { scope: 'stats', limit: 30, windowSeconds: 60 });
  if (rl.limited) {
    return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  const siteId = url.searchParams.get('site_id');
  if (!siteId) {
    return new Response(JSON.stringify({ error: 'site_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const stats = await getStats(siteId);
  if (!stats) {
    return new Response(JSON.stringify({ error: 'no data' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(stats), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
