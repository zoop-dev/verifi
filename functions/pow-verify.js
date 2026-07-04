import { verifyPow } from './_pow.js';
import { rateLimit } from './_ratelimit.js';

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
    const rl = await rateLimit(request, env, { scope: 'pow-verify', limit: 30, windowSeconds: 60 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const { challenge, nonce, difficulty } = await request.json();
    if (!challenge || nonce === undefined || !difficulty) {
      return new Response(JSON.stringify({ error: 'invalid' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (difficulty > 20) {
      return new Response(JSON.stringify({ error: 'difficulty too high' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const ok = await verifyPow(challenge, nonce, difficulty);
    return new Response(JSON.stringify({ ok, challenge, nonce, difficulty }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: 'verify failed' }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
