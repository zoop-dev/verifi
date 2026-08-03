import { byId, verifySig } from '../_challenges.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function resp(code) {
  return new Response(")]}'\n[" + code + "]", {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { token, selected } = body;

  if (typeof token !== 'string' || !Array.isArray(selected)) return resp(0);

  try {
    const [payloadB64, sig] = token.split('.');
    if (!payloadB64 || !sig) return resp(0);

    const payload = atob(payloadB64);
    const secret = env.CHALLENGE_SECRET || 'dev-secret';
    if (!await verifySig(payload, sig, secret)) return resp(0);

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) return resp(2); // expired

    const c = byId(data.id);
    if (!c) return resp(0);

    // answer lives server-side only; the token never carries it
    const ans = c.ans.slice().sort((a, b) => a - b);
    const sel = [...new Set(selected)].sort((a, b) => a - b);
    const pass = ans.length === sel.length && ans.every((v, i) => v === sel[i]);

    return resp(pass ? 1 : 0);
  } catch {
    return resp(0);
  }
}
