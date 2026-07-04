function _vfftfn(re, im) { var n = re.length; if (n <= 1) return; var re_e = [], im_e = [], re_o = [], im_o = []; for (var i = 0; i < n; i += 2) { re_e.push(re[i]); im_e.push(im[i]); re_o.push(re[i + 1]); im_o.push(im[i + 1]) } _vfftfn(re_e, im_e); _vfftfn(re_o, im_o); for (var k = 0; k < n / 2; k++) { var a = -2 * Math.PI * k / n, c = Math.cos(a), s = Math.sin(a), tr = c * re_o[k] - s * im_o[k], ti = s * re_o[k] + c * im_o[k]; re[k] = re_e[k] + tr; im[k] = im_e[k] + ti; re[k + n / 2] = re_e[k] - tr; im[k + n / 2] = im_e[k] - ti } }
function _vps(sig) { var n = Math.pow(2, Math.floor(Math.log2(sig.length))); var re = sig.slice(0, n).map(Number), im = new Array(n).fill(0), m = re.reduce(function (a, b) { return a + b }, 0) / n; for (var i = 0; i < n; i++) re[i] -= m; _vfftfn(re, im); return re.map(function (r, i) { return r * r + im[i] * im[i] }) }
function _vbp(sp, sr, lo, hi) { var n = sp.length, li = Math.floor(lo * n / sr), hi2 = Math.ceil(hi * n / sr), s = 0; for (var i = li; i <= Math.min(hi2, n - 1); i++) s += sp[i]; return s }

export function _vtremor(samples, sr) {
  if (samples.length < 64) return { s: 0, c: 0 };
  var dx = samples.map(function (s, i) { return i ? s.x - samples[i - 1].x : 0 });
  var dy = samples.map(function (s, i) { return i ? s.y - samples[i - 1].y : 0 });
  var sx = _vps(dx), sy = _vps(dy);
  var tx = _vbp(sx, sr, 8, 12), ty = _vbp(sy, sr, 8, 12), cx = _vbp(sx, sr, 1, 2), tot = _vbp(sx, sr, 0, sr / 2) + 1e-9;
  var tr = (tx / tot + ty / (tot + 1e-9)) / 2, cr = cx / tot;
  return { s: (tr > 0.003 ? 50 : 0) + (cr > 0.001 ? 30 : 0) + Math.min(20, samples.length / 5), c: Math.min(1, samples.length / 128), tr: tr, cr: cr }
}
export function _vscroll(s) {
  if (s.length < 8) return { s: 0, c: 0 };
  var v = s.map(function (x, i) { return i ? Math.abs(x.dy) / (x.t - s[i - 1].t + 1) : 0 }).filter(function (x) { return x > 0 });
  if (v.length < 4) return { s: 0, c: 0 };
  var mx = 0, mi = 0; v.forEach(function (x, i) { if (x > mx) { mx = x; mi = i } });
  var dec = v.slice(mi), exp = false;
  if (dec.length > 3) { var ld = dec.map(function (x) { return Math.log(x + 1e-9) }), sx = 0, sy = 0, sxy = 0, sx2 = 0; ld.forEach(function (y, x) { sx += x; sy += y; sxy += x * y; sx2 += x * x }); var n = ld.length, sl = (n * sxy - sx * sy) / (n * sx2 - sx * sx); exp = sl < -0.05 && sl > -2; }
  var m = v.reduce(function (a, b) { return a + b }, 0) / v.length, vr = v.reduce(function (a, b) { return a + Math.pow(b - m, 2) }, 0) / v.length;
  return { s: (exp ? 40 : 0) + (vr > 0.1 ? 30 : 0) + Math.min(30, s.length * 3), c: Math.min(1, s.length / 20) }
}
export function _vclicks(cs) {
  if (cs.length < 3) return { s: 0, c: 0 };
  var rx = cs.map(function (c) { return (c.x / (c.vw || 1920)) - 0.5 }), ry = cs.map(function (c) { return (c.y / (c.vh || 1080)) - 0.5 });
  var mx = rx.reduce(function (a, b) { return a + b }, 0) / rx.length;
  var vx = rx.reduce(function (a, v) { return a + Math.pow(v - mx, 2) }, 0) / rx.length;
  var my = ry.reduce(function (a, b) { return a + b }, 0) / ry.length;
  var vy = ry.reduce(function (a, v) { return a + Math.pow(v - my, 2) }, 0) / ry.length;
  var ict = cs.map(function (c, i) { return i ? c.t - cs[i - 1].t : 0 }).filter(function (t) { return t > 0 });
  var icm = ict.reduce(function (a, b) { return a + b }, 0) / (ict.length || 1);
  var icv = ict.reduce(function (a, v) { return a + Math.pow(v - icm, 2) }, 0) / (ict.length || 1);
  var ng = new Set(cs.map(function (c) { return Math.round(c.x / 10) * 10 })).size > cs.length * 0.5;
  return { s: (Math.abs(mx) > 0.01 ? 20 : 0) + (vx > 0.001 && vy > 0.001 ? 25 : 0) + (ng ? 25 : 0) + (icv > 1000 ? 30 : 0), c: Math.min(1, cs.length / 10) }
}
export function _vkeys(ks) {
  if (ks.length < 6) return { s: 0, c: 0 };
  var ikt = ks.map(function (k, i) { return i ? k.t - ks[i - 1].t : 0 }).filter(function (t) { return t > 0 && t < 3000 });
  if (ikt.length < 4) return { s: 0, c: 0 };
  var m = ikt.reduce(function (a, b) { return a + b }, 0) / ikt.length, vr = ikt.reduce(function (a, v) { return a + Math.pow(v - m, 2) }, 0) / ikt.length, cv = Math.sqrt(vr) / m;
  var lk = ikt.map(function (t) { return Math.log(t) }), lm = lk.reduce(function (a, b) { return a + b }, 0) / lk.length, lv = lk.reduce(function (a, v) { return a + Math.pow(v - lm, 2) }, 0) / lk.length;
  return { s: (cv > 0.2 && cv < 2 ? 30 : 0) + (lv > 0.05 && lv < 2 ? 35 : 0) + (m > 50 ? 15 : 0) + (vr > 100 ? 20 : 0), c: Math.min(1, ikt.length / 15) }
}
export function _vtouch(ts) {
  if (ts.length < 4) return { s: 0, c: 0 };
  var vals = ts.map(function (t) { return t.force > 0 ? t.force : (t.r || 0) / 40 }).filter(function (v) { return v > 0 });
  if (vals.length < 3) return { s: 0, c: 0 };
  var m = vals.reduce(function (a, b) { return a + b }, 0) / vals.length, vr = vals.reduce(function (a, v) { return a + Math.pow(v - m, 2) }, 0) / vals.length;
  return { s: (vr > 0.0001 ? 40 : 0) + (new Set(vals.map(function (x) { return Math.round(x * 100) })).size > 2 ? 35 : 0) + (m > 0.05 && m < 0.95 ? 25 : 0), c: Math.min(1, vals.length / 10) }
}
export function _vvel(samples) {
  if (samples.length < 32) return { s: 0, c: 0 };
  var speeds = samples.map(function (s, i) { if (!i) return 0; var dx = s.x - samples[i - 1].x, dy = s.y - samples[i - 1].y, dt = s.t - samples[i - 1].t || 1; return Math.sqrt(dx * dx + dy * dy) / dt }).filter(function (v) { return v > 0 });
  if (speeds.length < 16) return { s: 0, c: 0 };
  var mean = speeds.reduce(function (a, b) { return a + b }, 0) / speeds.length;
  var sorted = speeds.slice().sort(function (a, b) { return a - b });
  var median = sorted[Math.floor(sorted.length / 2)], p95 = sorted[Math.floor(sorted.length * 0.95)];
  var vr = speeds.reduce(function (a, v) { return a + Math.pow(v - mean, 2) }, 0) / speeds.length;
  return { s: (median < mean * 0.85 ? 35 : 0) + (p95 > mean * 2.5 ? 35 : 0) + (vr > 0.01 ? 30 : 0), c: Math.min(1, speeds.length / 64) }
}

