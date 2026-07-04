import { SB_URL, SB_KEY } from '../_config.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function uid() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request }) {
  try {
    const { name, domain } = await request.json();
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: 'name required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const id = uid();
    const res = await fetch(`${SB_URL}/rest/v1/verifi_sites`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id,
        name: name.trim().slice(0, 100),
        domain: (domain || '').trim().slice(0, 200),
        created_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: 'db error', detail: err }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ id, name: name.trim(), domain: (domain || '').trim() }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
