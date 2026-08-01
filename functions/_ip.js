export const DC_ASNS = new Set([
  16509, 15169, 8075, 14061, 63949, 20473, 396982,
  24940, 16276, 51167, 60781, 36352, 7922, 40676, 174, 3356,
]);

export async function hashIp(ip, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export function isDatacenter(request) {
  const asn = request.cf?.asn ? Number(request.cf.asn) : 0;
  return DC_ASNS.has(asn);
}
