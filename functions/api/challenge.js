import { CHALLENGES, sign } from '../_challenges.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const secret = env.CHALLENGE_SECRET || 'dev-secret';
  const exp = Date.now() + 300_000;
  const payload = JSON.stringify({ id: c.id, exp });
  const sig = await sign(payload, secret);
  const token = btoa(payload) + '.' + sig;
  const origin = new URL(request.url).origin;

  return new Response(")]}'\n" + JSON.stringify([c.q, origin + c.img, token]), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' },
  });
}
