const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const CHALLENGES = [
  { id: 'g001', q: 'Select all images containing a bicycle', img: '/challenges/g001.webp', ans: [0, 2, 6] },
  { id: 'g002', q: 'Select all images containing a traffic light', img: '/challenges/g002.webp', ans: [1, 3, 8] },
  { id: 'g003', q: 'Select all images containing a fire hydrant', img: '/challenges/g003.webp', ans: [0, 4, 7] },
  { id: 'g004', q: 'Select all images containing a crosswalk', img: '/challenges/g004.webp', ans: [2, 5, 6] },
  { id: 'g005', q: 'Select all images containing a bus', img: '/challenges/g005.webp', ans: [1, 4, 6, 8] },
];

async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const secret = env.CHALLENGE_SECRET || 'dev-secret';
  const exp = Date.now() + 300_000;
  const payload = JSON.stringify({ id: c.id, ans: c.ans, exp });
  const sig = await sign(payload, secret);
  const token = btoa(payload) + '.' + sig;
  const origin = new URL(request.url).origin;

  return new Response(")]}'\n" + JSON.stringify([c.q, origin + c.img, token]), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'text/plain' },
  });
}
