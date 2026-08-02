import { SB_URL } from '../_config.js';
import { lookupSite, getSiteDomains, normalizeDomain, hasValidTld } from '../_sites.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const { site_id, admin_key, action, domain } = await request.json();
    if (!site_id || !admin_key) {
      return new Response(JSON.stringify({ error: 'site_id and admin_key required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (action !== 'add' && action !== 'remove') {
      return new Response(JSON.stringify({ error: 'action must be "add" or "remove"' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const site = await lookupSite(site_id, true, env);
    if (!site || site.admin_key !== admin_key) {
      return new Response(JSON.stringify({ error: 'invalid site_id or admin_key' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const normalized = normalizeDomain(domain);
    if (!normalized || !hasValidTld(normalized)) {
      return new Response(JSON.stringify({ error: 'valid domain with TLD required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const current = getSiteDomains(site);
    let updated;
    if (action === 'add') {
      if (current.includes(normalized)) {
        return new Response(JSON.stringify({ domains: current }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      updated = [...current, normalized];
    } else {
      if (current.length <= 1) {
        return new Response(JSON.stringify({ error: 'cannot remove the only domain' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
      }
      updated = current.filter(d => d !== normalized);
    }

    const key = env?.SUPABASE_SERVICE_KEY;
    if (!key) throw new Error('SUPABASE_SERVICE_KEY not set');

    await fetch(`${SB_URL}/rest/v1/verifi_sites?id=eq.${encodeURIComponent(site_id)}`, {
      method: 'PATCH',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ domains: updated, domain: updated[0] }),
    });

    return new Response(JSON.stringify({ domains: updated }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
