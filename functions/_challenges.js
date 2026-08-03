export const CHALLENGES = [
  { id: 'g001', q: 'Select all images containing a bicycle', img: '/challenges/g001.webp', ans: [0, 2, 6] },
  { id: 'g002', q: 'Select all images containing a traffic light', img: '/challenges/g002.webp', ans: [1, 3, 8] },
  { id: 'g003', q: 'Select all images containing a fire hydrant', img: '/challenges/g003.webp', ans: [0, 4, 7] },
  { id: 'g004', q: 'Select all images containing a crosswalk', img: '/challenges/g004.webp', ans: [2, 5, 6] },
  { id: 'g005', q: 'Select all images containing a bus', img: '/challenges/g005.webp', ans: [1, 4, 6, 8] },
];

export function byId(id) {
  return CHALLENGES.find(c => c.id === id) || null;
}

export async function sign(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySig(payload, sig, secret) {
  if (!/^[0-9a-f]+$/i.test(sig || '') || sig.length % 2 !== 0) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const sigBytes = new Uint8Array(sig.match(/.{2}/g).map(h => parseInt(h, 16)));
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
}
