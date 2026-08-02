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
    const newPassCount = (existing?.pass_count || 0) + (pass ? 1 : 0);
    const newFailCount = (existing?.fail_count || 0) + (fail ? 1 : 0);
    const resolvedFlags = flags !== null ? flags : (existing?.flags || []);
    const isTrusted = newPassCount >= 15 && !resolvedFlags.includes('failed_challenge') && !resolvedFlags.includes('banned');
    const finalFlags = isTrusted && !resolvedFlags.includes('trusted')
      ? [...resolvedFlags, 'trusted']
      : resolvedFlags.filter(f => f !== 'trusted' || isTrusted);
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
        pass_count: newPassCount,
        fail_count: newFailCount,
        flags: finalFlags,
      }),
    });
  } catch {}
}

export function fingerprintPenalty(fp) {
  if (!fp) return 0;
  const flags = fp.flags || [];
  if (flags.includes('banned')) return -1;
  let p = 0;
  if (flags.includes('trusted')) p += 0.15;
  if (flags.includes('failed_challenge')) p -= 0.15;
  if (flags.includes('headless')) p -= 0.35;
  if (fp.fail_count > 5 && fp.pass_count === 0) p -= 0.1;
  if (fp.pass_count > 10) p += 0.05;
  return p;
}

export function isBanned(fp) {
  return fp?.flags?.includes('banned') ?? false;
}
