import { lookupFingerprint, fingerprintPenalty } from '../_fingerprint.js';
import { rateLimit } from '../_ratelimit.js';

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
    const rl = await rateLimit(request, env, { scope: 'fp-check', limit: 15, windowSeconds: 60 });
    if (rl.limited) {
      return new Response(JSON.stringify({ flags: [], penalty: 0 }), {
        status: 429, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => ({}));
    const { fingerprint_id } = body;
    if (!fingerprint_id) {
      return new Response(JSON.stringify({ flags: [], penalty: 0 }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const fp = await lookupFingerprint(fingerprint_id, env);
    if (!fp) {
      return new Response(JSON.stringify({ flags: [], penalty: 0, new: true }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const flags = fp.flags || [];
    const penalty = fingerprintPenalty(fp);
    const fast_challenge = fp.fail_count > 3 && fp.pass_count === 0;

    return new Response(JSON.stringify({ flags, penalty, fast_challenge }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ flags: [], penalty: 0 }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
