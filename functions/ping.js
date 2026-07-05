import { hashIp, DC_ASNS, lookupIpReputation, recordIpHit } from './_ip.js';
import { bumpFail } from './_stats.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env, context }) {
  const debug = [];
  try {
    const body = await request.json().catch(() => ({}));
    const rawIp = request.headers.get('cf-connecting-ip')
      || request.headers.get('x-real-ip')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || body.ip || '';

    debug.push(`rawIp=${rawIp || '(empty)'}`);

    const secret = env?.VERIFI_IP_SECRET;
    if (!secret) throw new Error('VERIFI_IP_SECRET not set');
    const ip = rawIp ? await hashIp(rawIp, secret) : '';

    debug.push(`hash=${ip || '(empty)'}`);

    const cfAsn = request.cf?.asn ? Number(request.cf.asn) : 0;
    const asn = cfAsn || (body.asn ? Number(body.asn) : 0);
    const isDatacenter = DC_ASNS.has(asn);

    const flags = [];
    if (isDatacenter) flags.push('datacenter');

    const ipRep = ip ? await lookupIpReputation(ip) : { score: 50, flags: [], found: false };
    const hasFailedBefore = (ipRep.flags || []).includes('failed_challenge');

    const clientP = (body.p != null && body.p >= 0 && body.p <= 1) ? body.p : null;
    const reportedBotScore = clientP != null ? Math.round((1 - clientP) * 100) : null;

    let botScore;
    if (reportedBotScore != null) {
      botScore = ipRep.found
        ? Math.round(ipRep.score * 0.7 + reportedBotScore * 0.3)
        : reportedBotScore;
    } else {
      botScore = ipRep.found ? ipRep.score : 50;
    }

    if (isDatacenter) botScore = Math.min(100, botScore + 25);
    if (hasFailedBefore) botScore = Math.min(100, botScore + 15);
    botScore = Math.max(0, Math.min(100, botScore));

    if (body.fail) botScore = Math.min(100, botScore + 20);

    const allFlags = [...new Set([...flags, ...(ipRep.flags || [])])];
    if (body.blocked && !allFlags.includes('failed_challenge')) allFlags.push('failed_challenge');
    const finalPenalty = -((botScore - 50) / 200);

    debug.push(`clientP=${clientP} reportedBot=${reportedBotScore} finalBot=${botScore} hasFailedBefore=${hasFailedBefore}`);

    let upsertStatus = 0;
    if (ip) {
      upsertStatus = await recordIpHit(ip, botScore, allFlags);
      debug.push(`upsert=${upsertStatus}`);
    }

    if (body.blocked && body.site_id) {
      await bumpFail(body.site_id);
    }

    return new Response(JSON.stringify({
      bot_score: botScore,
      flags: allFlags,
      penalty: Math.round(finalPenalty * 1000) / 1000,
      cached: ipRep.found,
      dc: isDatacenter,
      debug,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ bot_score: 50, flags: [], penalty: 0, error: e.message, debug }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
}
