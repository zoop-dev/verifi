import { isDatacenter, isVpn } from './_ip.js';
import { lookupFingerprint, recordFingerprint, fingerprintPenalty, isBanned } from './_fingerprint.js';
import { verifyPow } from './_pow.js';
import { lookupSite, originMatchesDomain, getSiteDomains } from './_sites.js';
import { rateLimit, rateLimitByFingerprint } from './_ratelimit.js';
import { bumpPass } from './_stats.js';

const TOKEN_TTL = 300;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const SECRET = env?.VERIFI_SECRET;
  if (!SECRET) throw new Error('VERIFI_SECRET not set');
  try {
    const rl = await rateLimit(request, env, { scope: 'token', limit: 20, windowSeconds: 60 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const { site_id, pow, probability, confidence, fingerprint_id } = await request.json();

    const rlFp = await rateLimitByFingerprint(fingerprint_id, env, { scope: 'token', limit: 15, windowSeconds: 300 });
    if (rlFp.limited) {
      return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    if (!pow?.challenge || pow.nonce === undefined || !pow.difficulty) {
      return new Response(JSON.stringify({ error: 'pow required' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    if (pow.difficulty > 20) {
      return new Response(JSON.stringify({ error: 'invalid difficulty' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const powOk = await verifyPow(pow.challenge, pow.nonce, pow.difficulty);
    if (!powOk) {
      return new Response(JSON.stringify({ error: 'pow invalid' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const site = await lookupSite(site_id);
    const siteDomains = getSiteDomains(site);
    if (!site || !siteDomains.length) {
      return new Response(JSON.stringify({ error: 'unknown or unregistered site_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const origin = request.headers.get('origin');
    if (!originMatchesDomain(origin, siteDomains)) {
      return new Response(JSON.stringify({ error: 'origin does not match registered domain' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const dc = isDatacenter(request);
    const vpn = isVpn(request);
    const fp = await lookupFingerprint(fingerprint_id, env);

    if (isBanned(fp)) {
      return new Response(JSON.stringify({ error: 'banned' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    let serverPenalty = (dc ? -0.25 : 0) + (vpn ? -0.10 : 0);
    serverPenalty += fingerprintPenalty(fp);

    const adjustedP = Math.max(0, Math.min(1, (probability || 0) + serverPenalty));

    const rawFlags = [...(dc ? ['datacenter'] : []), ...(vpn ? ['vpn'] : []), ...(fp?.flags || [])];
    const redeemed = adjustedP >= 0.6;
    const allFlags = redeemed ? rawFlags.filter(f => f !== 'failed_challenge') : rawFlags;

    if (fingerprint_id) {
      await recordFingerprint(fingerprint_id, {
        pass: true,
        flags: allFlags,
      }, env);
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      site_id: site_id || '',
      domain: siteDomains[0],
      iat: now,
      exp: now + TOKEN_TTL,
      p: Math.round(adjustedP * 1000) / 1000,
      c: Math.round((confidence || 0) * 1000) / 1000,
      flags: allFlags,
      fp: fingerprint_id || null,
    });
    const payloadB64 = b64url(new TextEncoder().encode(payload));
    const sigB64 = b64url(await hmac(SECRET, payloadB64));
    const token = `vrf1.${payloadB64}.${sigB64}`;

    await bumpPass(site_id);

    return new Response(JSON.stringify({ token, expires_in: TOKEN_TTL, server_penalty: serverPenalty, flags: allFlags }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
