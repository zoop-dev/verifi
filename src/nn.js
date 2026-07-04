export var _VNN = {
  E: new Float32Array([0.2,-0.1,0.3,-0.2,0.1,0.4,-0.1,0.2,0.3,-0.1,0.1,-0.3,0.2,0.1,-0.2,0.3,0.4,0.1,-0.2,0.3,-0.1,0.2,0.4,-0.1,0.1,0.3,-0.2,0.1,0.3,0.2,-0.1,0.4,-0.1,0.3,0.1,-0.4,0.2,0.1,0.3,-0.2,0.1,-0.1,0.4,0.2,-0.1,0.3,0.1,-0.2,0.3,-0.2,0.4,0.1,-0.3,0.2,0.1,0.4,-0.1,0.2,0.3,-0.1,0.4,0.1,-0.2,0.3,0.1,0.4,-0.1,0.2,0.3,0.1,-0.2,0.4,0.2,-0.1,0.3,0.1,0.4,-0.2,0.1,0.3]),
  Q: new Float32Array(256).map(function (_, i) { return Math.sin(i * 1.7 + 0.3) * 0.5 }),
  K: new Float32Array(256).map(function (_, i) { return Math.cos(i * 1.3 + 0.7) * 0.5 }),
  V: new Float32Array(256).map(function (_, i) { return Math.sin(i * 0.9 + 1.1) * 0.5 }),
  W1: new Float32Array(512).map(function (_, i) { return Math.sin(i * 0.7) * 0.3 }),
  b1: new Float32Array(32).fill(0.1),
  W2: new Float32Array(512).map(function (_, i) { return Math.cos(i * 0.5) * 0.3 }),
  b2: new Float32Array(16).fill(0.05),
  Wo: new Float32Array(16).map(function (_, i) { return Math.sin(i * 1.1) * 0.4 + 0.1 }),
  bo: 0.0, lr: 0.01
};

export function _sigmoid(x) { return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, x)))) }
export function _vdot(a, b) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * b[i]; return s }
export function _vsoftmax(x) { var mx = Math.max.apply(null, x), ex = x.map(function (v) { return Math.exp(v - mx) }), s = ex.reduce(function (a, b) { return a + b }, 0); return ex.map(function (v) { return v / s }) }
export function _vembed(t, f) { return Array.from(_VNN.E.slice(t * 16, (t + 1) * 16)).map(function (v, i) { return v + (f[i % f.length] || 0) * 0.1 }) }
export function _vattend(seq) {
  if (!seq.length) return new Array(16).fill(0.5);
  var n = Math.min(seq.length, 32), D = 16;
  var Q = new Float32Array(n * D), K = new Float32Array(n * D), V = new Float32Array(n * D);
  for (var i = 0; i < n; i++) { var tok = seq[seq.length - n + i]; for (var j = 0; j < D; j++) { var qv = 0, kv = 0, vv = 0; for (var p = 0; p < D; p++) { qv += tok[p] * _VNN.Q[p * D + j]; kv += tok[p] * _VNN.K[p * D + j]; vv += tok[p] * _VNN.V[p * D + j] } Q[i * D + j] = qv; K[i * D + j] = kv; V[i * D + j] = vv; } }
  var out = new Float32Array(D);
  for (var i = 0; i < n; i++) { var qi = Array.from(Q.slice(i * D, (i + 1) * D)), sc = []; for (var j = 0; j < n; j++) { var kj = Array.from(K.slice(j * D, (j + 1) * D)); sc.push(_vdot(qi, kj) / Math.sqrt(D)) } var at = _vsoftmax(sc), vi = Array.from(V.slice((n - 1) * D)); for (var d = 0; d < D; d++) out[d] += at[n - 1] * vi[d]; }
  return Array.from(out);
}
export function _vffn(x) {
  var h1 = new Float32Array(32); for (var i = 0; i < 32; i++) { var s = _VNN.b1[i]; for (var j = 0; j < 16; j++) s += x[j] * _VNN.W1[j * 32 + i]; h1[i] = Math.max(0, s) }
  var h2 = new Float32Array(16); for (var i = 0; i < 16; i++) { var s = _VNN.b2[i]; for (var j = 0; j < 32; j++) s += h1[j] * _VNN.W2[j * 16 + i]; h2[i] = s }
  return Array.from(h2);
}
export function _vinfer(seq) { if (seq.length < 2) return 0.5; var ctx = _vattend(seq), h = _vffn(ctx); return _sigmoid(_vdot(h, Array.from(_VNN.Wo)) + _VNN.bo) }
export function _vlearn(seq, label) { var pred = _vinfer(seq), err = label - pred, grad = err * pred * (1 - pred); _VNN.bo += _VNN.lr * grad * 0.1; var ctx = _vattend(seq); for (var i = 0; i < 16; i++) _VNN.Wo[i] += _VNN.lr * grad * ctx[i] * 0.1; }

export function _vbayes(prior, lik, conf) { return Math.max(0, Math.min(1, prior * (1 - conf * 0.25) + lik * conf * 0.25)) }
