import { SB_URL } from './_config.js';

export async function lookupFingerprint(id, env) {
  if (!id) return null;
  const key = env?.SUPABASE_SERVICE_KEY;
  if (!key) return null;
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/verifi_fingerprints?id=eq.${encodeURIComponent(id)}&select=pass_count,fail_count,flags,first_seen`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await r.json();
    if (rows && rows.length) return rows[0];
  } catch {}
  return null;
}

export async function recordFingerprint(id, { pass = false, fail = false, flags = null } = {}, env) {
  if (!id) return;
  const key = env?.SUPABASE_SERVICE_KEY;
  if (!key) return;
  try {
    const existing = await lookupFingerprint(id, env);
    const now = new Date().toISOString();
    await fetch(`${SB_URL}/rest/v1/verifi_fingerprints`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id,
        first_seen: existing?.first_seen || now,
        last_seen: now,
        pass_count: (existing?.pass_count || 0) + (pass ? 1 : 0),
        fail_count: (existing?.fail_count || 0) + (fail ? 1 : 0),
        flags: flags !== null ? flags : (existing?.flags || []),
      }),
    });
  } catch {}
}

export function fingerprintPenalty(fp) {
  if (!fp) return 0;
  let p = 0;
  if ((fp.flags || []).includes('failed_challenge')) p -= 0.15;
  if (fp.fail_count > 5 && fp.pass_count === 0) p -= 0.1;
  if (fp.pass_count > 10) p += 0.05;
  return p;
}
