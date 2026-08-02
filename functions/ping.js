import { isDatacenter, isVpn } from './_ip.js';
import { lookupFingerprint, recordFingerprint, fingerprintPenalty, isBanned } from './_fingerprint.js';
import { rateLimitByFingerprint } from './_ratelimit.js';
import { bumpFail } from './_stats.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const dc = isDatacenter(request);
    const vpn = isVpn(request);
    let penalty = (dc ? -0.25 : 0) + (vpn ? -0.10 : 0);
    const flags = [...(dc ? ['datacenter'] : []), ...(vpn ? ['vpn'] : [])];
    let fast_challenge = false;

    if (body.blocked && body.fingerprint_id) {
      const fp = await lookupFingerprint(body.fingerprint_id, env);
      const existing = fp?.flags || [];
      const newFlags = existing.includes('failed_challenge') ? existing : [...existing, 'failed_challenge'];
      await recordFingerprint(body.fingerprint_id, { fail: true, flags: newFlags }, env);
    } else if (body.fingerprint_id) {
      const rlFp = await rateLimitByFingerprint(body.fingerprint_id, env, { scope: 'fp-check', limit: 5, windowSeconds: 60 });
      if (!rlFp.limited) {
        const fp = await lookupFingerprint(body.fingerprint_id, env);
        if (fp) {
          if (isBanned(fp)) {
            return new Response(JSON.stringify({ flags: ['banned'], penalty: -1, dc, fast_challenge: false }), {
              status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
            });
          }
          flags.push(...(fp.flags || []));
          penalty += fingerprintPenalty(fp);
          fast_challenge = fp.fail_count > 3 && fp.pass_count === 0;
        }
        if (body.headless) {
          if (!flags.includes('headless')) flags.push('headless');
          penalty -= 0.35;
          fast_challenge = true;
          if (body.fingerprint_id) {
            const fp2 = await lookupFingerprint(body.fingerprint_id, env);
            const existing2 = fp2?.flags || [];
            if (!existing2.includes('headless')) {
              await recordFingerprint(body.fingerprint_id, { flags: [...existing2, 'headless'] }, env);
            }
          }
        }
      }
    }

    if (body.blocked && body.site_id) {
      await bumpFail(body.site_id);
    }

    return new Response(JSON.stringify({ flags, penalty, dc, fast_challenge }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ flags: [], penalty: 0, dc: false, fast_challenge: false }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
