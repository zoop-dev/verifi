import { SB_URL, SB_KEY } from './_config.js';

export const DC_ASNS = new Set([
  16509,
  15169,
  8075,
  14061,
  63949,
  20473,
  396982,
  24940,
  16276,
  51167,
  60781,
  36352,
  7922,
  40676,
  174,
  3356,
]);

export async function hashIp(ip, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 32);
}

export async function getIpInfo(request, env) {
  const cf = request.cf || {};
  const rawIp = request.headers.get('cf-connecting-ip') ||
                request.headers.get('x-real-ip') ||
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const secret = env?.VERIFI_IP_SECRET;
  if (!secret) throw new Error('VERIFI_IP_SECRET not set');
  const ip = rawIp ? await hashIp(rawIp, secret) : '';
  const asn = cf.asn ? Number(cf.asn) : 0;
  const threatScore = cf.threatScore ? Number(cf.threatScore) : 0;
  const isDatacenter = DC_ASNS.has(asn);
  const country = cf.country || '';
  const org = cf.asOrganization || '';

  let penalty = 0;
  const flags = [];

  if (isDatacenter) { penalty -= 0.25; flags.push('datacenter'); }
  if (threatScore > 50) { penalty -= 0.20; flags.push('cf_threat'); }
  if (threatScore > 80) { penalty -= 0.15; flags.push('cf_threat_high'); }

  return { ip, asn, threatScore, isDatacenter, country, org, flags, penalty };
}

export async function lookupIpReputation(ip) {
  if (!ip) return { score: 50, flags: [], found: false };
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/verifi_ips?ip=eq.${encodeURIComponent(ip)}&select=score,flags,hits`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const rows = await r.json();
    if (rows && rows.length) return { ...rows[0], found: true };
  } catch {}
  return { score: 50, flags: [], found: false };
}

export async function recordIpHit(ip, score, flags) {
  if (!ip) return;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/verifi_ips`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        ip,
        score: Math.round(score),
        hits: 1,
        flags,
        last_seen: new Date().toISOString(),
      }),
    });
    return res.status;
  } catch {}
}
