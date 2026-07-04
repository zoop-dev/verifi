const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((str.length + 3) % 4 || 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function verifyHmac(secret, data, sig) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  return crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(data));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const SECRET = env?.VERIFI_SECRET;
  if (!SECRET) throw new Error('VERIFI_SECRET not set');

  try {
    const { token } = await request.json();
    if (!token || !token.startsWith('vrf1.')) {
      return new Response(JSON.stringify({ valid: false, error: 'invalid token format' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ valid: false, error: 'malformed token' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const [_prefix, payloadB64, sigB64] = parts;
    const sigBytes = b64urlDecode(sigB64);
    const ok = await verifyHmac(SECRET, payloadB64, sigBytes);

    if (!ok) {
      return new Response(JSON.stringify({ valid: false, error: 'signature invalid' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp < now) {
      return new Response(JSON.stringify({ valid: false, error: 'token expired', expired_at: payload.exp }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      site_id: payload.site_id,
      domain: payload.domain,
      probability: payload.p,
      confidence: payload.c,
      issued_at: payload.iat,
      expires_at: payload.exp,
    }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ valid: false, error: e.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
