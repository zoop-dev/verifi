var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// _config.js
var SB_URL = "https://ymfgcndmekugcwiivrof.supabase.co";
var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltZmdjbmRtZWt1Z2N3aWl2cm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzODMwNTksImV4cCI6MjA5Mzk1OTA1OX0.sMR3ooeVVvEuW_R1GwcrNscLr94iFrF_GK614rME-m4";

// _sites.js
async function lookupSite(id, withKey = false) {
  if (!id) return null;
  try {
    const select = withKey ? "id,domain,name,admin_key,created_at" : "id,domain,name,created_at";
    const r = await fetch(`${SB_URL}/rest/v1/verifi_sites?id=eq.${encodeURIComponent(id)}&select=${select}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (rows && rows.length) return rows[0];
  } catch {
  }
  return null;
}
__name(lookupSite, "lookupSite");
async function verifySiteKey(id, key) {
  if (!id || !key) return false;
  const site = await lookupSite(id, true);
  return site && site.admin_key === key;
}
__name(verifySiteKey, "verifySiteKey");
async function listSites() {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/verifi_sites?select=id,name,domain,created_at&order=created_at.desc&limit=200`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}
__name(listSites, "listSites");
function normalizeDomain(input) {
  const s = (input || "").trim().toLowerCase();
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//.test(s) ? s : `https://${s}`;
    return new URL(withProto).hostname;
  } catch {
    return "";
  }
}
__name(normalizeDomain, "normalizeDomain");
function originMatchesDomain(origin, domain) {
  if (!origin || !domain) return false;
  try {
    const host = new URL(origin).hostname;
    return host === domain || host === `www.${domain}` || `www.${host}` === domain;
  } catch {
    return false;
  }
}
__name(originMatchesDomain, "originMatchesDomain");
function hasValidTld(domain) {
  if (!domain || typeof domain !== "string") return false;
  const parts = domain.split(".");
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1];
  return tld.length > 0 && /^[a-zA-Z]+$/.test(tld);
}
__name(hasValidTld, "hasValidTld");

// _ip.js
var DC_ASNS = /* @__PURE__ */ new Set([
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
  3356
]);
async function hashIp(ip, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
__name(hashIp, "hashIp");
async function getIpInfo(request, env) {
  const cf = request.cf || {};
  const rawIp = request.headers.get("cf-connecting-ip") || "";
  const secret = env?.VERIFI_IP_SECRET;
  if (!secret) throw new Error("VERIFI_IP_SECRET not set");
  const ip = rawIp ? await hashIp(rawIp, secret) : "";
  const asn = cf.asn ? Number(cf.asn) : 0;
  const isDatacenter = DC_ASNS.has(asn);
  const country = cf.country || "";
  const org = cf.asOrganization || "";
  let penalty = 0;
  const flags2 = [];
  if (isDatacenter) {
    penalty -= 0.25;
    flags2.push("datacenter");
  }
  return { ip, asn, isDatacenter, country, org, flags: flags2, penalty };
}
__name(getIpInfo, "getIpInfo");
async function lookupIpReputation(ip) {
  if (!ip) return { score: 50, flags: [], found: false };
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/verifi_ips?ip=eq.${encodeURIComponent(ip)}&select=score,flags,hits`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );
    const rows = await r.json();
    if (rows && rows.length) return { ...rows[0], found: true };
  } catch {
  }
  return { score: 50, flags: [], found: false };
}
__name(lookupIpReputation, "lookupIpReputation");
async function recordIpHit(ip, score, flags2) {
  if (!ip) return;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/verifi_ips`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        ip,
        score: Math.round(score),
        hits: 1,
        flags: flags2,
        last_seen: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    return res.status;
  } catch {
  }
}
__name(recordIpHit, "recordIpHit");

// _ratelimit.js
async function rateLimit(request, env, opts) {
  const kv = env?.RATE_LIMIT;
  const secret = env?.VERIFI_IP_SECRET;
  if (!kv || !secret) return { limited: false };
  const rawIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!rawIp) return { limited: false };
  const ipHash = await hashIp(rawIp, secret);
  const now = Math.floor(Date.now() / 1e3);
  const bucket = Math.floor(now / opts.windowSeconds);
  const key = `rl:${opts.scope}:${ipHash}:${bucket}`;
  const current = await kv.get(key);
  const count = current ? parseInt(current, 10) : 0;
  if (count >= opts.limit) return { limited: true };
  await kv.put(key, String(count + 1), { expirationTtl: opts.windowSeconds * 2 });
  return { limited: false };
}
__name(rateLimit, "rateLimit");

