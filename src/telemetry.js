import { w, d } from './env.js';
import { state } from './state.js';
import { _vP, _vsave } from './storage.js';
import { _vbayes, _vinfer, _vembed } from './nn.js';
import { _vemit } from './events.js';
import { _vtremor, _vscroll, _vclicks, _vkeys, _vtouch, _vvel, _vdwell, _vscrollMicro, _vcurvature, _vreaction } from './signals.js';

export var _vSc = { p: 0.5, c: 0, sig: {}, ts: 0, nn: null };
export var _vSeq = [];
var _vStart = Date.now();

export var _vMB = [], _vMR = 60, _vSB = [], _vKB = [], _vCB = [], _vTB = [], _vJB = [];
export var _vDwB = [], _vScrollMicro = [], _vLastScrollY = 0, _vLastScrollT = 0, _vScrollSettled = false, _vScrollSettleT = 0;

export var _vPasteNoType = false;
export var _vLastKeyT = 0, _vPasteEvents = 0, _vTypeBeforePaste = 0;

export function _vupdScore() {
  var sigs = [_vP.sig.tr, _vP.sig.sc, _vP.sig.cl, _vP.sig.ks, _vP.sig.jt, _vP.sig.to, _vP.sig.vel, _vP.sig.dw, _vP.sig.mc, _vP.sig.md, _vP.sig.ft].filter(Boolean);
  sigs.forEach(function (s) { if (s && s.c > 0.2) _vP.hp = _vbayes(_vP.hp, s.s / 100, s.c) });
  if (_vSeq.length >= 4) _vP.hp = _vbayes(_vP.hp, _vinfer(_vSeq), 0.2);

  (function () {
    try { if (navigator.webdriver) _vP.hp = _vbayes(_vP.hp, 0, 0.7); } catch (e) {}
    try { if (w.outerWidth === 0 && w.outerHeight === 0) _vP.hp = _vbayes(_vP.hp, 0, 0.6); } catch (e) {}

  })();

  var behSigs = [_vP.sig.tr, _vP.sig.sc, _vP.sig.cl, _vP.sig.vel].filter(Boolean);
  var allZero = behSigs.every(function (s) { return s.c < 0.05 });
  var elapsed = (Date.now() - (_vStart || Date.now())) / 1000;
  if (allZero && elapsed > 10) _vP.hp = _vbayes(_vP.hp, 0.2, 0.3);
  _vP.hp = Math.max(0, Math.min(1, _vP.hp));
  var ac = sigs.reduce(function (a, s) { return a + s.c }, 0) / (sigs.length || 1);
  _vSc = { p: _vP.hp, c: ac, sig: _vP.sig, ts: _vP.ts, nn: _vSeq.length >= 4 ? _vinfer(_vSeq) : null };
  if (_vSc.p < 0.2 && _vSc.c > 0.45) state._isBot = true;
}
export function _vupdSc() { _vupdScore(); }