export function _vdwell(buf) {
  if (buf.length < 3) return { s: 0, c: 0 };
  var mean = buf.reduce(function (a, b) { return a + b; }, 0) / buf.length;
  var vr = buf.reduce(function (a, v) { return a + Math.pow(v - mean, 2); }, 0) / buf.length;

  var inRange = buf.filter(function (v) { return v >= 60 && v <= 350; }).length / buf.length;
  var s = Math.round(inRange * 60 + Math.min(40, Math.sqrt(vr)));
  var c = Math.min(0.85, buf.length / 10);
  return { s: s, c: c };
}

export function _vscrollMicro(buf) {
  if (buf.length < 4) return { s: 0, c: 0 };

  var reversals = 0;
  for (var i = 2; i < buf.length; i++) {
    var prev = buf[i - 1], curr = buf[i];
    if (Math.abs(curr.dy) < 3 && Math.abs(prev.dy) > 5) reversals++;
    if (prev.dy > 0 && curr.dy < -1) reversals++;
    if (prev.dy < 0 && curr.dy > 1) reversals++;
  }
  var s = Math.min(100, reversals * 25 + 40);
  var c = Math.min(0.7, buf.length / 20);
  return { s: s, c: c };
}

export function _vcurvature(mb) {
  if (mb.length < 20) return { s: 0, c: 0 };
  var samples = mb.slice(-60);
  var corrections = 0, overshoots = 0;
  for (var i = 2; i < samples.length - 1; i++) {
    var p0 = samples[i - 2], p1 = samples[i - 1], p2 = samples[i];
    var v1x = p1.x - p0.x, v1y = p1.y - p0.y;
    var v2x = p2.x - p1.x, v2y = p2.y - p1.y;

    if (v1x * v2x < -1 || v1y * v2y < -1) corrections++;

    var s1 = Math.sqrt(v1x * v1x + v1y * v1y);
    var s2 = Math.sqrt(v2x * v2x + v2y * v2y);
    if (s1 > s2 * 2.5 && s1 > 3) overshoots++;
  }
  var total = corrections + overshoots * 2;
  var s = Math.min(100, total * 8 + 30);
  var c = Math.min(0.75, samples.length / 40);
  return { s: s, c: c, corrections: corrections, overshoots: overshoots };
}

export function _vreaction(buf) {
  if (buf.length < 3) return { s: 0, c: 0 };

  var valid = buf.filter(function (v) { return v > 0 && v < 5000; });
  if (valid.length < 3) return { s: 0, c: 0 };
  var mean = valid.reduce(function (a, b) { return a + b; }, 0) / valid.length;
  var vr = valid.reduce(function (a, v) { return a + Math.pow(v - mean, 2); }, 0) / valid.length;
  var hasFloor = valid.every(function (v) { return v > 80; });
  var hasVariance = vr > 1500;
  var s = hasFloor ? 50 : 10;
  if (hasVariance) s += 30;
  if (mean > 150 && mean < 2000) s += 20;
  return { s: Math.min(100, s), c: Math.min(0.8, valid.length / 8) };
}