// api/register.js
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function uid() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(uid, "uid");
function adminKey() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
__name(adminKey, "adminKey");
async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}
__name(onRequestOptions, "onRequestOptions");
async function onRequestPost({ request, env }) {
  try {
    const rl = await rateLimit(request, env, { scope: "register", limit: 5, windowSeconds: 3600 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const { name, domain } = await request.json();
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: "name required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain || !hasValidTld(normalizedDomain)) {
      return new Response(JSON.stringify({ error: "valid domain with TLD required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    const id = uid();
    const key = adminKey();
    const res = await fetch(`${SB_URL}/rest/v1/verifi_sites`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        id,
        admin_key: key,
        name: name.trim().slice(0, 100),
        domain: normalizedDomain,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      })
    });
    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: "db error", detail: err }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ id, admin_key: key, name: name.trim(), domain: normalizedDomain }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
}
__name(onRequestPost, "onRequestPost");

// _stats.js
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
__name(today, "today");
async function bumpStat(siteId, column) {
  if (!siteId) return;
  try {
    const day = today();
    const r = await fetch(`${SB_URL}/rest/v1/verifi_stats?site_id=eq.${encodeURIComponent(siteId)}&day=eq.${day}&select=${column}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    const current = rows && rows[0] ? rows[0][column] || 0 : 0;
    await fetch(`${SB_URL}/rest/v1/verifi_stats`, {
      method: "POST",
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ site_id: siteId, day, [column]: current + 1 })
    });
  } catch {
  }
}
__name(bumpStat, "bumpStat");
function bumpPass(siteId) {
  return bumpStat(siteId, "passes");
}
__name(bumpPass, "bumpPass");
function bumpFail(siteId) {
  return bumpStat(siteId, "fails");
}
__name(bumpFail, "bumpFail");
async function getStats(siteId) {
  if (!siteId) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/verifi_stats?site_id=eq.${encodeURIComponent(siteId)}&select=day,passes,fails&order=day.desc&limit=3650`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    const rows = await r.json();
    if (!Array.isArray(rows)) return null;
    const totals = rows.reduce((acc, row) => {
      acc.passes += row.passes || 0;
      acc.fails += row.fails || 0;
      return acc;
    }, { passes: 0, fails: 0 });
    return { site_id: siteId, totals, days: rows.slice(0, 30) };
  } catch {
    return null;
  }
}
__name(getStats, "getStats");

// ping.js
var CORS2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions2() {
  return new Response(null, { status: 204, headers: CORS2 });
}
__name(onRequestOptions2, "onRequestOptions");
async function onRequestPost2({ request, env, context }) {
  const debug = [];
  try {
    const body = await request.json().catch(() => ({}));
    const rawIp = request.headers.get("cf-connecting-ip") || "";
    if (!rawIp) {
      return new Response(JSON.stringify({ bot_score: 50, flags: [], penalty: 0, error: "missing cf-connecting-ip" }), {
        status: 400,
        headers: { ...CORS2, "Content-Type": "application/json" }
      });
    }
    const secret = env?.VERIFI_IP_SECRET;
    if (!secret) throw new Error("VERIFI_IP_SECRET not set");
    const ip = await hashIp(rawIp, secret);
    debug.push(`hasIp=true`);
    const asn = request.cf?.asn ? Number(request.cf.asn) : 0;
    const isDatacenter = DC_ASNS.has(asn);
    const flags2 = [];
    if (isDatacenter) flags2.push("datacenter");
    const ipRep = ip ? await lookupIpReputation(ip) : { score: 50, flags: [], found: false };
    const hasFailedBefore = (ipRep.flags || []).includes("failed_challenge");
    const clientP = body.p != null && body.p >= 0 && body.p <= 1 ? body.p : null;
    const reportedBotScore = clientP != null ? Math.round((1 - clientP) * 100) : null;
    let botScore;
    if (reportedBotScore != null) {
      botScore = ipRep.found ? Math.round(ipRep.score * 0.7 + reportedBotScore * 0.3) : reportedBotScore;
    } else {
      botScore = ipRep.found ? ipRep.score : 50;
    }
    if (isDatacenter) botScore = Math.min(100, botScore + 25);
    if (hasFailedBefore) botScore = Math.min(100, botScore + 15);
    botScore = Math.max(0, Math.min(100, botScore));
    if (body.fail) botScore = Math.min(100, botScore + 20);
    const allFlags = [.../* @__PURE__ */ new Set([...flags2, ...ipRep.flags || []])];
    if (body.blocked && !allFlags.includes("failed_challenge")) allFlags.push("failed_challenge");
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
      penalty: Math.round(finalPenalty * 1e3) / 1e3,
      cached: ipRep.found,
      dc: isDatacenter,
      debug
    }), { status: 200, headers: { ...CORS2, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ bot_score: 50, flags: [], penalty: 0, error: e.message, debug }), {
      status: 200,
      headers: { ...CORS2, "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// _pow.js
async function verifyPow(challenge, nonce, difficulty) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${challenge}:${nonce}`));
    return new DataView(buf).getUint32(0, false) < Math.pow(2, 32 - difficulty);
  } catch {
    return false;
  }
}
__name(verifyPow, "verifyPow");

// pow-verify.js
var CORS3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function onRequestOptions3() {
  return new Response(null, { status: 204, headers: CORS3 });
}
__name(onRequestOptions3, "onRequestOptions");
async function onRequestPost3({ request, env }) {
  try {
    const rl = await rateLimit(request, env, { scope: "pow-verify", limit: 30, windowSeconds: 60 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { ...CORS3, "Content-Type": "application/json" } });
    }
    const { challenge, nonce, difficulty } = await request.json();
    if (!challenge || nonce === void 0 || !difficulty) {
      return new Response(JSON.stringify({ error: "invalid" }), { status: 400, headers: { ...CORS3, "Content-Type": "application/json" } });
    }
    if (difficulty > 20) {
      return new Response(JSON.stringify({ error: "difficulty too high" }), { status: 400, headers: { ...CORS3, "Content-Type": "application/json" } });
    }
    const ok = await verifyPow(challenge, nonce, difficulty);
    return new Response(JSON.stringify({ ok, challenge, nonce, difficulty }), {
      status: 200,
      headers: { ...CORS3, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "verify failed" }), { status: 500, headers: { ...CORS3, "Content-Type": "application/json" } });
  }
}
__name(onRequestPost3, "onRequestPost");

// stats.js
var CORS4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key"
};
async function onRequestOptions4() {
  return new Response(null, { status: 204, headers: CORS4 });
}
__name(onRequestOptions4, "onRequestOptions");
async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const providedKey = request.headers.get("x-admin-key") || url.searchParams.get("admin_key");
  const siteKey = url.searchParams.get("key");
  const siteId = url.searchParams.get("site_id");
  const rl = await rateLimit(request, env, { scope: "stats", limit: 30, windowSeconds: 60 });
  if (rl.limited) {
    return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { ...CORS4, "Content-Type": "application/json" } });
  }
  if (!siteId) {
    const adminKey2 = env?.VERIFI_ADMIN_KEY;
    if (!adminKey2 || providedKey !== adminKey2) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS4, "Content-Type": "application/json" } });
    }
    const sites = await listSites();
    return new Response(JSON.stringify({ sites }), { status: 200, headers: { ...CORS4, "Content-Type": "application/json" } });
  }
  if (siteKey) {
    const ok = await verifySiteKey(siteId, siteKey);
    if (!ok) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS4, "Content-Type": "application/json" } });
    }
  } else {
    const adminKey2 = env?.VERIFI_ADMIN_KEY;
    if (!adminKey2 || providedKey !== adminKey2) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...CORS4, "Content-Type": "application/json" } });
    }
  }
  const stats = await getStats(siteId);
  if (!stats) {
    return new Response(JSON.stringify({ error: "no data" }), { status: 404, headers: { ...CORS4, "Content-Type": "application/json" } });
  }
  const site = await lookupSite(siteId);
  if (site) {
    stats.site = { id: site.id, name: site.name, domain: site.domain, created_at: site.created_at };
  }
  return new Response(JSON.stringify(stats), { status: 200, headers: { ...CORS4, "Content-Type": "application/json" } });
}
__name(onRequestGet, "onRequestGet");

// token.js
var TOKEN_TTL = 300;
var CORS5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
__name(b64url, "b64url");
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
}
__name(hmac, "hmac");
async function onRequestOptions5() {
  return new Response(null, { status: 204, headers: CORS5 });
}
__name(onRequestOptions5, "onRequestOptions");
async function onRequestPost4({ request, env }) {
  const SECRET = env?.VERIFI_SECRET;
  if (!SECRET) throw new Error("VERIFI_SECRET not set");
  try {
    const rl = await rateLimit(request, env, { scope: "token", limit: 20, windowSeconds: 60 });
    if (rl.limited) {
      return new Response(JSON.stringify({ error: "rate limited" }), { status: 429, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    const { site_id, pow, probability, confidence } = await request.json();
    if (!pow?.challenge || pow.nonce === void 0 || !pow.difficulty) {
      return new Response(JSON.stringify({ error: "pow required" }), { status: 400, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    if (pow.difficulty > 20) {
      return new Response(JSON.stringify({ error: "invalid difficulty" }), { status: 400, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    const powOk = await verifyPow(pow.challenge, pow.nonce, pow.difficulty);
    if (!powOk) {
      return new Response(JSON.stringify({ error: "pow invalid" }), { status: 403, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    const site = await lookupSite(site_id);
    if (!site || !site.domain) {
      return new Response(JSON.stringify({ error: "unknown or unregistered site_id" }), { status: 400, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    const origin = request.headers.get("origin");
    if (!originMatchesDomain(origin, site.domain)) {
      return new Response(JSON.stringify({ error: "origin does not match registered domain" }), { status: 403, headers: { ...CORS5, "Content-Type": "application/json" } });
    }
    const ipInfo = await getIpInfo(request, env);
    const ipRep = await lookupIpReputation(ipInfo.ip);
    const serverPenalty = ipInfo.penalty + (ipRep.found && ipRep.score > 70 ? -0.15 : 0);
    const adjustedP = Math.max(0, Math.min(1, (probability || 0) + serverPenalty));
    const rawFlags = [.../* @__PURE__ */ new Set([...ipInfo.flags, ...ipRep.flags || []])];
    const redeemed = adjustedP >= 0.6;
    const allFlags = redeemed ? rawFlags.filter((f) => f !== "failed_challenge") : rawFlags;
    const passBot = Math.round((1 - adjustedP) * 100);
    const blendedScore = Math.round((ipRep.score || 50) * 0.7 + passBot * 0.3);
    await recordIpHit(ipInfo.ip, blendedScore, allFlags);
    const now = Math.floor(Date.now() / 1e3);
    const payload = JSON.stringify({ site_id: site_id || "", domain: site.domain, iat: now, exp: now + TOKEN_TTL, p: Math.round(adjustedP * 1e3) / 1e3, c: Math.round((confidence || 0) * 1e3) / 1e3, flags: allFlags });
    const payloadB64 = b64url(new TextEncoder().encode(payload));
    const sigB64 = b64url(await hmac(SECRET, payloadB64));
    const token = `vrf1.${payloadB64}.${sigB64}`;
    await bumpPass(site_id);
    return new Response(JSON.stringify({ token, expires_in: TOKEN_TTL, server_penalty: serverPenalty, flags: allFlags }), {
      status: 200,
      headers: { ...CORS5, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...CORS5, "Content-Type": "application/json" } });
  }
}
__name(onRequestPost4, "onRequestPost");

// verify.js
var CORS6 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function b64urlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((str.length + 3) % 4 || 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}
__name(b64urlDecode, "b64urlDecode");
async function verifyHmac(secret, data, sig) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
}
__name(verifyHmac, "verifyHmac");
async function onRequestOptions6() {
  return new Response(null, { status: 204, headers: CORS6 });
}
__name(onRequestOptions6, "onRequestOptions");
async function onRequestPost5({ request, env }) {
  const SECRET = env?.VERIFI_SECRET;
  if (!SECRET) throw new Error("VERIFI_SECRET not set");
  try {
    const { token } = await request.json();
    if (!token || !token.startsWith("vrf1.")) {
      return new Response(JSON.stringify({ valid: false, error: "invalid token format" }), {
        status: 200,
        headers: { ...CORS6, "Content-Type": "application/json" }
      });
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      return new Response(JSON.stringify({ valid: false, error: "malformed token" }), {
        status: 200,
        headers: { ...CORS6, "Content-Type": "application/json" }
      });
    }
    const [_prefix, payloadB64, sigB64] = parts;
    const sigBytes = b64urlDecode(sigB64);
    const ok = await verifyHmac(SECRET, payloadB64, sigBytes);
    if (!ok) {
      return new Response(JSON.stringify({ valid: false, error: "signature invalid" }), {
        status: 200,
        headers: { ...CORS6, "Content-Type": "application/json" }
      });
    }
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now) {
      return new Response(JSON.stringify({ valid: false, error: "token expired", expired_at: payload.exp }), {
        status: 200,
        headers: { ...CORS6, "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      valid: true,
      site_id: payload.site_id,
      domain: payload.domain,
      probability: payload.p,
      confidence: payload.c,
      flags: payload.flags || [],
      issued_at: payload.iat,
      expires_at: payload.exp
    }), {
      status: 200,
      headers: { ...CORS6, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ valid: false, error: e.message }), {
      status: 500,
      headers: { ...CORS6, "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost5, "onRequestPost");

// ../.wrangler/tmp/pages-ezQLFe/functionsRoutes-0.29727791178758123.mjs
var routes = [
  {
    routePath: "/api/register",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/register",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/ping",
    mountPath: "/",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/ping",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/pow-verify",
    mountPath: "/",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/pow-verify",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/stats",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/stats",
    mountPath: "/",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/token",
    mountPath: "/",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions5]
  },
  {
    routePath: "/token",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/verify",
    mountPath: "/",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions6]
  },
  {
    routePath: "/verify",
    mountPath: "/",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  }
];

// ../../../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};
