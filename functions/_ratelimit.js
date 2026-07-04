import { hashIp } from './_ip.js';

export async function rateLimit(request, env, opts) {
  const kv = env?.RATE_LIMIT;
  const secret = env?.VERIFI_IP_SECRET;
  if (!kv || !secret) return { limited: false };

  const rawIp = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '';
  if (!rawIp) return { limited: false };

  const ipHash = await hashIp(rawIp, secret);
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / opts.windowSeconds);
  const key = `rl:${opts.scope}:${ipHash}:${bucket}`;

  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= opts.limit) return { limited: true };

  await kv.put(key, String(count + 1), { expirationTtl: opts.windowSeconds * 2 });
  return { limited: false };
}
