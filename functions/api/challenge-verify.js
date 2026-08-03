const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function verify(payload, sig, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBytes = new Uint8Array(sig.match(/.{2}/g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { token, selected } = body;

  if (!token || !Array.isArray(selected)) {
    return new Response(")]}'\n[0]", { status: 200, headers: { ...CORS, 'Content-Type': 'text/plain' } });
  }

  try {
    const [payloadB64, sig] = token.split('.');
    const payload = atob(payloadB64);
    const secret = env.CHALLENGE_SECRET || 'dev-secret';
    const ok = await verify(payload, sig, secret);
    if (!ok) return new Response(")]}'\n[0]", { status: 200, headers: { ...CORS, 'Content-Type': 'text/plain' } });

    const data = JSON.parse(payload);
    if (Date.now() > data.exp) {
      return new Response(")]}'\n[2]", { status: 200, headers: { ...CORS, 'Content-Type': 'text/plain' } }); // expired
    }

    const ans = data.ans.slice().sort((a, b) => a - b);
    const sel = selected.slice().sort((a, b) => a - b);
    const pass = ans.length === sel.length && ans.every((v, i) => v === sel[i]);

    return new Response(")]}'\n[" + (pass ? '1' : '0') + "]", {
      status: 200, headers: { ...CORS, 'Content-Type': 'text/plain' },
    });
  } catch {
    return new Response(")]}'\n[0]", { status: 200, headers: { ...CORS, 'Content-Type': 'text/plain' } });
  }
}
