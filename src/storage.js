import { _VNN } from './nn.js';

var _VDB = 'verifi_v2', _VDS = 'p';

var _DEFAULT_SIG = { tr: { s: 0, c: 0 }, sc: { s: 0, c: 0 }, cl: { s: 0, c: 0 }, ks: { s: 0, c: 0 }, jt: { s: 0, c: 0 }, to: { s: 0, c: 0 }, gpu: { s: 0, c: 0 }, jtr: { s: 0, c: 0 }, aud: { s: 0, c: 0 }, vel: { s: 0, c: 0 }, dw: { s: 0, c: 0 }, mc: { s: 0, c: 0 }, md: { s: 0, c: 0 }, ft: { s: 0, c: 0 }, batt: { s: 0, c: 0 }, media: { s: 0, c: 0 }, mem: { s: 0, c: 0 }, font: { s: 0, c: 0 }, raf: { s: 0, c: 0 } };
export var _vP = { hp: 0.65, sc: 0, ts: 0, sig: JSON.parse(JSON.stringify(_DEFAULT_SIG)), fl: [] };

function _vdb() { return new Promise(function (r, j) { var q = indexedDB.open(_VDB, 1); q.onupgradeneeded = function (e) { e.target.result.createObjectStore(_VDS, { keyPath: 'k' }) }; q.onsuccess = function (e) { r(e.target.result) }; q.onerror = j }) }
function _vdg(k) { return _vdb().then(function (db) { return new Promise(function (r, j) { var q = db.transaction(_VDS, 'readonly').objectStore(_VDS).get(k); q.onsuccess = function (e) { r(e.target.result ? e.target.result.v : null) }; q.onerror = j }) }).catch(function () { return null }) }
function _vds(k, v) { return _vdb().then(function (db) { return new Promise(function (r, j) { var q = db.transaction(_VDS, 'readwrite').objectStore(_VDS).put({ k: k, v: v }); q.onsuccess = r; q.onerror = j }) }).catch(function () {}) }

export function _vload() {
  return _vdg('hp').then(function (sv) {
    if (sv) { _vP = { ..._vP, ...sv }; _vP.sig = { ..._DEFAULT_SIG, ...(sv.sig || {}) }; _vP.ts = (sv.ts || 0) + 1; }
    return _vdg('nn');
  }).then(function (nw) {
    if (nw) { _VNN.Q = new Float32Array(nw.Q); _VNN.K = new Float32Array(nw.K); _VNN.V = new Float32Array(nw.V); _VNN.W1 = new Float32Array(nw.W1); _VNN.W2 = new Float32Array(nw.W2); _VNN.Wo = new Float32Array(nw.Wo); _VNN.bo = nw.bo || 0; }
  }).catch(function () {});
}
export function _vsave() {
  _vds('hp', { hp: _vP.hp, sc: _vP.sc, ts: _vP.ts, sig: _vP.sig, fl: _vP.fl.slice(-20) });
  if (_vP.ts % 5 === 0) _vds('nn', { Q: Array.from(_VNN.Q), K: Array.from(_VNN.K), V: Array.from(_VNN.V), W1: Array.from(_VNN.W1), W2: Array.from(_VNN.W2), Wo: Array.from(_VNN.Wo), bo: _VNN.bo });
}
