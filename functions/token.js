import { getIpInfo, lookupIpReputation, recordIpHit } from './_ip.js';
import { verifyPow } from './_pow.js';
import { lookupSite, originMatchesDomain } from './_sites.js';

const TOKEN_TTL = 300;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const SECRET = env?.VERIFI_SECRET;
  if (!SECRET) throw new Error('VERIFI_SECRET not set');
  try {
    const { site_id, pow, probability, confidence } = await request.json();

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
    if (!site || !site.domain) {
      return new Response(JSON.stringify({ error: 'unknown or unregistered site_id' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    const origin = request.headers.get('origin');
    if (!originMatchesDomain(origin, site.domain)) {
      return new Response(JSON.stringify({ error: 'origin does not match registered domain' }), { status: 403, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const ipInfo = await getIpInfo(request, env);
    const ipRep = await lookupIpReputation(ipInfo.ip);
    const serverPenalty = ipInfo.penalty + (ipRep.found && ipRep.score > 70 ? -0.15 : 0);
    const allFlags = [...new Set([...ipInfo.flags, ...(ipRep.flags || [])])];
    const adjustedP = Math.max(0, Math.min(1, (probability || 0) + serverPenalty));
    const passBot = Math.round((1 - adjustedP) * 100);
    const existingScore = (await lookupIpReputation(ipInfo.ip)).score || 50;
    const blendedScore = Math.round(existingScore * 0.7 + passBot * 0.3);
    await recordIpHit(ipInfo.ip, blendedScore, allFlags);

    const now = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ site_id: site_id || '', domain: site.domain, iat: now, exp: now + TOKEN_TTL, p: Math.round(adjustedP * 1000) / 1000, c: Math.round((confidence || 0) * 1000) / 1000, flags: allFlags });
    const payloadB64 = b64url(new TextEncoder().encode(payload));
    const sigB64 = b64url(await hmac(SECRET, payloadB64));
    const token = `vrf1.${payloadB64}.${sigB64}`;

    return new Response(JSON.stringify({ token, expires_in: TOKEN_TTL, server_penalty: serverPenalty, flags: allFlags }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
}
