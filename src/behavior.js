import { w, d } from './env.js';
import { _vDwB, _vPasteEvents, _vTypeBeforePaste } from './telemetry.js';

export var _beh = {
  scrollSamples: [], lastScrollY: 0, lastScrollT: 0, scrollAcc: 0,
  mouseSamples: [], lastMX: 0, lastMY: 0, lastMT: 0,
  idleJitter: 0, idleSamples: 0,
  keyTimes: [], lastKeyT: 0,
  touchRadii: [], tabSwitches: 0,
  focusT: Date.now(),
  clickPositions: [],
  resizeCount: 0,
  contextMenu: false,
  selectionMade: false,
  wheelDeltas: [],
  pasteCount: 0,
  dwellTimes: [],
  blurDurations: [], _blurT: 0,
  gamepadChecked: false, hasGamepadAPI: false,
};
w.addEventListener('focus', function () { _beh.focusT = Date.now() - _beh.focusT; if (_beh._blurT) { _beh.blurDurations.push(Date.now() - _beh._blurT); if (_beh.blurDurations.length > 10) _beh.blurDurations.shift(); } }, true);
w.addEventListener('blur', function () { _beh.tabSwitches++; _beh._blurT = Date.now(); });
w.addEventListener('scroll', function () {
  var now = Date.now(), y = w.scrollY;
  if (_beh.lastScrollT) {
    var dt = now - _beh.lastScrollT, dy = y - _beh.lastScrollY;
    if (dt > 0) {
      var v = dy / dt;
      if (_beh.scrollSamples.length) _beh.scrollAcc += Math.abs(v - _beh.scrollSamples[_beh.scrollSamples.length - 1]);
      _beh.scrollSamples.push(v);
    }
  }
  _beh.lastScrollY = y; _beh.lastScrollT = now;
}, { passive: true });
d.addEventListener('mousemove', function (e) {
  var now = Date.now();
  if (_beh.lastMT) {
    var dt = now - _beh.lastMT;
    if (dt > 50 && dt < 2000) {
      var dist = Math.sqrt(Math.pow(e.clientX - _beh.lastMX, 2) + Math.pow(e.clientY - _beh.lastMY, 2));
      if (dist < 3) { _beh.idleJitter += dist; _beh.idleSamples++; }
    }
  }
  _beh.lastMX = e.clientX; _beh.lastMY = e.clientY; _beh.lastMT = now;
});
d.addEventListener('keydown', function () {
  var now = Date.now();
  if (_beh.lastKeyT) _beh.keyTimes.push(now - _beh.lastKeyT);
  _beh.lastKeyT = now;
});
d.addEventListener('touchstart', function (e) {
  var t = e.touches[0];
  if (t && t.radiusX) _beh.touchRadii.push(t.radiusX + t.radiusY);
}, { passive: true });
d.addEventListener('click', function (e) {
  _beh.clickPositions.push([e.clientX, e.clientY, Date.now()]);
  if (_beh.clickPositions.length > 20) _beh.clickPositions.shift();
});
d.addEventListener('contextmenu', function () { _beh.contextMenu = true; });
d.addEventListener('selectionchange', function () {
  if (d.getSelection && d.getSelection().toString().length > 0) _beh.selectionMade = true;
});
d.addEventListener('wheel', function (e) {
  _beh.wheelDeltas.push(Math.abs(e.deltaY));
}, { passive: true });
w.addEventListener('resize', function () { _beh.resizeCount++; });

export function _behScore() {
  var s = 0;
  if (_beh.scrollSamples.length > 3 && _beh.scrollAcc > 0.5) s += 15;
  if (_beh.idleSamples > 5 && _beh.idleJitter > 0) s += 12;
  if (_beh.tabSwitches > 0) s += 8;
  if (_beh.contextMenu) s += 10;
  if (_beh.selectionMade) s += 8;
  if (_beh.resizeCount > 0) s += 7;

  if (_beh.keyTimes.length > 3) {
    var m = _beh.keyTimes.reduce(function (a, b) { return a + b; }, 0) / _beh.keyTimes.length;
    var v = _beh.keyTimes.reduce(function (a, b) { return a + Math.pow(b - m, 2); }, 0) / _beh.keyTimes.length;
    if (v > 100) s += 15;
  }

  if (_beh.touchRadii.length > 2) {
    var rm = _beh.touchRadii.reduce(function (a, b) { return a + b; }, 0) / _beh.touchRadii.length;
    var rv = _beh.touchRadii.reduce(function (a, b) { return a + Math.pow(b - rm, 2); }, 0) / _beh.touchRadii.length;
    if (rv > 0.1) s += 12;
  }

  if (_beh.clickPositions.length > 2) {
    var notPerfect = _beh.clickPositions.some(function (p, i) {
      if (!i) return false;
      var prev = _beh.clickPositions[i - 1];
      return Math.abs(p[0] - Math.round(p[0])) > 0 || Math.abs(p[1] - Math.round(p[1])) > 0;
    });
    if (notPerfect) s += 10;
  }

  if (_beh.wheelDeltas.length > 2) {
    var wm = _beh.wheelDeltas.reduce(function (a, b) { return a + b; }, 0) / _beh.wheelDeltas.length;
    var wv = _beh.wheelDeltas.reduce(function (a, b) { return a + Math.pow(b - wm, 2); }, 0) / _beh.wheelDeltas.length;
    if (wv > 10) s += 10;
  }


  if (_beh.blurDurations.length > 1) {
    var bm = _beh.blurDurations.reduce(function (a, b) { return a + b; }, 0) / _beh.blurDurations.length;
    var bv = _beh.blurDurations.reduce(function (a, b) { return a + Math.pow(b - bm, 2); }, 0) / _beh.blurDurations.length;
    if (bv > 10000) s += 8;
  }


  if (_vDwB.length > 3) {
    var dm = _vDwB.reduce(function (a, b) { return a + b; }, 0) / _vDwB.length;
    var dv = _vDwB.reduce(function (a, b) { return a + Math.pow(b - dm, 2); }, 0) / _vDwB.length;
    if (dm > 60 && dm < 350) s += 8;
    if (dv > 200) s += 7;
  }


  if (!_beh.gamepadChecked) {
    try {
      var gp = navigator.getGamepads && navigator.getGamepads();
      _beh.hasGamepadAPI = gp !== null && gp !== undefined;
      _beh.gamepadChecked = true;
    } catch (e) {}
  }
  if (_beh.gamepadChecked && _beh.hasGamepadAPI) s += 6;


  if (_vPasteEvents > 0 && _vTypeBeforePaste === 0) s = Math.max(0, s - 15);

  if (_beh.focusT > 200 && _beh.focusT < 30000) s += 8;
  try { if (navigator.getBattery) s += 8; } catch (e) {}
  try {
    var fine = w.matchMedia('(pointer:fine)').matches;
    var mob = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
    if ((fine && !mob) || (!fine && mob)) s += 8;
  } catch (e) {}
  try { if (navigator.languages && navigator.languages.length > 1) s += 5; } catch (e) {}
  return Math.min(100, s);
}