export function _vanalyze() {
  if (_vMB.length >= 64) {
    var r = _vtremor(_vMB, _vMR), s = _vP.sig.tr;
    s.s = r.s * r.c + s.s * (1 - r.c); s.c = Math.min(1, s.c + r.c * 0.15);
    if (r.c > 0.3) _vSeq.push(_vembed(0, [r.tr * 100, r.cr * 100, (r.tr > 0.003 ? 1 : 0), (r.cr > 0.001 ? 1 : 0)]));
    var vel = _vvel(_vMB.slice(-128));
    _vP.sig.vel.s = vel.s * vel.c + _vP.sig.vel.s * (1 - vel.c); _vP.sig.vel.c = Math.min(1, _vP.sig.vel.c + vel.c * 0.1);
    _vMB = _vMB.slice(-128);
  }
  if (_vSB.length >= 8) { var r = _vscroll(_vSB), s = _vP.sig.sc; s.s = r.s * r.c + s.s * (1 - r.c); s.c = Math.min(1, s.c + r.c * 0.15); if (r.c > 0.2) _vSeq.push(_vembed(2, [r.s / 100, r.c, 0, 0])); _vSB = []; }
  if (_vCB.length >= 3) { var r = _vclicks(_vCB), s = _vP.sig.cl; s.s = r.s * r.c + s.s * (1 - r.c); s.c = Math.min(1, s.c + r.c * 0.2); if (r.c > 0.2) _vSeq.push(_vembed(1, [r.s / 100, r.c, _vCB.length / 10, 0])); }
  if (_vKB.length >= 6) { var r = _vkeys(_vKB), s = _vP.sig.ks; s.s = r.s * r.c + s.s * (1 - r.c); s.c = Math.min(1, s.c + r.c * 0.2); if (r.c > 0.2) _vSeq.push(_vembed(3, [r.s / 100, r.c, 0, 0])); _vKB = _vKB.slice(-50); }
  if (_vTB.length >= 4) { var r = _vtouch(_vTB), s = _vP.sig.to; s.s = r.s * r.c + s.s * (1 - r.c); s.c = Math.min(1, s.c + r.c * 0.2); if (r.c > 0.2) _vSeq.push(_vembed(4, [r.s / 100, r.c, 0, 0])); }
  if (_vJB.length >= 16) {
    var jd = _vJB.map(function (s, i) { return i ? s - _vJB[i - 1] : 0 }).filter(function (d) { return d >= 0 });
    var jm = jd.reduce(function (a, b) { return a + b }, 0) / (jd.length || 1);
    var jvr = jd.reduce(function (a, v) { return a + Math.pow(v - jm, 2) }, 0) / (jd.length || 1);
    var jbins = new Array(20).fill(0); jd.forEach(function (x) { jbins[Math.min(19, Math.floor(x / (jm * 0.2 + 0.001)))]++ });
    var jne = jbins.filter(function (b) { return b > 0 }).length;
    var jr = { s: (jvr > 0.001 ? 40 : 0) + (jne > 3 ? 40 : 0) + Math.min(20, _vJB.length), c: Math.min(1, _vJB.length / 32) };
    _vP.sig.jt.s = jr.s * jr.c + _vP.sig.jt.s * (1 - jr.c); _vP.sig.jt.c = Math.min(1, _vP.sig.jt.c + jr.c * 0.12);
    _vJB = _vJB.slice(-32);
  }
  if (_vDwB.length >= 3) {
    var dw = _vdwell(_vDwB);
    _vP.sig.dw.s = dw.s * dw.c + _vP.sig.dw.s * (1 - dw.c); _vP.sig.dw.c = Math.min(1, _vP.sig.dw.c + dw.c * 0.2);
    if (dw.c > 0.3) _vSeq.push(_vembed(1, [dw.s / 100, dw.c, _vDwB.length / 10, 0]));
    _vDwB = _vDwB.slice(-20);
  }
  if (_vScrollMicro.length >= 4) {
    var mc = _vscrollMicro(_vScrollMicro);
    _vP.sig.mc.s = mc.s * mc.c + _vP.sig.mc.s * (1 - mc.c); _vP.sig.mc.c = Math.min(1, _vP.sig.mc.c + mc.c * 0.15);
    _vScrollMicro = _vScrollMicro.slice(-30);
  }
  if (_vMB.length >= 30) {
    var cv = _vcurvature(_vMB);
    _vP.sig.md.s = cv.s * cv.c + _vP.sig.md.s * (1 - cv.c); _vP.sig.md.c = Math.min(1, _vP.sig.md.c + cv.c * 0.15);
  }
  if (_vCB.length >= 3) {
    var rt = _vreaction(_vCB.slice(1).map(function (c, i) { return c.t - _vCB[i].t; }));
    _vP.sig.ft.s = rt.s * rt.c + _vP.sig.ft.s * (1 - rt.c); _vP.sig.ft.c = Math.min(1, _vP.sig.ft.c + rt.c * 0.2);
  }

  if (_vPasteNoType) { _vP.hp = _vbayes(_vP.hp, 0.05, 0.5); _vPasteNoType = false; }
  _vupdScore(); _vsave(); _vemit('score', { p: _vSc.p, c: _vSc.c, sig: _vSc.sig, nn: _vSc.nn });
}

d.addEventListener('mousemove', function (e) { _vMB.push({ x: e.clientX, y: e.clientY, t: Date.now() }); if (_vMB.length > 512) _vMB = _vMB.slice(-256); }, true);
w.addEventListener('scroll', function () {
  var y = w.scrollY, now = Date.now();
  var dy = y - _vLastScrollY;
  _vSB.push({ dy: dy, y: y, t: now });
  _vScrollMicro.push({ dy: dy, y: y, t: now });
  if (_vScrollMicro.length > 60) _vScrollMicro = _vScrollMicro.slice(-40);
  _vLastScrollY = y; _vLastScrollT = now;
  if (_vSB.length > 40) { _vanalyze(); }
}, { passive: true, capture: true });
d.addEventListener('keydown', function () { _vKB.push({ t: Date.now() }); _vLastKeyT = Date.now(); }, true);
d.addEventListener('click', function (e) { _vCB.push({ x: e.clientX, y: e.clientY, vw: w.innerWidth, vh: w.innerHeight, t: Date.now() }); }, true);
d.addEventListener('touchstart', function (e) { var t = e.touches[0]; if (t) { _vTB.push({ force: t.force || 0, r: (t.radiusX || 0) + (t.radiusY || 0), t: Date.now() }); } }, { passive: true, capture: true });
d.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) { _vTB.push({ force: t.force || 0, r: (t.radiusX || 0) + (t.radiusY || 0), t: Date.now() }); } }, { passive: true, capture: true });

var _mdT = 0;
d.addEventListener('mousedown', function () { _mdT = Date.now(); }, true);
d.addEventListener('mouseup', function () { if (_mdT) { var dwell = Date.now() - _mdT; if (dwell > 0 && dwell < 2000) { _vDwB.push(dwell); if (_vDwB.length > 40) _vDwB.shift(); } } _mdT = 0; }, true);

d.addEventListener('paste', function () {
  var timeSinceKey = _vLastKeyT ? Date.now() - _vLastKeyT : 99999;
  _vPasteEvents++;
  if (timeSinceKey > 3000) _vPasteNoType = true;
}, true);

(function () {
  var _origFetch = w.fetch;
  w.fetch = function () {
    var t0 = performance.now();
    return _origFetch.apply(w, arguments).then(function (r) {
      _vJB.push(performance.now() - t0);
      if (_vJB.length > 100) _vJB.shift();
      return r;
    });
  };
})();
