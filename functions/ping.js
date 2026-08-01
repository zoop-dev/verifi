import { isDatacenter } from './_ip.js';
import { lookupFingerprint, recordFingerprint } from './_fingerprint.js';
import { bumpFail } from './_stats.js';

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
    const body = await request.json().catch(() => ({}));
    const dc = isDatacenter(request);
    const flags = dc ? ['datacenter'] : [];
    const penalty = dc ? -0.25 : 0;

    if (body.blocked && body.fingerprint_id) {
      const fp = await lookupFingerprint(body.fingerprint_id, env);
      const existing = fp?.flags || [];
      const newFlags = existing.includes('failed_challenge') ? existing : [...existing, 'failed_challenge'];
      await recordFingerprint(body.fingerprint_id, { fail: true, flags: newFlags }, env);
    }

    if (body.blocked && body.site_id) {
      await bumpFail(body.site_id);
    }

    return new Response(JSON.stringify({ flags, penalty, dc }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ flags: [], penalty: 0, dc: false, error: e.message }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
